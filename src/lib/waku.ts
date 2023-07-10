import { writable, get, derived } from 'svelte/store';

import { createLightNode, waitForRemotePeer, createEncoder, createDecoder } from '@waku/sdk';
import { type LightNode, type IDecodedMessage, Protocols } from '@waku/interfaces';
import * as secp from '@noble/secp256k1';
import { bootstrap } from '@libp2p/bootstrap'

const PING_KEEPALIVE = 30;
const BOOTSTRAP_LIST = [
	'/ip4/127.0.0.1/tcp/8000/ws/p2p/16Uiu2HAmPNcgHTD1Au6avQSVemez62ApCxVrDVmEvCgCEXkx4J6D',
]

const topicApp = 'swarm-waku';
const topicVersion = 1;

// --- store variables
const numPeers = writable(0);

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
		pubSubTopic: "/waku/2/dev-waku/proto",
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


	return waku;
}

/**
 * Subscribe to a topic and process the messages using the callback.
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
 * Send a message to a topic.
 * @param waku relay node to use
 * @param topic within the app to send the message to
 * @param payload bytes to send
 * @returns SendResult
 */
async function send(waku: LightNode, topic: string, payload: Uint8Array) {
	const contentTopic = getTopic(topic);
	const encoder = createEncoder({ contentTopic });

	return await waku.lightPush.send(encoder, { payload });
}
}

export interface Session {
	waku: LightNode;
	unsubscribe: () => void;
}

export async function create(options: Options | undefined = undefined): Promise<Session> {
	const privateKeyHex = options?.privateKeyHex;
	const privateKey = privateKeyHex ? secp.etc.hexToBytes(privateKeyHex) : secp.utils.randomPrivateKey();
	const publicKey = secp.getPublicKey(privateKey);

	const waku = await connectWaku();

	return {
		waku,
		unsubscribe: () => {
		}
	}
}

// --- data structures



export { numPeers, wakuStore };
