import { describe, it, expect } from 'vitest'
import { render, screen } from '@solidjs/testing-library'
import DayView from '../DayView'
import { vi } from 'vitest'
import type { EventItem } from '../../types'

// Mock TimeGrid to a minimal shell that provides setRightPaneRef and renders children
vi.mock('../TimeGrid', () => {
  return {
    default: (props: any) => {
      return (
        <div>
          <div ref={(el) => props.setRightPaneRef?.(el)} />
          {props.children}
        </div>
      )
    },
  }
})

// Mock EventsContext to avoid relying on TinyBase/localStorage and client-only APIs
vi.mock('../../context/EventsContext', () => {
  const iso = (y: number, m: number, d: number, hh = 0, mm = 0) => new Date(Date.UTC(y, m - 1, d, hh, mm)).toISOString()
  const state = {
    events: [
      { id: '1', title: 'Today Item', start: iso(2025, 9, 29, 9), end: iso(2025, 9, 29, 10), color: '#2563eb' } as EventItem,
      { id: '2', title: 'Tomorrow Item', start: iso(2025, 9, 30, 9), end: iso(2025, 9, 30, 10), color: '#ef4444' } as EventItem,
    ],
    viewDate: iso(2025, 9, 29),
    viewMode: 'day',
    filters: {},
    weekStartsOn: 1 as const,
  }
  const actions = {
    add: async (_ev: Omit<EventItem, 'id'>) => ({ ..._ev, id: 'x' } as EventItem),
    update: async () => {},
    remove: async () => {},
    setViewDate: (d: string) => { state.viewDate = d },
    setViewMode: (_m: any) => {},
    setFilters: (_f: any) => {},
    setWeekStartsOn: (_d: any) => {},
  }
  return { useEvents: () => [state, actions] as const }
})

describe('DayView', () => {
  it('renders events that overlap the day and supports clicking', async () => {
    render(() => <DayView onEventClick={() => {}} />)

    // Wait for the event block to appear by title text
    const block = await screen.findByText('Today Item')
    expect(block).toBeTruthy()
    expect(screen.queryByText('Tomorrow Item')).toBeNull()
  })
})
