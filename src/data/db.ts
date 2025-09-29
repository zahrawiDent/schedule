import { createStore, type Store, type Row } from 'tinybase'
import { createLocalPersister } from 'tinybase/persisters/persister-browser'
import type { EventItem } from '../types'

// TinyBase store for events persisted to localStorage
export const eventsStore: Store = createStore()

// Create persister for localStorage
export const eventsPersister = createLocalPersister(eventsStore, 'calendar:events')

/**
 * Initialize store and setup auto-persistence
 */
export async function initializeStore(): Promise<void> {
  try {
    // Start auto-load from localStorage (this will load existing data if any)
    await eventsPersister.startAutoLoad()
    
    // Start auto-save to persist changes immediately
    await eventsPersister.startAutoSave()
  } catch (error) {
    console.warn('Failed to initialize TinyBase store:', error)
  }
}

/**
 * Convert EventItem to TinyBase Row format
 */
function eventItemToRow(event: EventItem): Row {
  const row: Row = {}
  Object.keys(event).forEach(key => {
    const value = (event as any)[key]
    // TinyBase Row values must be strings, numbers, or booleans
    if (typeof value === 'object' && value !== null) {
      row[key] = JSON.stringify(value)
    } else {
      row[key] = value
    }
  })
  return row
}

/**
 * Convert TinyBase Row to EventItem format
 */
function rowToEventItem(row: Row): EventItem {
  const event: any = {}
  Object.keys(row).forEach(key => {
    const value = row[key]
    // Parse JSON strings back to objects for complex fields
    if (typeof value === 'string' && (key === 'tags' || key === 'reminderMinutes' || key === 'exdates')) {
      try {
        event[key] = JSON.parse(value)
      } catch {
        event[key] = value
      }
    } else {
      event[key] = value
    }
  })
  return event as EventItem
}

/**
 * Get all events from the store
 */
export function getEvents(): EventItem[] {
  const eventsTable = eventsStore.getTable('events')
  if (!eventsTable) return []
  
  return Object.values(eventsTable).map(row => rowToEventItem(row))
}

/**
 * Add a new event to the store
 */
export function addEvent(event: EventItem): void {
  eventsStore.setRow('events', event.id, eventItemToRow(event))
}

/**
 * Update an existing event in the store
 */
export function updateEvent(id: string, patch: Partial<EventItem>): void {
  const currentRow = eventsStore.getRow('events', id)
  if (currentRow) {
    const currentEvent = rowToEventItem(currentRow)
    const updatedEvent = { ...currentEvent, ...patch }
    eventsStore.setRow('events', id, eventItemToRow(updatedEvent))
  }
}

/**
 * Remove an event from the store
 */
export function removeEvent(id: string): void {
  eventsStore.delRow('events', id)
}

/**
 * Subscribe to changes in the events table
 */
export function subscribeToEvents(callback: (events: EventItem[]) => void): () => void {
  const listenerId = eventsStore.addTableListener('events', () => {
    callback(getEvents())
  })
  
  // Return unsubscribe function
  return () => eventsStore.delListener(listenerId)
}
