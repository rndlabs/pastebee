import { writable, get, derived } from 'svelte/store';

import { createLightNode, waitForRemotePeer, createEncoder, createDecoder } from '@waku/sdk';
import { type LightNode, type IDecodedMessage, Protocols, type Unsubscribe } from '@waku/interfaces';
import * as secp from '@noble/secp256k1';
import { bootstrap } from '@libp2p/bootstrap'
import { getBytes, hexlify } from 'ethers';

import { Ping, Pong } from './proto/discovery';
import { Response, Request } from './proto/retrieval';
import type { Receipt, Delivery } from './proto/pushsync';

import { get_chunk, get_chunk_info } from '@rndlabs/swarm-wasm-lib';

const PING_KEEPALIVE = 30;
const BOOTSTRAP_LIST = [
	'/ip4/127.0.0.1/tcp/8000/ws/p2p/16Uiu2HAmUyv3ghfFzi9R4Hae36TgDavNYpoAuQcDEVr3RveusaXv',
]

const topicApp = 'swarm-waku';
const topicVersion = 1;

// --- store variables
const numPeers = writable(0);
const relays = writable<SwarmRelays>({});
const numRelays = derived(relays, (r) => Object.keys(r).length);

export function getTopic(contentTopic: string) {
	return `/${topicApp}/${topicVersion}/${contentTopic}/proto`;
}

/**
 * Connect to the waku network using a light node and wait for the
 * remote peer to support the filter and light push protocols.
 * @returns A waku node
 */
async function connectWaku() {
	const waku = await createLightNode({
		defaultBootstrap: false,
		libp2p: {
			peerDiscovery: [bootstrap({ list: BOOTSTRAP_LIST })],
		},
		pubSubTopic: "/waku/2/default-waku/proto",
	});

	// --- libp2p events need to come before waku.start()

	waku.libp2p.addEventListener('peer:connect', () => {
		console.log('peer:connect');
		numPeers.update((n) => n + 1);
	});

	waku.libp2p.addEventListener('peer:disconnect', () => {
		console.log('peer:disconnect');
		numPeers.update((n) => n - 1);
	});
	
	// --- attempt to connect to the waku network

	await waku.start();
	await waitForRemotePeer(waku, [Protocols.LightPush, Protocols.Filter]);

	// Do not run any protocols here, we will run them in the create function!

	return waku;
}

/**
 * A helper function for protocols to use when they want to subscribe to a topic.
 * @param waku relay node to use
 * @param topic within the app to use for the message
 * @param callback used to process the message
 * @returns the unsubscribe function
 */
async function subscribe(
	waku: LightNode,
	topic: string,
	callback: (decodedMessage: IDecodedMessage) => void
) {
	const contentTopic = getTopic(topic);
	console.log('subscribing to', contentTopic);
	const messageDecoder = createDecoder(contentTopic);
	const unsubscribe = await waku.filter.subscribe([messageDecoder], callback);

	return unsubscribe;
}

/**
 * A helper function for protocols to send messages to a topic.
 * @param waku relay node to use
 * @param topic within the app to send the message to
 * @param payload bytes to send
 * @returns SendResult
 */
export async function send(waku: LightNode, topic: string, payload: Uint8Array) {
	const contentTopic = getTopic(topic);
	const encoder = createEncoder({ contentTopic });

	return await waku.lightPush.send(encoder, { payload });
}

interface Options {
	privateKeyHex?: string;
}

export interface Session {
	// record the swarm relays for the session
	swarmRelays: string[];

	// public and private keys
	privateKeyHex: string;
	publicKeyHex: string;

	waku: LightNode;
	unsubscribe: () => void;
}

/**
 * Get a session object for waku that can be used to send and receive messages.
 * @param options for the session
 * @returns A session object
 */
export async function create(options: Options | undefined = undefined): Promise<Session> {
	const privateKeyHex = options?.privateKeyHex;
	const privateKey = privateKeyHex ? secp.etc.hexToBytes(privateKeyHex) : secp.utils.randomPrivateKey();
	const publicKey = secp.getPublicKey(privateKey);

	const waku = await connectWaku();

	// run the protocols
	const unsubscribeDiscovery = discovery(waku);
	const unsubscribeRetrieval = retrieval(waku);

	return {
		swarmRelays: [],
		waku,

		// --- keys
		privateKeyHex: secp.etc.bytesToHex(privateKey),
		publicKeyHex: secp.etc.bytesToHex(publicKey),

		unsubscribe: async () => {
			// stop the discovery protocol by cancelling the timer
			clearInterval(unsubscribeDiscovery);
			(await unsubscribeRetrieval)();
		}
	}
}

// --- protocols

// --- discovery (ping/pong)

// --- discovery: data structures

// define a data structure that stores:
// 1. the address of each swarm relay
// 2. the latency to each swarm relay
// 3. an enum that indicates the status of the swarm relay (active, unknown, inactive)

enum RelayStatus {
	Active,
	Unknown,
	Inactive
}

interface SwarmRelay {
	lastSeen: number;
	latency: number;
	status: RelayStatus;
}

interface SwarmRelays {
	[address: string]: SwarmRelay;
}

// --- discovery: logic

function discovery(waku: LightNode): NodeJS.Timer {
	// we will ping for relays every 30 seconds
	return setInterval(async () => {
		// 1. set the status of all swarm relays to unknown
		const _relays = get(relays);
		for (const address in _relays) {
			// only set the status to unknown if it is active
			if (_relays[address].status === RelayStatus.Active) {
				_relays[address].status = RelayStatus.Unknown;
			}
		}
		relays.set(_relays);

		let sendTimestamp: bigint | undefined = undefined;
		const unsubscribe = await subscribe(waku, 'pong', (pong) => {
			const p = Pong.decode(pong.payload);
			const addr = hexlify(p.address);
			console.log('pong', addr);
			
			// measure the round trip time
			if (sendTimestamp === undefined) {
				return;
			}

			const now = BigInt(Date.now());
			const rtt = now - sendTimestamp;
			console.log('rtt', rtt);

			// get the current relays
			const _relays = get(relays);

			// update the status of the relay
			try {
				if (addr in _relays) {
					_relays[addr].lastSeen = Date.now();
					_relays[addr].latency = Number(rtt);
					_relays[addr].status = RelayStatus.Active;
				} else {
					_relays[addr] = {
						lastSeen: Date.now(),
						latency: Number(rtt),
						status: RelayStatus.Active
					};
				}
	
				// update the relays
				relays.set(_relays);	
			} catch (e) {
				console.log('error', e);
			}
		});

		console.log('sending ping');
		sendTimestamp = BigInt(Date.now());
		await send(waku, 'ping', Ping.encode({timestamp: sendTimestamp}));

		// unsubscribe after 5 seconds
		setTimeout(() => {
			console.log('unsubscribing');
			unsubscribe();

			// set the status of all relayers that are still unknown to inactive
			for (const address in _relays) {
				if (_relays[address].status === RelayStatus.Unknown) {
					_relays[address].status = RelayStatus.Inactive;
				}
			}

			relays.set(_relays);
		}, 5000);
	}, PING_KEEPALIVE * 1000);
}

// --- retrieval (request/response)

// --- retrieval: data structures

const chunkCallbacks = new Map<string, (chunk: Uint8Array) => void>();

// --- retrieval: logic

async function retrieval(waku: LightNode): Promise<Unsubscribe> {
	const unsubscribe = await subscribe(waku, 'retrieval-delivery', (response) => {
		const decoded = Response.decode(response.payload);

		const { address } = get_chunk_info(decoded.data)

		// Check if there is a callback for this chunk
		const addr = '0x' + address;
		const callback = chunkCallbacks.get(addr);
		if (callback === undefined) {
			console.log('no callback for chunk', addr)
			return;
		}

		// Call the callback with the raw payload
		callback(decoded.data);
	});

	return unsubscribe;
}

export async function getChunk(waku: LightNode, address: string): Promise<Uint8Array> {
	const chunk = await Promise.race([
		new Promise<Uint8Array>((resolve, reject) => {
			const callback = (chunk: Uint8Array) => {
				resolve(chunk);
			};

			console.log('requesting chunk', address);
			chunkCallbacks.set(address, callback);

			// Send the request
			send(waku, 'retrieval-request', Request.encode({address: getBytes(address)}));
		}),
		new Promise<undefined>((resolve) => {
			setTimeout(() => {
				resolve(undefined);
			}, 5000);
		})
	])

	// ensure that the callback is removed
	chunkCallbacks.delete(hexlify(address));

	if (chunk === undefined) {
		throw new Error('timeout');
	}

	return chunk;
}

// --- pushsync (receipt/delivery)

// TBD

export { numPeers, relays, numRelays };
