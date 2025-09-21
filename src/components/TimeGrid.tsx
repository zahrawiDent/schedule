import type { JSX } from 'solid-js';
import { HOURS, ROW_H } from '../utils/timeGrid'
import { addHours, format, startOfDay } from 'date-fns'

/**
 * Generic single-day time grid with a left labels column and a right absolute grid for events.
 * Provide children positioned absolutely inside the right panel (24h tall).
 */
export default function TimeGrid(props: { anchor: Date; leftColWidth?: number; children: JSX.Element }) {
  const left = props.leftColWidth ?? 60
  return (
    <div class={`grid gap-px bg-gray-50`} style={{ 'grid-template-columns': `${left}px 1fr` }}>
      <div class="bg-white border-b border-gray-200"></div>
      <div class="bg-white p-3 text-center text-sm font-medium text-gray-500 border-b border-gray-200">{format(props.anchor, 'PPPP')}</div>
      <div class="bg-white border-r border-gray-200" style={{ height: `${ROW_H * 24}px` }}>
        {HOURS.map((h) => (
          <div class="h-16 flex items-start justify-end pr-2 text-xs text-gray-500">{format(addHours(startOfDay(props.anchor), h), 'ha')}</div>
        ))}
      </div>
      <div class="relative bg-white border-b border-gray-200" style={{ height: `${ROW_H * 24}px` }}>
        {HOURS.map((h) => (
          h > 0 ? (
            <div class="absolute left-0 right-0 border-b border-gray-200" style={{ top: `${h * ROW_H}px`, 'pointer-events': 'none' }} />
          ) : null
        ))}
        {props.children}
      </div>
    </div>
  )
}
