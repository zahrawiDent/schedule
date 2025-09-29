/**
 * slots
 * -----
 * Helpers to compute default/new event time slots based on user interactions.
 */
import { SNAP_MIN, snapMins } from './timeGrid'

/**
 * Compute default start/end for a Month day click: noon + 1 hour.
 */
export function defaultMonthClickTimes(day: Date) {
  const start = new Date(day)
  start.setHours(12, 0, 0, 0)
  const end = new Date(start.getTime() + 60 * 60000)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}

/**
 * Given a day, a vertical click position, and px-per-minute, return snapped start/end.
 * - durationMin default 60
 */
export function timesFromVerticalClick(day: Date, yPx: number, pxPerMin: number, durationMin = 60, snap = SNAP_MIN) {
  const mins = snapMins(Math.max(0, Math.min(24 * 60 - snap, yPx / pxPerMin)), snap)
  const start = new Date(day)
  start.setHours(0, 0, 0, 0)
  start.setMinutes(mins)
  const end = new Date(start.getTime() + durationMin * 60000)
  return { startISO: start.toISOString(), endISO: end.toISOString() }
}
