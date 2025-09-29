// Minimal ambient typings for the optional legacy storage helper.
// This silences TS module resolution in tsc without requiring the package at build time.
declare module 'idb-keyval' {
  export function get<T = unknown>(key: string): Promise<T | undefined>
  export function set<T = unknown>(key: string, value: T): Promise<void>
}
