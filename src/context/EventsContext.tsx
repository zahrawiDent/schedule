import { createContext, useContext, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { v4 as uuidv4 } from 'uuid'
import type { EventItem, EventId, ViewMode, Filters } from '../types'
import { eventsCollection, migrateFromLegacyIfNeeded } from '../data/db'

type State = {
  events: EventItem[]
  viewDate: string // ISO date for current anchor day
  viewMode: ViewMode
  filters: Filters
}

type Ctx = [
  State,
  {
    add(ev: Omit<EventItem, 'id'>): Promise<EventItem>
    update(id: EventId, patch: Partial<EventItem>): Promise<void>
    remove(id: EventId): Promise<void>
    setViewDate(dateISO: string): void
    setViewMode(mode: ViewMode): void
    setFilters(f: Partial<Filters>): void
  }
]

const EventsCtx = createContext<Ctx>()

export function EventsProvider(props: { children: any }) {
  const [state, setState] = createStore<State>({
    events: [],
    viewDate: new Date().toISOString(),
  viewMode: 'week',
    filters: {},
  })

  // initialize from TanStack DB and subscribe to live changes
  ;(async () => {
    await migrateFromLegacyIfNeeded()
    const initial = (await eventsCollection.toArrayWhenReady()) as EventItem[]
    setState('events', initial)
  })()

  const unsubscribe = eventsCollection.subscribeChanges(() => {
    setState('events', eventsCollection.toArray as unknown as EventItem[])
  }, { includeInitialState: false })
  onCleanup(() => unsubscribe())

  const actions = {
    async add(ev: Omit<EventItem, 'id'>) {
  const newEv: EventItem = { ...ev, id: crypto.randomUUID?.() ?? uuidv4() }
  const tx = eventsCollection.insert(newEv)
  await tx.isPersisted.promise
  return newEv
    },
    async update(id: EventId, patch: Partial<EventItem>) {
  const tx = eventsCollection.update(id, (draft: any) => Object.assign(draft, patch))
  await tx.isPersisted.promise
    },
    async remove(id: EventId) {
  const tx = eventsCollection.delete(id)
  await tx.isPersisted.promise
    },
    setViewDate(dateISO: string) {
      setState('viewDate', dateISO)
    },
    setViewMode(mode: ViewMode) {
      setState('viewMode', mode)
    },
    setFilters(f: Partial<Filters>) {
      setState('filters', (prev) => ({ ...prev, ...f }))
    },
  }

  return (
    <EventsCtx.Provider value={[state, actions]}>{props.children}</EventsCtx.Provider>
  )
}

export function useEvents() {
  const ctx = useContext(EventsCtx)
  if (!ctx) throw new Error('useEvents must be used within EventsProvider')
  return ctx
}
