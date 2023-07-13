import { makeChunkedFile } from '@fairdatasociety/bmt-js'
import { marshalPostageStamp, swarmAddressToBucketIndex } from './signature'

interface Batch {
    batchID: string;
}

interface StampedChunk {
    address: string;
    payload: Buffer;
    stamp: Buffer;
}

export default async function chunkerStamper(payload: Buffer, batchID: string, privateKey: string, timeStamp: number) {
    const stampedChunks: StampedChunk[] = [];
    const chunkedFile = makeChunkedFile(payload)

    const levels = chunkedFile.bmt()
    let counter = 0
    for (const level of levels) {
        for (const chunk of level) {
            const chunkIndex = String(counter++).padStart(5, '0')
            const chunkAddressHex = Buffer.from(chunk.address()).toString('hex')
            const chunkPayload = Buffer.from(Uint8Array.from([...chunk.span(), ...chunk.payload]));
            const chunkBucket = swarmAddressToBucketIndex(16, Buffer.from(chunk.address()))
            const chunkBucketIndex = 0;
            const chunkStamp = await marshalPostageStamp(
                { batchID, depth: 17 } as unknown as any,
                timeStamp,
                Buffer.from(chunk.address()),
                Buffer.from(privateKey, 'hex'),
                chunkBucketIndex,
                chunkBucket
            )
            const stampedChunk = {address: chunkAddressHex, payload: chunkPayload, stamp: chunkStamp}
            stampedChunks.push(stampedChunk)
        }
    }

    return stampedChunks;
}
