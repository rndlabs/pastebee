import { writable } from 'svelte/store';

import { createLightNode, waitForRemotePeer, createEncoder, createDecoder, createRelayNode } from '@waku/sdk';
import { type LightNode, type IDecodedMessage, Protocols, type RelayNode } from '@waku/interfaces';
import * as secp from '@noble/secp256k1';
import { sha256 } from '@noble/hashes/sha256';
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
	return `${topicApp}/${topicVersion}/${contentTopic}`;
}

/**
 * Connect to the waku network using a light node and wait for the
 * remote peer to support the filter and light push protocols.
 * @returns A waku node
 */
async function connectWaku() {
	const waku = await createRelayNode({
		emitSelf: true,
		defaultBootstrap: false,
		libp2p: {
			peerDiscovery: [bootstrap({ list: BOOTSTRAP_LIST })],
		},
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
	await waitForRemotePeer(waku, [Protocols.Relay]);

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
	waku: RelayNode,
	topic: string,
	callback: (decodedMessage: IDecodedMessage) => void
) {
	const contentTopic = getTopic(topic);
	const messageDecoder = createDecoder(contentTopic);
	const unsubscribe = await waku.relay.subscribe([messageDecoder], callback);

	return unsubscribe;
}

/**
 * Send a message to a topic.
 * @param waku relay node to use
 * @param topic within the app to send the message to
 * @param payload bytes to send
 * @returns SendResult
 */
async function send(waku: RelayNode, topic: string, payload: Uint8Array) {
	const contentTopic = getTopic(topic);
	const encoder = createEncoder({ contentTopic });

	return await waku.relay.send(encoder, { payload });
}

export interface Session {
	waku: RelayNode;
	unsubscribe: () => void;
}

// waku
const wakuStore = writable<any>(null);

// Define a timer at which to initialize the Waku node
setTimeout(async () => {
	wakuStore.set(await connectWaku());
}, 1000);

export { numPeers, wakuStore };
