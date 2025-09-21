import { endOfDay, startOfDay } from 'date-fns'
import { rrulestr } from 'rrule'
import type { EventItem, EventOccurrence } from '../types'

export function expandEventsForRange(events: EventItem[], start: Date, end: Date): EventOccurrence[] {
  const out: EventOccurrence[] = []
  for (const ev of events) {
    // Skip detached child events when expanding the parent series; they will be included as normal items
    if (ev.parentId) { out.push(ev as any); continue }
    if (ev.rrule) {
      const dtstart = new Date(ev.start)
      const duration = new Date(ev.end).getTime() - dtstart.getTime()
      const rule = rrulestr(ev.rrule, { dtstart })
      const dates = rule.between(startOfDay(start), endOfDay(end), true)
      for (const d of dates) {
        // Skip excluded occurrence dates
        if ((ev.exdates ?? []).some((x) => new Date(x).getTime() === d.getTime())) continue
        out.push({
          ...ev,
          id: `${ev.id}::${d.toISOString()}`,
          sourceId: ev.id,
          start: d.toISOString(),
          end: new Date(d.getTime() + duration).toISOString(),
        })
      }
    } else {
      out.push(ev)
    }
  }
  return out
}

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
