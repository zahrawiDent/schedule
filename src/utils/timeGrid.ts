/** 0-23 hours for time grid labels. */
export const HOURS = Array.from({ length: 24 }, (_, i) => i)
/** Pixel height for one hour row. */
export const ROW_H = 64 // px per hour
/** Snap granularity in minutes for drag/selection. */
export const SNAP_MIN = 15

/** Convert a row height to pixels per minute (used to map y to minutes). */
export function pxPerMinute(rowHeight = ROW_H) {
  return rowHeight / 60
}

/** Snap minutes to nearest multiple of snap (default SNAP_MIN). */
export function snapMins(mins: number, snap = SNAP_MIN) {
  return Math.round(mins / snap) * snap
}
