/** A time segment to be stacked in lanes (minutes within a day). */
export type Seg<T> = { id: string; startMins: number; endMins: number; data: T }

/**
 * Assigns segments to lanes using a greedy sweep-line algorithm.
 * Ensures overlapping segments are placed side by side without overlap.
 * Returns the sorted segments, a map of id->lane index, and the lane count.
 */
export function assignLanes<T>(segs: Array<Seg<T>>) {
  const sorted = segs
    .filter((s) => s.endMins > s.startMins)
    // Stable ordering: sort by start, then by id to avoid left/right swapping while resizing
    .sort((a, b) => (a.startMins - b.startMins) || a.id.localeCompare(b.id))
  const laneEnds: number[] = []
  const laneIndexById = new Map<string, number>()
  for (const seg of sorted) {
    let placed = false
    for (let i = 0; i < laneEnds.length; i++) {
      if (laneEnds[i] <= seg.startMins) {
        laneEnds[i] = seg.endMins
        laneIndexById.set(seg.id, i)
        placed = true
        break
      }
    }
    if (!placed) {
      laneEnds.push(seg.endMins)
      laneIndexById.set(seg.id, laneEnds.length - 1)
    }
  }
  return { sorted, laneIndexById, laneCount: Math.max(1, laneEnds.length) }
}
