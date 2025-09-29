/**
 * TimeGrid
 * --------
 *
 * A presentational component that renders a single-day, 24-hour vertical grid with:
 * - A left column of hour labels
 * - A right column where children are absolutely positioned relative to time
 * - A live "now" indicator (only when the anchor is today) via NowIndicator
 * - A hover indicator snapped to the configured grid
 * - A subtle "today" background tint and a "Today" badge in the header when anchor is today
 *
 * This component does not manage or mutate events. It only provides the visual grid and
 * interaction affordances; consumers position their own children using absolute CSS top/height
 * based on minutes from midnight and the shared ROW_H constant.
 *
 * Coordinate system
 * -----------------
 * The right pane is exactly 24 * ROW_H pixels tall. Minutes are converted to pixels via:
 *  minutesToPixels = minutes * (ROW_H / 60)
 * Children should set style.top (and height) using this scale. The grid does not scroll itself;
 * it simply fills its container.
 *
 * Layout diagram
 * --------------
 *
 *  +---------------------+-------------------------------------------+
 *  |                     |                   Header                  |
 *  |      (empty)        |           format(anchor, 'PPPP')          |
 *  +---------------------+-------------------------------------------+
 *  |  Labels column      |            Right content pane             |
 *  |  width = left (px)  |  height = 24 * ROW_H (px), position: rel  |
 *  |                     |  - absolutely positioned children         |
 *  |  12am               |  - hour grid lines at y = h * ROW_H       |
 *  |  1am                |  - now line (today only)                  |
 *  |  2am                |  - hover line + timestamp                 |
 *  |  ...                |                                           |
 *  |  11pm               |                                           |
 *  +---------------------+-------------------------------------------+
 *
 * Right pane coordinate system (minutes -> pixels)
 * ------------------------------------------------
 *  top of pane = 0 minutes = y = 0 px
 *  1 hour      = 60 minutes = y = ROW_H px
 *  m minutes   => y = m * (ROW_H / 60) px
 *
 *  Example (if ROW_H = 64):
 *   - 1 minute   = 64/60 ≈ 1.067 px
 *   - 30 minutes = 32 px
 *   - 9:15 AM    = (9*60 + 15) * (64/60) = 555 * 1.066.. ≈ 592 px
 *
 *  Annotated right pane (not to scale):
 *
 *    y(px)
 *    0 ─────────────────────────────────────────── 00:00 (midnight)
 *      │
 *     64 ───────────────────────────────────────── 01:00 (hour line)
 *      │
 *    128 ───────────────────────────────────────── 02:00
 *      │    • (hover) 09:15  ── blue line + small label
 *      │
 *    576 ───────────────────────────────────────── 09:00
 *      │
 *    592 ── red now line + dot (if today)
 *      │
 *    ...
 *  1536 ───────────────────────────────────────── 24:00 (bottom)
 *
 * Positioning children (events, selections)
 * -----------------------------------------
 *  const topPx = startMins * (ROW_H / 60)
 *  const heightPx = (endMins - startMins) * (ROW_H / 60)
 *
 *  <div style={{ position: 'absolute', top: `${topPx}px`, height: `${heightPx}px` }} />
 *
 * Interaction affordances
 * -----------------------
 * - setRightPaneRef: parent components can capture the DOM node to convert pointer Y to minutes
 *   by inverting the scale (minutes = y / (ROW_H / 60)).
 * - Hover line snaps to SNAP_MIN increments to mirror creation/editing behavior.
 * - The grid purposefully ignores hover when the pointer is over an element with [data-evid]
 *   to reduce visual noise on top of event blocks.
 *
 * Live "now" indicator
 * NowIndicator owns the timer and visibility updates, decoupled from TimeGrid.
 */
import type { JSX } from 'solid-js';
import { createSignal, Show } from 'solid-js'
import { HOURS, ROW_H, SNAP_MIN, hoursFrom, gridMinsToAbsMins } from '../utils/timeGrid'
import { addHours, format, isToday, startOfDay } from 'date-fns'
import HoverIndicator from './HoverIndicator'
import NowIndicator from './NowIndicator'
import { useEvents } from '../context/EventsContext'

/**
 * Props for TimeGrid
 * - anchor: Required Date representing the day shown. Used for labels and for computing today.
 * - children: Absolutely positioned content rendered in the right pane.
 * - setRightPaneRef: Optional ref to retrieve the right pane element for parent calculations
 *   like pointer-to-minutes conversions or measuring.
 */
type TimeGridProps = {
  anchor: Date
  children: JSX.Element
  setRightPaneRef?: (el: HTMLDivElement | null) => void
}
export default function TimeGrid(props: TimeGridProps) {
  const [state] = useEvents()
  // Width in pixels for the labels column
  // Minutes from midnight under the cursor in the right pane (snapped); null when not hovering
  const [hoverMins, setHoverMins] = createSignal<number | null>(null)
  // TimeGrid no longer owns the "now" interval; NowIndicator handles it per provided date
  const startHour = () => state.dayStartHour ?? 0
  const hours = () => hoursFrom(startHour())
  return (
    // Two-column grid: [labels | content]
    <div class={`grid gap-px bg-gray-50`} style={{ 'grid-template-columns': "60px 1fr" }}>
      {/* Header row: empty cell left, formatted date on the right (highlight if today) */}
      <div class="bg-white border-b border-gray-200"></div>
      <div class={`p-3 text-center text-sm font-medium border-b border-gray-200 ${isToday(props.anchor) ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-500'}`}>
        <span>{format(props.anchor, 'PPPP')}</span>
        <Show when={isToday(props.anchor)}>
          <span class="ml-2 inline-flex items-center rounded-full bg-blue-100 text-blue-700 text-xs px-2 py-0.5 align-middle">Today</span>
        </Show>
      </div>
      {/* Left labels column: 24 rows, one per hour */}
      <div class="bg-white border-r border-gray-200" style={{ height: `${ROW_H * 24}px` }}>
        {hours().map((h) => (
          <div class="h-16 flex items-start justify-end pr-2 text-xs text-gray-500">{format(addHours(startOfDay(props.anchor), h), 'ha')}</div>
        ))}
      </div>
      <div
        class="relative bg-white border-b border-gray-200"
        style={{ height: `${ROW_H * 24}px` }}
        ref={props.setRightPaneRef}
        onMouseMove={(ev) => {
          const rect = (ev.currentTarget as HTMLDivElement).getBoundingClientRect()
          // Don't show hover indicator when over an event block
          const tgt = ev.target as HTMLElement
          if (tgt && tgt.closest('[data-evid]')) { setHoverMins(null); return }
          const y = (ev as any).clientY - rect.top
          // Convert Y in pixels to minutes from midnight using the shared scale (ROW_H per hour)
          const minsRaw = y / (ROW_H / 60)
          // Snap to the configured minute grid to mirror interactions (e.g., 15-min slots)
          const snapped = Math.round(minsRaw / SNAP_MIN) * SNAP_MIN
          const mins = Math.max(0, Math.min(24 * 60 - SNAP_MIN, snapped))
          setHoverMins(mins)
        }}
        onMouseLeave={() => setHoverMins(null)}
      >
        {/* Today background tint for the right pane */}
        <Show when={isToday(props.anchor)}>
          <div class="absolute inset-0 bg-blue-50/40 pointer-events-none" />
        </Show>
        {/* Hour dividers (skip the very first line at 0:00) */}
        {HOURS.map((h) => (
          h > 0 ? (
            <div class="absolute left-0 right-0 border-b border-gray-200" style={{ top: `${h * ROW_H}px`, 'pointer-events': 'none' }} />
          ) : null
        ))}
        {/* "Now" indicator (today only) using shared component */}
        <Show when={isToday(props.anchor)}>
          <NowIndicator date={props.anchor} pxPerMin={ROW_H / 60} startHour={startHour()} />
        </Show>

        {/* Hover indicator: a faint blue line and a tiny timestamp label at the left. */}

        <Show when={hoverMins()}>
          <HoverIndicator
            mins={hoverMins()!}
            pxPerMin={ROW_H / 60}
            label={(() => {
              const absMins = gridMinsToAbsMins(hoverMins() || 0, startHour())
              const d = new Date(props.anchor)
              d.setHours(0, 0, 0, 0)
              d.setMinutes(absMins)
              return format(d, 'h:mm')
            })()}
          />
        </Show>
        {/* Consumer-provided absolutely positioned content (events, selections, etc.) */}
        {props.children}
      </div>
    </div>
  )
}
