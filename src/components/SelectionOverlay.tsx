/**
 * SelectionOverlay
 * ----------------
 * Visual overlay used while the user is selecting a time range in Day/Week views.
 *
 * Renders:
 * - A translucent blue rectangle between start and end minutes
 * - Two small labels: start time at the top and end time at the bottom
 *
 * This component is purely presentational; the parent supplies the minutes to render
 * and the label formatting function.
 */
import { SNAP_MIN } from '../utils/timeGrid'

type SelectionOverlayProps = {
  startMins: number
  endMins: number
  pxPerMin: number
  // Returns a label string for a given minutes-from-midnight value
  labelFor: (mins: number) => string
}

export default function SelectionOverlay(props: SelectionOverlayProps) {
  const start = Math.min(props.startMins, props.endMins)
  const end = Math.max(props.startMins, props.endMins)
  const top = start * props.pxPerMin
  const height = Math.max(SNAP_MIN, Math.abs(end - start)) * props.pxPerMin

  return (
    <div class="absolute inset-x-0 z-30 pointer-events-none">
      <div
        class="absolute left-0 right-0 bg-blue-200/30 border border-blue-300 rounded-sm"
        style={{ top: `${top}px`, height: `${height}px` }}
      />
      <div
        class="absolute left-2 -translate-y-1/2 text-[10px] text-blue-700 bg-white/80 px-1.5 py-0.5 rounded border border-blue-200 shadow-sm"
        style={{ top: `${top}px` }}
      >
        {props.labelFor(start)}
      </div>
      <div
        class="absolute left-2 -translate-y-1/2 text-[10px] text-blue-700 bg-white/80 px-1.5 py-0.5 rounded border border-blue-200 shadow-sm"
        style={{ top: `${top + height}px` }}
      >
        {props.labelFor(end)}
      </div>
    </div>
  )
}
