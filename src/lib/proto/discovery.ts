/* eslint-disable import/export */
/* eslint-disable complexity */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unnecessary-boolean-literal-compare */
/* eslint-disable @typescript-eslint/no-empty-interface */

import { encodeMessage, decodeMessage, message } from 'protons-runtime'
import type { Codec } from 'protons-runtime'
import type { Uint8ArrayList } from 'uint8arraylist'

export interface Ping {
  timestamp: bigint
}

export namespace Ping {
  let _codec: Codec<Ping>

  export const codec = (): Codec<Ping> => {
    if (_codec == null) {
      _codec = message<Ping>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.timestamp != null && obj.timestamp !== 0n)) {
          w.uint32(8)
          w.uint64(obj.timestamp)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length) => {
        const obj: any = {
          timestamp: 0n
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1:
              obj.timestamp = reader.uint64()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: Partial<Ping>): Uint8Array => {
    return encodeMessage(obj, Ping.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList): Ping => {
    return decodeMessage(buf, Ping.codec())
  }
}

export interface Pong {
  timestamp: bigint
  address: Uint8Array
}

export namespace Pong {
  let _codec: Codec<Pong>

  export const codec = (): Codec<Pong> => {
    if (_codec == null) {
      _codec = message<Pong>((obj, w, opts = {}) => {
        if (opts.lengthDelimited !== false) {
          w.fork()
        }

        if ((obj.timestamp != null && obj.timestamp !== 0n)) {
          w.uint32(8)
          w.uint64(obj.timestamp)
        }

        if ((obj.address != null && obj.address.byteLength > 0)) {
          w.uint32(18)
          w.bytes(obj.address)
        }

        if (opts.lengthDelimited !== false) {
          w.ldelim()
        }
      }, (reader, length) => {
        const obj: any = {
          timestamp: 0n,
          address: new Uint8Array(0)
        }

        const end = length == null ? reader.len : reader.pos + length

        while (reader.pos < end) {
          const tag = reader.uint32()

          switch (tag >>> 3) {
            case 1:
              obj.timestamp = reader.uint64()
              break
            case 2:
              obj.address = reader.bytes()
              break
            default:
              reader.skipType(tag & 7)
              break
          }
        }

        return obj
      })
    }

    return _codec
  }

  export const encode = (obj: Partial<Pong>): Uint8Array => {
    return encodeMessage(obj, Pong.codec())
  }

  export const decode = (buf: Uint8Array | Uint8ArrayList): Pong => {
    return decodeMessage(buf, Pong.codec())
  }
}
