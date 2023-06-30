import { writable } from 'svelte/store';

import {
    waitForRemotePeer,
    createDecoder,
    createEncoder,
    bytesToUtf8,
    utf8ToBytes,
    createRelayNode,
} from '@waku/sdk';

// waku
const waku = writable<any>(null);
const numPeers = writable(0);

async function initWaku() {
    const node = await createRelayNode({
        defaultBootstrap: true,
        emitSelf: true,
    });

    node.libp2p.addEventListener('peer:connect', () => {
        numPeers.update((n) => n + 1);
    });
    
    node.libp2p.addEventListener('peer:disconnect', () => {
        numPeers.update((n) => n - 1);
    });

    await node.start();

    waku.set(node);
}

// Define a timer at which to initialize the Waku node
setTimeout(async () => {
    await initWaku();
}, 1000);

export { numPeers, waku };