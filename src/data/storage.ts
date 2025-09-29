import { get, set } from 'idb-keyval'
import type { EventItem, EventId, WeekStartDay } from '../types'

const STORE_KEY = 'calendar:events'

export async function loadEvents(): Promise<EventItem[]> {
  const data = await get<EventItem[]>(STORE_KEY)
  return data ?? []
}

export async function saveEvents(events: EventItem[]): Promise<void> {
  await set(STORE_KEY, events)
}

export async function upsertEvent(ev: EventItem): Promise<void> {
  const list = await loadEvents()
  const i = list.findIndex(e => e.id === ev.id)
  if (i >= 0) list[i] = ev
  else list.push(ev)
  await saveEvents(list)
}

export async function deleteEvent(id: EventId): Promise<void> {
  const list = await loadEvents()
  const next = list.filter(e => e.id !== id)
  await saveEvents(next)
}


// Helper functions for localStorage
// They read/write the user’s preferred “week start day” from localStorage
const WEEK_START_KEY = 'calendar-week-starts-on'

export function loadWeekStartFromStorage(): WeekStartDay {
  try {
    const stored = localStorage.getItem(WEEK_START_KEY)
    if (stored !== null) {
      const parsed = parseInt(stored, 10)
      if (parsed >= 0 && parsed <= 6) {
        return parsed as WeekStartDay
      }
    }
  } catch (error) {
    console.warn('Failed to load week start preference from localStorage:', error)
  }
  return 1 // Default to Monday
}

export function saveWeekStartToStorage(day: WeekStartDay): void {
  try {
    localStorage.setItem(WEEK_START_KEY, day.toString())
  } catch (error) {
    console.warn('Failed to save week start preference to localStorage:', error)
  }
}
