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
    <div class={`grid`} style={{ 'grid-template-columns': `${left}px 1fr` }}>
      <div></div>
      <div class="p-2 text-center font-medium border-b">{format(props.anchor, 'PPPP')}</div>
      <div class="border-r" style={{ height: `${ROW_H * 24}px` }}>
        {HOURS.map((h) => (
          <div class="h-16 flex items-start justify-end pr-2 text-xs text-gray-500">{format(addHours(startOfDay(props.anchor), h), 'ha')}</div>
        ))}
      </div>
      <div class="relative" style={{ height: `${ROW_H * 24}px` }}>
        {HOURS.map((h) => (
          <div class="absolute left-0 right-0 border-b" style={{ top: `${h * ROW_H}px`, 'pointer-events': 'none' }} />
        ))}
        {props.children}
      </div>
    </div>
  )
}
