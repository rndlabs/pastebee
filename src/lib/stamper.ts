import chunkerStamper from './chunkerStamper';
import axios from 'axios';
import { Contract, Wallet, solidityPacked, JsonRpcProvider } from 'ethers';
import POSTAGE_STAMP_ABI from '../abi/PostageStamp.json';
import BZZ_TOKEN_ABI from '../abi/ERC20.json';
import { makeChunkedFile } from '@fairdatasociety/bmt-js';
import { keccak256 } from '@ethersproject/keccak256';

async function generateBatchId(owner: string, nonce: string): Promise<string> {
	const encodePacked = solidityPacked(['bytes32', 'bytes32'], [owner, nonce]);
	return keccak256(encodePacked);
}

const POSTAGE_STAMP_ADDRESS = '0x30d155478eF27Ab32A1D578BE7b84BC5988aF381';
const BZZ_TOKEN_ADDRESS = '0xdBF3Ea6F5beE45c02255B2c26a16F300502F68da';

// const batchID =`
//   "50f705e0d6f733c38b525848603368884503eb4755796b869dd1b75c7ebcb5af";
const privateKey = 'x'; //0x4e9a9cEe6ddcB2baB630F3ED2626e08Afc582696 stamp burner

const timeStamp = 1688492510652;
// const payload = new Uint8Array([0, 1, 2]);

async function wait(ms: number) {
	return new Promise((res) => setTimeout(res, ms));
}


export default async function stamper(payload: Buffer) {
	console.log('test');
	const chunkedFile = makeChunkedFile(payload);
	let provider = new JsonRpcProvider(
		'https://gno.getblock.io/e2fd8ad8-cd39-4d31-8905-a673c6e8ec0b/mainnet/'
	);
	let wallet = new Wallet(privateKey, provider);
	let token = new Contract(BZZ_TOKEN_ADDRESS, BZZ_TOKEN_ABI, wallet);
	let postageStamp = new Contract(POSTAGE_STAMP_ADDRESS, POSTAGE_STAMP_ABI, wallet);

	const allowance = 1000000000000000;

	const _owner = await wallet.getAddress();
	const _depth = 17;
	const _bucketDepth = 16;
	// const _nonce =
	//   "0x0000000000000000000000000000000000000000000000000000000000000017";
	const _nonce = '0x' + Date.now().toString(16).padStart(64, '0');
	const _immutable = 'true';

	const _initialBalancePerChunk = 24000 * 2000;

	const CREATE_BATCH = false;

	let batchId;
	if (CREATE_BATCH) {
		let tx1 = await token.approve(POSTAGE_STAMP_ADDRESS, allowance);
		console.log(tx1);
		let tx1w = await tx1.wait();
		console.log(tx1, tx1w);
		// await wait(10000);

		let tx2 = await postageStamp.createBatch(
			_owner,
			_initialBalancePerChunk,
			_depth,
			_bucketDepth,
			_nonce,
			_immutable
		);
		let tx2w = await tx2.wait();
		console.log(tx2, tx2w);

		batchId = await generateBatchId('0x000000000000000000000000' + _owner.substring(2), _nonce);

		console.log(batchId);

		for (let index = 0; index < 120; index++) {
			console.log(index);
			await wait(1000);
		}
	} else {
		batchId = '0x42e17ad77d64c6eb14c93886dc04aa937dd69c5b7e0186277b44155bfefacb3a';
	}

	const chunkedStamped = await chunkerStamper(payload, batchId.substring(2), privateKey, timeStamp);
	//   50f705e0d6f733c38b525848603368884503eb4755796b869dd1b75c7ebcb5af0000cbe5000000000000018921ff0dbbd429153203dcdd1c7796b053ba2a0e1025a809c4b5b4deca29c02a5658cc0a054fb58853b0bafabe683924746f2900037638d5590b7408ee6b3bbef109fb88501b`
	console.log(chunkedStamped);

	console.log(chunkedStamped[0].payload);

	const headers = {
		'Swarm-Postage-Stamp': chunkedStamped[0].stamp.toString('hex')
	};
	let response = await axios.post('http://localhost:1633/chunks', chunkedStamped[0].payload, {
		headers
	});

	return chunkedStamped;
}
