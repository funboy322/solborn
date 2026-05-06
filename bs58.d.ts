declare module 'bs58' {
  export function decode(s: string): Uint8Array
  export function encode(buf: Uint8Array | number[]): string
  const _default: { decode: typeof decode; encode: typeof encode }
  export default _default
}
