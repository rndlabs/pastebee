/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { encodeMessage, decodeMessage, message } from 'protons-runtime';
import type { Codec } from 'protons-runtime';
import type { Uint8ArrayList } from 'uint8arraylist';

export interface Delivery {
	address: Uint8Array;
	data: Uint8Array;
	stamp: Uint8Array;
}

export namespace Delivery {
	let _codec: Codec<Delivery>;

	export const codec = (): Codec<Delivery> => {
		if (_codec == null) {
			_codec = message<Delivery>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.address != null && obj.address.byteLength > 0) {
						w.uint32(10);
						w.bytes(obj.address);
					}

					if (obj.data != null && obj.data.byteLength > 0) {
						w.uint32(18);
						w.bytes(obj.data);
					}

					if (obj.stamp != null && obj.stamp.byteLength > 0) {
						w.uint32(26);
						w.bytes(obj.stamp);
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length) => {
					const obj: any = {
						address: new Uint8Array(0),
						data: new Uint8Array(0),
						stamp: new Uint8Array(0)
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1:
								obj.address = reader.bytes();
								break;
							case 2:
								obj.data = reader.bytes();
								break;
							case 3:
								obj.stamp = reader.bytes();
								break;
							default:
								reader.skipType(tag & 7);
								break;
						}
					}

					return obj;
				}
			);
		}

		return _codec;
	};

	export const encode = (obj: Partial<Delivery>): Uint8Array => {
		return encodeMessage(obj, Delivery.codec());
	};

	export const decode = (buf: Uint8Array | Uint8ArrayList): Delivery => {
		return decodeMessage(buf, Delivery.codec());
	};
}

export interface Receipt {
	address: Uint8Array;
	signature: Uint8Array;
	nonce: Uint8Array;
}

export namespace Receipt {
	let _codec: Codec<Receipt>;

	export const codec = (): Codec<Receipt> => {
		if (_codec == null) {
			_codec = message<Receipt>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.address != null && obj.address.byteLength > 0) {
						w.uint32(10);
						w.bytes(obj.address);
					}

					if (obj.signature != null && obj.signature.byteLength > 0) {
						w.uint32(18);
						w.bytes(obj.signature);
					}

					if (obj.nonce != null && obj.nonce.byteLength > 0) {
						w.uint32(26);
						w.bytes(obj.nonce);
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length) => {
					const obj: any = {
						address: new Uint8Array(0),
						signature: new Uint8Array(0),
						nonce: new Uint8Array(0)
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1:
								obj.address = reader.bytes();
								break;
							case 2:
								obj.signature = reader.bytes();
								break;
							case 3:
								obj.nonce = reader.bytes();
								break;
							default:
								reader.skipType(tag & 7);
								break;
						}
					}

					return obj;
				}
			);
		}

		return _codec;
	};

	export const encode = (obj: Partial<Receipt>): Uint8Array => {
		return encodeMessage(obj, Receipt.codec());
	};

	export const decode = (buf: Uint8Array | Uint8ArrayList): Receipt => {
		return decodeMessage(buf, Receipt.codec());
	};
}
