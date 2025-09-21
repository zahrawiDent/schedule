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

  return (
    <div>
      <CalendarHeader
        currentDate={date()}
        view={state.viewMode}
        weekStartsOn={state.weekStartsOn}
        onPrevious={() => shift(-1)}
        onNext={() => shift(1)}
        onToday={() => actions.setViewDate(new Date().toISOString())}
        onViewChange={actions.setViewMode}
        onWeekStartChange={actions.setWeekStartsOn}
      />
      {/* <div class="flex items-center gap-2 p-2 border-b sticky top-0 bg-white/70 backdrop-blur z-10"> */}
      {/*   <div class="flex gap-1"> */}
      {/*     <button class="px-2 py-1 rounded border" onClick={() => shift(-1)} aria-label="Previous"> */}
      {/*       ‹ */}
      {/*     </button> */}
      {/*     <button class="px-2 py-1 rounded border" onClick={() => actions.setViewDate(new Date().toISOString())}> */}
      {/*       Today */}
      {/*     </button> */}
      {/*     <button class="px-2 py-1 rounded border" onClick={() => shift(1)} aria-label="Next"> */}
      {/*       › */}
      {/*     </button> */}
      {/*   </div> */}
      {/*   <div class="font-semibold text-lg"> */}
      {/*     {format(date(), state.viewMode === 'month' ? 'MMMM yyyy' : state.viewMode === 'week' ? 'wo, yyyy' : 'PPP')} */}
      {/*   </div> */}
      {/*   <div class="ml-auto flex gap-1" role="tablist" aria-label="Calendar views"> */}
      {/*     {(['month', 'week', 'day'] as ViewMode[]).map((m) => ( */}
      {/*       <button */}
      {/*         role="tab" */}
      {/*         aria-selected={state.viewMode === m} */}
      {/*         class={`px-3 py-1 rounded border ${state.viewMode === m ? 'bg-blue-600 text-white' : ''}`} */}
      {/*         onClick={() => actions.setViewMode(m)} */}
      {/*       > */}
      {/*         {m} */}
      {/*       </button> */}
      {/*     ))} */}
      {/*   </div> */}
      {/* </div> */}
    </div>
  )
}


export type CalendarView = 'month' | 'week' | 'day';

interface CalendarHeaderProps {
  currentDate: Date;
  view: CalendarView;
  weekStartsOn: WeekStartDay;
  onPrevious: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
  onWeekStartChange: (day: WeekStartDay) => void;
}

const VIEW_OPTIONS: { value: CalendarView; label: string; icon: string }[] = [
  { value: 'month', label: 'Month', icon: '📅' },
  { value: 'week', label: 'Week', icon: '📆' },
  { value: 'day', label: 'Day', icon: '📋' }
];

function CalendarHeader(props: CalendarHeaderProps) {

  return (
    <div class="bg-white border-b border-gray-200 px-4 py-3">
      <div class="flex items-center justify-between">
        {/* Left side - Navigation */}
        <div class="flex items-center space-x-4">
          <button
            onClick={props.onPrevious}
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Previous"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <button
            onClick={props.onNext}
            class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            title="Next"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            onClick={props.onToday}
            class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
          >
            Today
          </button>
        </div>

        {/* Center - Date display */}
        <div class="flex-1 text-center">
          <h1 class="text-xl font-semibold text-gray-900">
            {/* {formatDate(props.currentDate, props.view)} */}
            {format(props.currentDate, props.view === 'month' ? 'MMMM yyyy' : props.view === 'week' ? 'wo, yyyy' : 'EEE, MMMM d, yyyy')}
          </h1>
        </div>

        {/* Right side - View switcher and Settings */}
        <div class="flex items-center space-x-3">
          {/* Week Start Day Selector */}
          <div class="flex items-center space-x-2">
            <label for="week-start" class="text-sm font-medium text-gray-700 hidden sm:inline">
              Week starts:
            </label>
            <select
              id="week-start"
              value={props.weekStartsOn}
              onChange={(e) => props.onWeekStartChange(parseInt(e.target.value) as WeekStartDay)}
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
                  onClick={() => props.onViewChange(option.value)}
                  class={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${props.view === option.value
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
  );
}

// const formatDate = (date: Date, view: CalendarView): string => {
//   switch (view) {
//     case 'month':
//       return format(date, 'MMMM yyyy');
//     case 'week':
//       const startOfWeek = new Date(date);
//       startOfWeek.setDate(date.getDate() - date.getDay());
//       const endOfWeek = new Date(startOfWeek);
//       endOfWeek.setDate(startOfWeek.getDate() + 6);
//
//       if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
//         return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'd, yyyy')}`;
//       } else {
//         return `${format(startOfWeek, 'MMM d')} - ${format(endOfWeek, 'MMM d, yyyy')}`;
//       }
//     case 'day':
//       return format(date, 'EEEE, MMMM d, yyyy');
//     default:
//       return format(date, 'MMMM yyyy');
//   }
// };
