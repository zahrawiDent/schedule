import * as TanDB from '@tanstack/db'
import type { Collection } from '@tanstack/db'
import type { EventItem } from '../types'
import { loadEvents as loadLegacyEvents, saveEvents as saveLegacyEvents } from './storage'

// TanStack DB collection for events persisted to localStorage
export const eventsCollection: Collection<EventItem, string> = TanDB.createCollection(
  TanDB.localStorageCollectionOptions<EventItem>({
    storageKey: 'calendar:events',
    getKey: (e: EventItem) => e.id,
  })
)

/**
 * One-time migration from legacy idb-keyval storage to TanStack DB localStorage.
 * If the collection is empty and legacy storage has data, import and clear legacy store.
 */
export async function migrateFromLegacyIfNeeded(): Promise<void> {
  try {
    // If we already have any records, skip migration
    if (eventsCollection.size > 0) return

    // Load legacy data
    const legacy = await loadLegacyEvents().catch(() => [] as EventItem[])
    if (legacy && legacy.length > 0) {
      // Bulk insert (optimistic, persisted by localStorage wrapper)
      const tx = eventsCollection.insert(legacy)
      await tx.isPersisted.promise
      // Clear legacy store to avoid re-import
      await saveLegacyEvents([])
    }
  } catch {
    // Best-effort migration; ignore failures
  }
}
