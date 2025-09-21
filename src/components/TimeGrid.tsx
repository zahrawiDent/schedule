import type { JSX } from 'solid-js';
import { createSignal } from 'solid-js'
import { HOURS, ROW_H, SNAP_MIN } from '../utils/timeGrid'
import { addHours, format, startOfDay } from 'date-fns'

/**
 * Generic single-day time grid with a left labels column and a right absolute grid for events.
 * Provide children positioned absolutely inside the right panel (24h tall).
 */
export default function TimeGrid(props: { anchor: Date; leftColWidth?: number; children: JSX.Element }) {
  const left = props.leftColWidth ?? 60
  const [hoverMins, setHoverMins] = createSignal<number | null>(null)
  return (
    <div class={`grid gap-px bg-gray-50`} style={{ 'grid-template-columns': `${left}px 1fr` }}>
      <div class="bg-white border-b border-gray-200"></div>
      <div class="bg-white p-3 text-center text-sm font-medium text-gray-500 border-b border-gray-200">{format(props.anchor, 'PPPP')}</div>
      <div class="bg-white border-r border-gray-200" style={{ height: `${ROW_H * 24}px` }}>
        {HOURS.map((h) => (
          <div class="h-16 flex items-start justify-end pr-2 text-xs text-gray-500">{format(addHours(startOfDay(props.anchor), h), 'ha')}</div>
        ))}
      </div>
      <div
        class="relative bg-white border-b border-gray-200"
        style={{ height: `${ROW_H * 24}px` }}
        onMouseMove={(ev) => {
          const rect = (ev.currentTarget as HTMLDivElement).getBoundingClientRect()
          // Don't show hover indicator when over an event block
          const tgt = ev.target as HTMLElement
          if (tgt && tgt.closest('[data-evid]')) { setHoverMins(null); return }
          const y = (ev as any).clientY - rect.top
          const minsRaw = y / (ROW_H / 60)
          const snapped = Math.round(minsRaw / SNAP_MIN) * SNAP_MIN
          const mins = Math.max(0, Math.min(24 * 60 - SNAP_MIN, snapped))
          setHoverMins(mins)
        }}
        onMouseLeave={() => setHoverMins(null)}
      >
        {HOURS.map((h) => (
          h > 0 ? (
            <div class="absolute left-0 right-0 border-b border-gray-200" style={{ top: `${h * ROW_H}px`, 'pointer-events': 'none' }} />
          ) : null
        ))}
        {/* hover indicator */}
        {hoverMins() !== null && (
          <>
            <div
              class="absolute left-0 right-0 h-px bg-blue-500/30 z-20 pointer-events-none"
              style={{ top: `${hoverMins()! * (ROW_H / 60)}px` }}
            />
            <div
              class="absolute left-1 -translate-y-1/2 z-20 pointer-events-none text-[10px] px-1.5 py-0.5 rounded border bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200 shadow-sm"
              style={{ top: `${hoverMins()! * (ROW_H / 60)}px` }}
            >
              {format(new Date(props.anchor.getFullYear(), props.anchor.getMonth(), props.anchor.getDate(), 0, hoverMins() || 0), 'h:mm')}
            </div>
          </>
        )}
  {props.children}
      </div>
    </div>
  )
}
