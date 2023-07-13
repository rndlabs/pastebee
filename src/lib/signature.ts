import { Wallet, keccak256, solidityPacked } from 'ethers'

type FlavoredType<Type, Name> = Type & {
    __tag__?: Name;
}
const BATCH_ID_HEX_LENGTH = 64;
type BatchId = HexString<typeof BATCH_ID_HEX_LENGTH>;
type HexString<Length extends number = number> = FlavoredType<string & {
    readonly length: Length;
}, 'HexString'>;

interface PostageBatch {
    batchID: BatchId;
    utilization: number;
    usable: boolean;
    label: '' | string;
    depth: number;
    amount: string;
    bucketDepth: number;
    blockNumber: number;
    immutableFlag: boolean;
    /**
     * The time (in seconds) remaining until the batch expires; -1 signals that the batch never expires; 0 signals that the batch has already expired.
     */
    batchTTL: number;
    exists: boolean;
}



export async function createSignature(
    address: Buffer,
    privateKey: Buffer,
    batchID: Buffer,
    index: Buffer,
    timestamp: number
): Promise<Buffer> {
    if (!Buffer.isBuffer(address)) {
        throw Error('Expected address to be a Buffer')
    }
    if (!Buffer.isBuffer(privateKey)) {
        throw Error('Expected privateKey to be a Buffer')
    }
    if (!Buffer.isBuffer(batchID)) {
        throw Error('Expected batchID to be a Buffer')
    }
    if (address.length !== 32) {
        throw Error('Expected 32 byte address, got ' + address.length + ' bytes')
    }
    if (batchID.length !== 32) {
        throw Error('Expected 32 byte batchID, got ' + batchID.length + ' bytes')
    }
    if (privateKey.length !== 32) {
        throw Error('Expected 32 byte privateKey, got ' + privateKey.length + ' bytes')
    }

    const signer = new Wallet(privateKey.toString('hex'))
    const timestampBuffer = Buffer.alloc(8)
    timestampBuffer.writeBigUInt64BE(BigInt(timestamp))
    const packed = solidityPacked(
        ['bytes32', 'bytes32', 'bytes8', 'bytes8'],
        [address, batchID, index, timestampBuffer]
    )

    const packedBuffer = Buffer.from(packed.slice(2), 'hex')
    const keccaked = keccak256(packedBuffer)
    const signable = Buffer.from(keccaked.startsWith('0x') ? keccaked.slice(2) : keccaked, 'hex')
    const signedHexString = await signer.signMessage(signable)
    const signed = Buffer.from(signedHexString.slice(2), 'hex')
    if (signed.length !== 65) {
        throw Error('Expected 65 byte signature, got ' + signed.length + ' bytes')
    }
    return signed
}

// how are bucket changes handled on dilution?

export async function marshalPostageStamp(
    postageBatch: PostageBatch,
    timestamp: number,
    address: Buffer,
    privateKey: Buffer,
    chunkIndex: number,
    chunkBucket: number
): Promise<Buffer> {
    if (!Buffer.isBuffer(address)) {
        throw Error('Expected address to be a Buffer')
    }
    if (!Buffer.isBuffer(privateKey)) {
        throw Error('Expected privateKey to be a Buffer')
    }
    if (address.length !== 32) {
        throw Error('Expected 32 byte address, got ' + address.length + ' bytes')
    }
    if (privateKey.length !== 32) {
        throw Error('Expected 32 byte privateKey, got ' + privateKey.length + ' bytes')
    }
    const batchID = Buffer.from(postageBatch.batchID, 'hex')
    const index = bucketAndIndexToBuffer(chunkBucket, chunkIndex)
    const signature = await createSignature(address, privateKey, batchID, index, timestamp)
    const buffer = Buffer.alloc(32 + 8 + 8 + 65)
    batchID.copy(buffer, 0)
    index.copy(buffer, 32)
    buffer.writeBigUInt64BE(BigInt(timestamp), 40)
    signature.copy(buffer, 48)
    return buffer
}

export function swarmAddressToBucketIndex(depth: number, address: Buffer): number {
    if (address.length !== 32) {
        throw Error('Expected 32 byte address, got ' + address.length + ' bytes')
    }
    if (depth < 16 || depth > 100) {
        throw Error('Expected depth between 16 and 100, got ' + depth)
    }
    const i = address.readUInt32BE(0)
    return i >>> (32 - depth)
}

function bucketAndIndexToBuffer(bucket: number, index: number): Buffer {
    const buffer = Buffer.alloc(8)
    buffer.writeUInt32BE(bucket)
    buffer.writeUInt32BE(index, 4)
    return buffer
}
