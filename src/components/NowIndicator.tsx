import type { JSX } from 'solid-js'
import { createSignal, onCleanup, createEffect } from 'solid-js'
import { isSameDay } from 'date-fns'
import { absMinsToGridMins } from '../utils/timeGrid'

/**
 * NowIndicator
 * ------------
 * Reusable red "current time" horizontal line with a small dot at the left.
 * Owns its timer and visibility: only renders when `date` is today.
 *
 * Props
 * - date: Date for the column/day; indicator shows only if date is today
 * - pxPerMin: pixel scale (ROW_H / 60)
 * - dotLeft: optional CSS left value for the dot (defaults to '0.25rem')
 */
export default function NowIndicator(props: { date: Date; pxPerMin: number; dotLeft?: string; startHour?: number }): JSX.Element | null {
  const [mins, setMins] = createSignal<number | null>(null)
  const update = () => {
    const now = new Date()
    if (isSameDay(now, props.date)) {
      const abs = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
      const grid = absMinsToGridMins(abs, props.startHour ?? 0)
      setMins(grid)
    } else {
      setMins(null)
    }
  }
  // Init + periodic refresh
  update()
  // update every minute
  const timer = window.setInterval(update, 60 * 1000)
  onCleanup(() => window.clearInterval(timer))
  // Re-evaluate immediately when the date prop changes
  createEffect(() => {
    void props.date
    update()
  })

  const topPx = () => (mins() ?? 0) * props.pxPerMin
  const dotLeft = () => props.dotLeft ?? '0.25rem'
  if (mins() === null) return null
  return (
    <>
      <div
        class="absolute left-0 right-0 h-px bg-red-500 z-30 pointer-events-none"
        style={{ top: `${topPx()}px` }}
      />
      <div
        class="absolute w-2 h-2 bg-red-500 rounded-full -translate-y-1/2 z-30 pointer-events-none"
        style={{ top: `${topPx()}px`, left: dotLeft() }}
      />
    </>
  )
}
