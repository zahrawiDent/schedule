# APIs

EventsContext (`src/context/EventsContext.tsx`)
- State (shape varies; typical):
  - `events: EventItem[]`
  - `viewMode: ViewMode`
  - `viewDate: ISO string`
  - `filters: { query?: string; categories?: Category[] }`
- Actions (typical):
  - `add(event: EventItem)`
  - `update(id: EventId, patch: Partial<EventItem>)`
  - `remove(id: EventId)`
  - `setViewDate(iso: string)`
  - `setViewMode(mode: ViewMode)`
  - `setFilters(partial)`

Components
- TimeGrid(anchor, children, setRightPaneRef?)
- DayView(onEventClick?, onSlotClick?)
- WeekView(...)
- MonthView(...)
- EventBlock(...)
- SelectionOverlay(...)
- HoverIndicator(...)
- NowIndicator(...)

Utils
- timeGrid: `HOURS`, `ROW_H`, `SNAP_MIN`, `pxPerMinute(rowHeight?)`, `snapMins(mins, snap?)`
- occurrence: `expandEventsForRange(events, start, end)`, `filterEvents(occurrences, opts)`
- lanes: `assignLanes(segs)`
- eventUpdates: move/resize math helpers
- dragPreview: ephemeral preview setter/getter
- pointer: pointer capture helpers
- autoScroll: start/stop auto-scrolling during drag
