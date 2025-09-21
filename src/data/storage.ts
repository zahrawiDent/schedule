import { get, set } from 'idb-keyval'
import type { EventItem, EventId } from '../types'

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
