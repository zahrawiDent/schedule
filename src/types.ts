export type ViewMode = 'month' | 'week' | 'day'

export type Category = 'College' | 'Personal' | 'Other'

export type EventId = string

export type WeekStartDay = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=Sunday, 1=Monday, etc.

export interface EventBase {
  id: EventId
  title: string
  start: string // ISO string
  end: string   // ISO string
  allDay?: boolean
  category?: Category
  color?: string // hex or tailwind token
  tags?: string[]
  location?: string
  notes?: string
  reminderMinutes?: number[] // minutes before start
  rrule?: string // iCal RRULE string for recurrence
  exdates?: string[] // ISO datetimes excluded from the recurrence
  parentId?: EventId // if this is a single modified occurrence detached from a series
}

export type EventItem = EventBase

export interface EventOccurrence extends EventBase {
  sourceId?: EventId
}

export interface Filters {
  query?: string
  categories?: Category[]
  dateRange?: { start: string; end: string }
}
