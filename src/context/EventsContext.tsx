import { createContext, useContext, onCleanup } from 'solid-js'
import { createStore } from 'solid-js/store'
import { v4 as uuidv4 } from 'uuid'
import type { EventItem, EventId, ViewMode, Filters, WeekStartDay } from '../types'
import {
  initializeStore,
  getEvents,
  addEvent,
  updateEvent,
  removeEvent,
  subscribeToEvents
} from '../data/db'

type State = {
  events: EventItem[]
  viewDate: string // ISO date for current anchor day
  viewMode: ViewMode
  filters: Filters
  weekStartsOn: WeekStartDay
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
    setWeekStartsOn(day: WeekStartDay): void
  }
]

const EventsCtx = createContext<Ctx>()

// Helper functions for localStorage
const WEEK_START_KEY = 'calendar-week-starts-on'

function loadWeekStartFromStorage(): WeekStartDay {
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

function saveWeekStartToStorage(day: WeekStartDay): void {
  try {
    localStorage.setItem(WEEK_START_KEY, day.toString())
  } catch (error) {
    console.warn('Failed to save week start preference to localStorage:', error)
  }
}

export function EventsProvider(props: { children: any }) {
  const [state, setState] = createStore<State>({
    events: [],
    viewDate: new Date().toISOString(),
    viewMode: 'week',
    filters: {},
    weekStartsOn: loadWeekStartFromStorage(),
  })

    // initialize from TinyBase and subscribe to live changes
    ; (async () => {
      await initializeStore()
      const initial = getEvents()
      setState('events', initial)
    })()

  const unsubscribe = subscribeToEvents((events) => {
    setState('events', events)
  })
  onCleanup(() => unsubscribe())

  // actions is the CRUD operations
  const actions = {
    async add(ev: Omit<EventItem, 'id'>) {
      const newEv: EventItem = { ...ev, id: crypto.randomUUID?.() ?? uuidv4() }
      addEvent(newEv)
      return newEv
    },
    async update(id: EventId, patch: Partial<EventItem>) {
      updateEvent(id, patch)
    },
    async remove(id: EventId) {
      removeEvent(id)
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
    setWeekStartsOn(day: WeekStartDay) {
      setState('weekStartsOn', day)
      saveWeekStartToStorage(day)
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
