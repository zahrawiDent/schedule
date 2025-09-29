/**
 * CalendarNav
 * -----------
 * Top navigation bar for the calendar UI.
 *
 * Features
 * - Previous/Next navigation relative to the current view (month/week/day)
 * - "Today" shortcut to jump the anchor date to the current day
 * - Current anchor date label with format adapted to the active view
 * - Week-start selector (Sunday..Saturday)
 * - View switcher (Month / Week / Day)
 *
 * State integration
 * - Reads state from EventsContext and updates: viewDate, viewMode, weekStartsOn
 */
import { addMonths, addWeeks, addDays, parseISO } from 'date-fns'
import { useEvents } from '../context/EventsContext'
import type { WeekStartDay } from '../types'

import { For } from 'solid-js';
import { format } from 'date-fns';

export default function CalendarNav(props: { onOpenSettings?: () => void; onOpenCheats?: () => void } = {}) {
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
          {/* Help / Cheat Sheet */}
          <button
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Keyboard shortcuts ( ?)"
            onClick={() => props.onOpenCheats?.()}
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10a4 4 0 118 0c0 2-2 3-2 3H10s-2-1-2-3m4 7h.01"/></svg>
          </button>
          {/* Settings button (compact) */}
          <button
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Settings"
            onClick={() => props.onOpenSettings?.()}
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.89 3.31.877 2.42 2.42a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.89 1.543-.877 3.31-2.42 2.42a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.89-3.31-.877-2.42-2.42a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35.49-.119.9-.46 1.066-.951.89-1.543 3.657-.676 2.42-2.42A1.724 1.724 0 007.752 5.383c.426-1.756 2.924-1.756 3.35 0z" />
            </svg>
          </button>
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
