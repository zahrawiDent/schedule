# Persistence

The app uses a TinyBase store (in `src/data/db.ts`) with a localStorage persister for client-side state.

Lifecycle
- On startup: initialize TinyBase store, set schema/defaults, and hydrate from localStorage via persister.
- On changes: subscribe to tables/cells and persist diffs back to localStorage.

Why TinyBase?
- Structured table-like storage with indexes and reactive queries.
- Simple JSON serialization and persistence adapters.

Legacy helper
- `src/data/storage.ts`: IndexedDB via `idb-keyval` for a legacy/simple path. Retained for reference; not used by the main flow. Minimal ambient typings are provided at `src/types/idb-keyval.d.ts` to avoid TS errors without adding a dep.

Server option
- An optional PocketBase backend (`backend/`) can serve the built app. Future work could sync events bi-directionally.
