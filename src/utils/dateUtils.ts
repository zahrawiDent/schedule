/**
 * dateUtils
 * ---------
 * Small helpers wrapping date-fns for calendar-related calculations:
 * - monthGrid/weekRange: generate day arrays for views respecting weekStartsOn
 * - formatting helpers and ISO conversions
 * - mergeDateWithTime, clampEvent, overlapsDay, etc.
 */
import {
  addDays,
  addMinutes,
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isBefore,
  isSameDay,
  isSameMonth,
  isWithinInterval,
  parseISO,
  set,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import type { WeekStartDay } from '../types'

export const fmt = (d: Date | string, f = 'yyyy-MM-dd') => format(typeof d === 'string' ? parseISO(d) : d, f)
export const toISO = (d: Date) => d.toISOString()
export const fromISO = (s: string) => parseISO(s)

export const startOfWeekISO = (d: Date, weekStartsOn: WeekStartDay = 1) => startOfWeek(d, { weekStartsOn })
export const endOfWeekISO = (d: Date, weekStartsOn: WeekStartDay = 1) => endOfWeek(d, { weekStartsOn })

export function monthGrid(date: Date, weekStartsOn: WeekStartDay = 1) {
  const start = startOfWeekISO(startOfMonth(date), weekStartsOn)
  const end = endOfWeekISO(endOfMonth(date), weekStartsOn)
  return eachDayOfInterval({ start, end })
}

export function weekRange(date: Date, weekStartsOn: WeekStartDay = 1) {
  const start = startOfWeekISO(date, weekStartsOn)
  const end = endOfWeekISO(date, weekStartsOn)
  return eachDayOfInterval({ start, end })
}

export function dayRange(date: Date) {
  return eachDayOfInterval({ start: startOfDay(date), end: endOfDay(date) })
}

export function getWeekDayLabels(weekStartsOn: WeekStartDay = 1): string[] {
  const allDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return [...allDays.slice(weekStartsOn), ...allDays.slice(0, weekStartsOn)]
}

export function mergeDateWithTime(date: Date, time: Date) {
  return set(date, {
    hours: time.getHours(),
    minutes: time.getMinutes(),
    seconds: time.getSeconds(),
    milliseconds: 0,
  })
}

export function clampEvent(startISO: string, endISO: string) {
  const s = parseISO(startISO)
  const e = parseISO(endISO)
  if (isBefore(e, s)) return { start: toISO(e), end: toISO(addMinutes(e, 30)) }
  return { start: startISO, end: endISO }
}

export function overlapsDay(date: Date, startISO: string, endISO: string) {
  const s = parseISO(startISO)
  const e = parseISO(endISO)
  return isWithinInterval(date, { start: startOfDay(s), end: endOfDay(e) })
}

export function sameDay(aISO: string, bISO: string) {
  return isSameDay(parseISO(aISO), parseISO(bISO))
}

export function inMonth(date: Date, target: Date) {
  return isSameMonth(date, target)
}

export function weekdayLabel(d: Date) {
  return format(d, 'EEE dd')
}

export function daySlotKey(d: Date) {
  return format(d, 'yyyy-MM-dd')
}

export function addDayISO(iso: string, days: number) {
  return addDays(parseISO(iso), days).toISOString()
}
