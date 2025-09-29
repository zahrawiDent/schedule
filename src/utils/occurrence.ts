// Occurrence utilities:
// - Expand base events (including recurring ones) into concrete per-instance occurrences
// - Provide a simple text/category filter for occurrences
import { endOfDay, startOfDay } from 'date-fns'
import { rrulestr } from 'rrule'
import type { EventItem, EventOccurrence } from '../types'


/**
 * Expand a list of EventItem objects into concrete EventOccurrence instances that fall within [start, end].
 *
 * Notes:
 * - Non-recurring events are returned as-is (overlap filtering can be done by the caller).
 * - Detached children (events with parentId) represent one-off overrides of a series instance and are already concrete,
 *   so we include them directly and do NOT re-expand via RRULE.
 * - Recurring events are expanded using their RRULE with dtstart = ev.start; each instance keeps the base duration.
 * - exdates (exception dates) are respected and skipped.
 * - We use inclusive day-bounded generation (startOfDay(start) .. endOfDay(end)).
 */
export function expandEventsForRange(events: EventItem[], start: Date, end: Date): EventOccurrence[] {
  const out: EventOccurrence[] = []
  for (const ev of events) {
    // Detached overrides are already concrete; pass through unchanged
    if (ev.parentId) { out.push(ev as any); continue }

    if (ev.rrule) {
      // Seed start for the recurrence (RRULE) and a fixed duration carried to each instance
      const dtstart = new Date(ev.start)
      const duration = new Date(ev.end).getTime() - dtstart.getTime()
      // Parse RFC 5545 RRULE and generate dates within the inclusive window (expanded to full days)
      const rule = rrulestr(ev.rrule, { dtstart })
      const dates = rule.between(startOfDay(start), endOfDay(end), true)
      for (const d of dates) {
        // Skip excluded occurrence dates
        if ((ev.exdates ?? []).some((x) => new Date(x).getTime() === d.getTime())) continue
        // Create a concrete occurrence: unique id per instance and link back to the series via sourceId
        out.push({
          ...ev,
          id: `${ev.id}::${d.toISOString()}`,
          sourceId: ev.id,
          start: d.toISOString(),
          end: new Date(d.getTime() + duration).toISOString(),
        })
      }
    } else {
      // Non-recurring event; include as-is
      out.push(ev)
    }
  }
  return out
}

/**
 * Filter occurrences using a free-text query and/or a category allowlist.
 * - query: case-insensitive search over title, tags, location, and notes
 * - categories: if provided and non-empty, only keep events whose category appears in the list
 */
export function filterEvents(events: EventOccurrence[], opts?: { query?: string; categories?: string[] }) {
  const q = opts?.query?.trim().toLowerCase()
  const cats = opts?.categories
  return events.filter((e) => {
    if (q) {
      const hay = `${e.title} ${(e.tags ?? []).join(' ')} ${e.location ?? ''} ${e.notes ?? ''}`.toLowerCase()
      if (!hay.includes(q)) return false
    }
    if (cats && cats.length > 0) {
      if (!e.category || !cats.includes(e.category)) return false
    }
    return true
  })
}
