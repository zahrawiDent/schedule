import { describe, it, expect } from 'vitest'
import { expandEventsForRange, filterEvents } from './occurrence'
import type { EventItem } from '../types'

const iso = (y: number, m: number, d: number, hh = 0, mm = 0) => new Date(Date.UTC(y, m - 1, d, hh, mm)).toISOString()

describe('expandEventsForRange', () => {
  it('returns non-recurring events as-is', () => {
    const events: EventItem[] = [
      { id: 'a', title: 'one', start: iso(2025, 9, 29, 9), end: iso(2025, 9, 29, 10) },
    ]
    const out = expandEventsForRange(events, new Date(iso(2025, 9, 29)), new Date(iso(2025, 9, 29)))
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('a')
    expect(out[0].start).toBe(events[0].start)
  })

  it('expands a weekly RRULE into instances within the day window', () => {
    const base: EventItem = {
      id: 'r1',
      title: 'Weekly',
      start: iso(2025, 9, 22, 9), // Monday
      end: iso(2025, 9, 22, 10),
      rrule: 'FREQ=WEEKLY;BYDAY=MO',
    }
    const out = expandEventsForRange([base], new Date(iso(2025, 9, 29)), new Date(iso(2025, 9, 29)))
    expect(out).toHaveLength(1)
    expect(out[0].id.startsWith('r1::')).toBe(true)
    expect(out[0].sourceId).toBe('r1')
    expect(out[0].start).toBe(iso(2025, 9, 29, 9))
    expect(out[0].end).toBe(iso(2025, 9, 29, 10))
  })

  it('honors exdates by skipping excluded occurrences', () => {
    const ex = iso(2025, 9, 29, 9)
    const base: EventItem = {
      id: 'r2',
      title: 'Weekly',
      start: iso(2025, 9, 22, 9),
      end: iso(2025, 9, 22, 10),
      rrule: 'FREQ=WEEKLY;BYDAY=MO',
      exdates: [ex],
    }
    const out = expandEventsForRange([base], new Date(iso(2025, 9, 29)), new Date(iso(2025, 9, 29)))
    expect(out).toHaveLength(0)
  })

  it('passes through detached children (parentId) as concrete items', () => {
    const child: EventItem = {
      id: 'child-1', parentId: 'series-1', title: 'Override',
      start: iso(2025, 9, 29, 12), end: iso(2025, 9, 29, 13),
    }
    const out = expandEventsForRange([child], new Date(iso(2025, 9, 29)), new Date(iso(2025, 9, 29)))
    expect(out).toHaveLength(1)
    expect(out[0].id).toBe('child-1')
    expect(out[0].start).toBe(child.start)
  })

  it('uses inclusive window bounds via startOfDay/endOfDay', () => {
    const base: EventItem = {
      id: 'r3', title: 'Weekly',
      start: iso(2025, 9, 22, 0), end: iso(2025, 9, 22, 1),
      rrule: 'FREQ=WEEKLY;BYDAY=MO',
    }
    // Range exactly the day; should include the 00:00 occurrence
    const out = expandEventsForRange([base], new Date(iso(2025, 9, 29)), new Date(iso(2025, 9, 29)))
    expect(out).toHaveLength(1)
    expect(out[0].start).toBe(iso(2025, 9, 29, 0))
  })
})

describe('filterEvents', () => {
  it('filters by query across title/tags/location/notes', () => {
    const items = [
      { id: '1', title: 'Dentist Visit', start: iso(2025, 9, 29, 9), end: iso(2025, 9, 29, 10), tags: ['health'] },
      { id: '2', title: 'Standup', start: iso(2025, 9, 29, 9), end: iso(2025, 9, 29, 10), notes: 'daily sync' },
    ] satisfies EventItem[]
    const out = filterEvents(items, { query: 'dentist' })
    expect(out.map(o => o.id)).toEqual(['1'])
  })

  it('filters by category allowlist', () => {
    const items = [
      { id: '1', title: 'A', start: iso(2025, 9, 29, 9), end: iso(2025, 9, 29, 10), category: 'Personal' },
      { id: '2', title: 'B', start: iso(2025, 9, 29, 9), end: iso(2025, 9, 29, 10), category: 'College' },
    ] satisfies EventItem[]
    const out = filterEvents(items, { categories: ['College'] as any })
    expect(out.map(o => o.id)).toEqual(['2'])
  })
})
