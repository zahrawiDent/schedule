import type { JSX } from 'solid-js'

/**
 * HoverIndicator
 * --------------
 * Reusable horizontal hover line with a small timestamp label.
 *
 * Props
 * - mins: minutes from midnight used to position vertically
 * - pxPerMin: pixel scale (ROW_H / 60)
 * - label: pre-formatted time string to show in the bubble
 */
export default function HoverIndicator(props: { mins: number; pxPerMin: number; label: string }): JSX.Element {
  const topPx = () => props.mins * props.pxPerMin
  return (
    <>
      <div
        class="absolute left-0 right-0 h-px bg-blue-500/30 z-10 pointer-events-none"
        style={{ top: `${topPx()}px` }}
      />
      <div
        class="absolute left-1 -translate-y-1/2 z-10 pointer-events-none text-[10px] px-1.5 py-0.5 rounded border bg-white/80 backdrop-blur-sm text-gray-700 border-gray-200 shadow-sm"
        style={{ top: `${topPx()}px` }}
      >
        {props.label}
      </div>
    </>
  )
}
