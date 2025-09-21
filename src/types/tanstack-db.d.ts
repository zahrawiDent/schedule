declare module '@tanstack/db' {
  export type Collection<T extends object, TKey extends string | number = string | number> = {
    /** Current derived array state */
    toArray: Array<T>
    /** Promise that resolves when the first sync is ready */
    toArrayWhenReady: () => Promise<Array<T>>
    /** Live change subscription */
    subscribeChanges: (
      callback: (changes: Array<{ type: 'insert' | 'update' | 'delete'; key: TKey; value?: T }>) => void,
      options?: { includeInitialState?: boolean }
    ) => () => void
    /** Insert item(s) */
    insert: (
      data: T | Array<T>,
      config?: { metadata?: Record<string, unknown>; optimistic?: boolean }
    ) => { isPersisted: { promise: Promise<any> } }
    /** Update by key */
    update: (
      key: TKey,
      callback: (draft: T) => void
    ) => { isPersisted: { promise: Promise<any> } }
    /** Delete by key(s) */
    delete: (
      key: TKey | Array<TKey>,
      config?: { metadata?: Record<string, unknown>; optimistic?: boolean }
    ) => { isPersisted: { promise: Promise<any> } }
    /** Number of rows considering optimistic state */
    size: number
  }

  export function createCollection<T extends object, TKey extends string | number = string | number>(
    options: any
  ): Collection<T, TKey>

  export function localStorageCollectionOptions<T extends object>(config: {
    storageKey: string
    getKey: (e: T) => string | number
    storage?: Storage
    storageEventApi?: any
    id?: string
  }): any
}
