# Lanes algorithm

Goal
- Place overlapping time segments side-by-side without visual overlap. Adjacent (touching) segments may reuse lanes.

Approach
- Greedy sweep-line.
- Sort by start, then by id to stabilize left-right ordering while editing.
- Maintain `laneEnds[]` of the current end time for each lane.
- For each segment, place it into the first lane whose end <= seg.start; otherwise append a new lane.

Return value
- `{ sorted, laneIndexById, laneCount }` where `sorted` preserves the enhanced segment shape including `data`.

Corner cases
- Touching segments share a lane (no gap required).
- Multi-day events are clamped to the visible day before allocation.
- Using occurrence IDs prevents recurring instances from colliding with each other.

Complexity
- O(n log n) due to sorting; O(n * L) lane probe where L is small in practice.

Reference
- Implementation at `src/utils/lanes.ts`.
