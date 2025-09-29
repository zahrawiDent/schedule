# Interactions

This page describes drag, resize, selection, keyboard, hover, and edge navigation behaviors.

Coordinate system
- Right pane height = 24 * ROW_H pixels. Minutes → pixels via `px = mins * (ROW_H/60)`.
- Snap granularity `SNAP_MIN` (15m by default) used for creation and editing.

Drag to move (DayView)
- Start: pointer down on EventBlock. Visual preview stored in `dragPreview` state keyed by baseId.
- Move: pointer Y → minutes via `y / (ROW_H/60)`, snapped; preview.startMins set.
- Edge navigation: while dragging near horizontal edges of the right pane, a timer advances day by ±1 repeatedly.
- End: commit `computeMoveWithinDay` patch to base event and clear preview.

Resize end (DayView)
- Start: pointer down on resize handle when the segment ends on this day.
- Move: pointer Y → minutes; set preview.endMins.
- End: commit `computeResizeWithinDay` patch and clear preview.

Selection (create)
- Pointer down on empty slot records startMin. Pointer move updates a `[start,end]` range.
- On release: if range length is 0, create a 60-minute event; else create with selected end.

Keyboard
- Roving focus: Ctrl+ArrowUp/Down focus previous/next EventBlock.
- Open: Enter fires onEventClick.
- Delete: Backspace/Delete removes the base event.
- Nudge: ArrowUp/Down move start by `SNAP_MIN` (start segment only). ArrowLeft/Right resize end by `SNAP_MIN` (end segment only).

Hover
- HoverIndicator shows a thin line + label at the snapped minute, hidden over elements with `[data-evid]` to avoid clutter.

Now indicator
- NowIndicator draws a red line/dot only when `isToday(anchor)`. It owns an internal timer to update position each minute.

Edge cases
- Multi-day events are clamped to the visible day when rendering segments.
- Touching segments (end == next start) share lanes.
- Recurring events create unique occurrence IDs (`baseId::isoStart`); lane IDs use occurrence IDs to avoid unintended collisions.
