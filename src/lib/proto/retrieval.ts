/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { encodeMessage, decodeMessage, message } from 'protons-runtime';
import type { Codec } from 'protons-runtime';
import type { Uint8ArrayList } from 'uint8arraylist';

export interface Request {
	address: Uint8Array;
}

export namespace Request {
	let _codec: Codec<Request>;

	export const codec = (): Codec<Request> => {
		if (_codec == null) {
			_codec = message<Request>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.address != null && obj.address.byteLength > 0) {
						w.uint32(10);
						w.bytes(obj.address);
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length) => {
					const obj: any = {
						address: new Uint8Array(0)
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1:
								obj.address = reader.bytes();
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

	export const encode = (obj: Partial<Request>): Uint8Array => {
		return encodeMessage(obj, Request.codec());
	};

	export const decode = (buf: Uint8Array | Uint8ArrayList): Request => {
		return decodeMessage(buf, Request.codec());
	};
}

export interface Response {
	data: Uint8Array;
	stamp: Uint8Array;
}

export namespace Response {
	let _codec: Codec<Response>;

	export const codec = (): Codec<Response> => {
		if (_codec == null) {
			_codec = message<Response>(
				(obj, w, opts = {}) => {
					if (opts.lengthDelimited !== false) {
						w.fork();
					}

					if (obj.data != null && obj.data.byteLength > 0) {
						w.uint32(10);
						w.bytes(obj.data);
					}

					if (obj.stamp != null && obj.stamp.byteLength > 0) {
						w.uint32(18);
						w.bytes(obj.stamp);
					}

					if (opts.lengthDelimited !== false) {
						w.ldelim();
					}
				},
				(reader, length) => {
					const obj: any = {
						data: new Uint8Array(0),
						stamp: new Uint8Array(0)
					};

					const end = length == null ? reader.len : reader.pos + length;

					while (reader.pos < end) {
						const tag = reader.uint32();

						switch (tag >>> 3) {
							case 1:
								obj.data = reader.bytes();
								break;
							case 2:
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

	export const encode = (obj: Partial<Response>): Uint8Array => {
		return encodeMessage(obj, Response.codec());
	};

	export const decode = (buf: Uint8Array | Uint8ArrayList): Response => {
		return decodeMessage(buf, Response.codec());
	};
}
