/**
 * Lane assignment for overlapping time segments
 * --------------------------------------------
 *
 * This module assigns each time segment (start/end in minutes within a day) to a zero-based
 * lane index such that overlapping segments never share the same lane. Segments that only
 * touch (end == start) are allowed to reuse a lane. The algorithm is greedy and deterministic.
 *
 * Core idea (sweep line):
 * - Sort segments by start minute (and by id as a stable tiebreaker)
 * - Maintain an array `laneEnds`, where laneEnds[i] is the end minute of the last segment placed
 *   into lane i
 * - For each segment in order, place it into the first lane whose end <= segment.start; if none,
 *   create a new lane
 *
 * ASCII sketch
 * ------------
 * Minutes →
 *   0        60       120      180      240
 *   |---------A---------|
 *             |----B----|
 *                       |---C---|
 *
 * Lanes:
 *   lane 0:  [A]                [C]
 *   lane 1:         [B]
 *
 * Touching vs overlapping
 * -----------------------
 *  - Overlap: a.start < b.end and b.start < a.end
 *  - Touching (no overlap): a.end == b.start or b.end == a.start → may share a lane
 *
 * Tie-breaking and stability
 * --------------------------
 *  - Primary sort key: startMins ascending
 *  - Secondary key: id (string) ascending
 *  This makes the output stable across re-renders and reduces horizontal flicker when durations
 *  change but relative ordering at the same minute stays consistent.
 *
 * Complexity
 * ----------
 *  - Sorting: O(n log n)
 *  - Placement: O(n * L) where L is number of lanes (worst-case O(n^2), but typically small)
 */
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
      // If this lane's current segment ends on/before the next start, we can reuse it.
      if (laneEnds[i] <= seg.startMins) {
        laneEnds[i] = seg.endMins
        laneIndexById.set(seg.id, i)
        placed = true
        break
      }
    }
    if (!placed) {
      // No reusable lane found; create a new lane for this segment.
      laneEnds.push(seg.endMins)
      laneIndexById.set(seg.id, laneEnds.length - 1)
    }
  }
  return { sorted, laneIndexById, laneCount: Math.max(1, laneEnds.length) }
}
