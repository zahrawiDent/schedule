/**
 * eventUpdates
 * ------------
 * Pure helper functions that compute new EventItem start/end values in response to UI actions.
 * All functions are timezone-agnostic and operate on ISO strings using the provided day/indices.
 *
 * Contracts
 * - Inputs: base event, anchor day (or week start + day index), target minutes from midnight
 * - Snapping: callers pass in snap() and SNAP_MIN to enforce consistent grid behavior
 * - Outputs: minimal patch objects suitable for actions.update
 */
import { parseISO } from 'date-fns'

import type { EventItem } from '../types'

const MS_IN_MIN = 60_000

export function computeMoveWithinDay(ev: EventItem, day: Date, newStartMins: number, snap: (m: number) => number, SNAP_MIN: number) {
  const start = parseISO(ev.start)
  const end = parseISO(ev.end)
  const durMins = Math.max(0, (end.getTime() - start.getTime()) / MS_IN_MIN)
  const d = new Date(day)
  d.setHours(0, 0, 0, 0)
  d.setMinutes(snap(Math.max(0, Math.min(24 * 60 - SNAP_MIN, newStartMins))))
  const newEnd = new Date(d.getTime() + durMins * MS_IN_MIN)
  return { start: d.toISOString(), end: newEnd.toISOString() }
}

export function computeResizeWithinDay(ev: EventItem, day: Date, newEndMins: number, snap: (m: number) => number, SNAP_MIN: number) {
  const start = parseISO(ev.start)
  const minEnd = start.getHours() * 60 + start.getMinutes() + SNAP_MIN
  const mins = snap(Math.max(minEnd, Math.min(24 * 60, newEndMins)))
  const d = new Date(day)
  d.setHours(0, 0, 0, 0)
  d.setMinutes(mins)
  return { end: d.toISOString() }
}

export function computeMoveToDay(ev: EventItem, weekStart: Date, dayIndex: number, newStartMins: number, snap: (m: number) => number, SNAP_MIN: number) {
  const start = parseISO(ev.start)
  const end = parseISO(ev.end)
  const durMins = Math.max(0, (end.getTime() - start.getTime()) / MS_IN_MIN)
  const base = new Date(weekStart)
  base.setDate(base.getDate() + Math.max(0, Math.min(6, dayIndex)))
  base.setHours(0, 0, 0, 0)
  base.setMinutes(snap(Math.max(0, Math.min(24 * 60 - SNAP_MIN, newStartMins))))
  const newEnd = new Date(base.getTime() + durMins * MS_IN_MIN)
  return { start: base.toISOString(), end: newEnd.toISOString() }
}

export function computeResizeToDay(ev: EventItem, weekStart: Date, dayIndex: number, newEndMins: number, snap: (m: number) => number, SNAP_MIN: number) {
  const start = parseISO(ev.start)
  const endDay = new Date(weekStart)
  endDay.setDate(endDay.getDate() + Math.max(0, Math.min(6, dayIndex)))
  endDay.setHours(0, 0, 0, 0)
  const minsClamped = snap(Math.max(0, Math.min(24 * 60, newEndMins)))
  const proposedEnd = new Date(endDay)
  proposedEnd.setMinutes(minsClamped)
  const minEndTime = start.getTime() + SNAP_MIN * MS_IN_MIN
  if (proposedEnd.getTime() < minEndTime) proposedEnd.setTime(minEndTime)
  return { end: proposedEnd.toISOString() }
}
