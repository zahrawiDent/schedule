import { addMonths, addWeeks, addDays, parseISO } from 'date-fns'
import { useEvents } from '../context/EventsContext'
import type { WeekStartDay } from '../types'

import { For } from 'solid-js';
import { format } from 'date-fns';

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

  const VIEW_OPTIONS: { value: typeof state.viewMode; label: string; icon: string }[] = [
    { value: 'month', label: 'Month', icon: '📅' },
    { value: 'week', label: 'Week', icon: '📆' },
    { value: 'day', label: 'Day', icon: '📋' }
  ];

  return (
    <div class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        {/* Left side - Navigation */}
        <div class="flex items-center space-x-4">
          <button
            onClick={() => shift(-1)}
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Previous"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={() => shift(1)}
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Next"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={() => actions.setViewDate(new Date().toISOString())}
            class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Center - Date display */}
        <div class="flex-1 text-center">
          <h1 class="text-xl font-semibold text-gray-900">
            {format(date(), state.viewMode === 'month' ? 'MMMM yyyy' : state.viewMode === 'week' ? 'wo, yyyy' : 'EEE, MMMM d, yyyy')}
          </h1>
        </div>

        {/* Right side - Week Start Day Selector and View switcher */}
        <div class="flex items-center space-x-3">
          {/* Week Start Day Selector */}
          <div class="flex items-center space-x-2">
            <label for="week-start" class="text-sm font-medium text-gray-700 hidden sm:inline">
              Week starts:
            </label>
            <select
              id="week-start"
              value={state.weekStartsOn}
              onChange={(e) => actions.setWeekStartsOn(parseInt(e.target.value) as WeekStartDay)}
              class="text-sm border border-gray-300 rounded-md px-2 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={0}>Sunday</option>
              <option value={1}>Monday</option>
              <option value={2}>Tuesday</option>
              <option value={3}>Wednesday</option>
              <option value={4}>Thursday</option>
              <option value={5}>Friday</option>
              <option value={6}>Saturday</option>
            </select>
          </div>

          <div class="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
            <For each={VIEW_OPTIONS}>
              {(option) => (
                <button
                  onClick={() => actions.setViewMode(option.value)}
                  class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${state.viewMode === option.value
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  title={option.label}
                >
                  <span class="mr-1">{option.icon}</span>
                  <span class="hidden sm:inline">{option.label}</span>
                </button>
              )}
            </For>
          </div>
        </div>
      </div>
    </div>
  )
}
