/**
 * timeGrid utils
 * --------------
 * Shared constants and helpers for converting between minutes and pixels and snapping.
 */
/** 0-23 hours for time grid labels (base). */
export const HOURS = Array.from({ length: 24 }, (_, i) => i)
/** Pixel height for one hour row. */
export const ROW_H = 64 // px per hour
/** Snap granularity in minutes for drag/selection. */
export const SNAP_MIN = 15

/** Convert a row height to pixels per minute (used to map y to minutes). */
export function pxPerMinute(rowHeight = ROW_H) {
  return rowHeight / 60
}

/** Snap minutes to nearest multiple of snap (default SNAP_MIN). e.g, 40 -> 45, 25 -> 30 */
export function snapMins(mins: number, snap = SNAP_MIN) {
  return Math.round(mins / snap) * snap
}

/**
 * Build a cyclic sequence of 24 hours starting from `startHour` (0-23).
 * Example: startHour=5 => [5,6,...,23,0,1,2,3,4]
 */
export function hoursFrom(startHour: number) {
  const s = Math.max(0, Math.min(23, Math.floor(startHour)))
  return Array.from({ length: 24 }, (_, i) => (s + i) % 24)
}

/** Map absolute minutes-from-midnight to grid Y minutes using an offset startHour. */
export function absMinsToGridMins(absMins: number, startHour: number) {
  const offset = (Math.max(0, Math.min(23, Math.floor(startHour)))) * 60
  return (absMins - offset + 24 * 60) % (24 * 60)
}

/** Map grid Y minutes back to absolute minutes-from-midnight using startHour. */
export function gridMinsToAbsMins(gridMins: number, startHour: number) {
  const offset = (Math.max(0, Math.min(23, Math.floor(startHour)))) * 60
  return (gridMins + offset) % (24 * 60)
}
