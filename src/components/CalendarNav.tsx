import { format, addMonths, addWeeks, addDays, parseISO } from 'date-fns'
import type { ViewMode } from '../types'
import { useEvents } from '../context/EventsContext'

export default function CalendarNav() {
  const [state, actions] = useEvents()
  const date = () => parseISO(state.viewDate)

  function shift(delta: number) {
    const d = date()
    const next =
      state.viewMode === 'month'
        ? addMonths(d, delta)
        : state.viewMode === 'week'
        ? addWeeks(d, delta)
        : addDays(d, delta)
    actions.setViewDate(next.toISOString())
  }

  return (
    <div class="flex items-center gap-2 p-2 border-b sticky top-0 bg-white/70 backdrop-blur z-10">
      <div class="flex gap-1">
        <button class="px-2 py-1 rounded border" onClick={() => shift(-1)} aria-label="Previous">
          ‹
        </button>
        <button class="px-2 py-1 rounded border" onClick={() => actions.setViewDate(new Date().toISOString())}>
          Today
        </button>
        <button class="px-2 py-1 rounded border" onClick={() => shift(1)} aria-label="Next">
          ›
        </button>
      </div>
      <div class="font-semibold text-lg">
        {format(date(), state.viewMode === 'month' ? 'MMMM yyyy' : state.viewMode === 'week' ? 'wo, yyyy' : 'PPP')}
      </div>
      <div class="ml-auto flex gap-1" role="tablist" aria-label="Calendar views">
        {(['month', 'week', 'day'] as ViewMode[]).map((m) => (
          <button
            role="tab"
            aria-selected={state.viewMode === m}
            class={`px-3 py-1 rounded border ${state.viewMode === m ? 'bg-blue-600 text-white' : ''}`}
            onClick={() => actions.setViewMode(m)}
          >
            {m}
          </button>
        ))}
      </div>
    </div>
  )
}
