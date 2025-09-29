# Data model

Types live in `src/types.ts`.

Core types
- ViewMode: 'month' | 'week' | 'day'
- Category: 'College' | 'Personal' | 'Other'
- EventId: string
- WeekStartDay: 0..6 (0=Sun)
- EventItem: base event, one-off or recurring via `rrule` and `exdates`.
  - Fields: id, title, start ISO, end ISO, allDay?, category?, color?, tags?, location?, notes?, reminderMinutes?, rrule?, exdates?, parentId?
- EventOccurrence: like EventItem plus `sourceId` (points to base for series instances). Occurrence `id` is unique (`baseId::startISO`).

Occurrences
- `expandEventsForRange(events, start, end)` returns concrete occurrences within a range.
- Non-recurring events pass through unchanged.
- Recurring events are expanded using `rrulestr(rrule, { dtstart: start })` and keep base duration.
- `exdates` are skipped; `parentId` events are treated as detached overrides (not re-expanded).

Filtering
- `filterEvents(occurrences, { query?, categories? })` matches against title, tags, location, notes; filters by category allowlist if provided.
