# Components

This page lists the main components, their responsibilities, and notable props. All components use the shared time grid math (see `src/utils/timeGrid.ts`).

- TimeGrid (`src/components/TimeGrid.tsx`)
  - Presentational 24h grid with labels, hover indicator, NowIndicator, and a subtle “today” tint when `anchor` is today.
  - Props: `anchor: Date`, `children: JSX.Element`, `setRightPaneRef?: (el) => void`.

- DayView (`src/components/DayView.tsx`)
  - Renders one day with collision-aware lanes and interactive EventBlock(s).
  - Expands recurrences to occurrences in the day; clamps multi-day segments.
  - Handles drag to move, resize end, drag-to-select to create, keyboard roving focus and nudges, and edge navigation across days.
  - Props: `onEventClick?(id, patch)`, `onSlotClick?(startISO, endISO)`.

- WeekView (`src/components/WeekView.tsx`)
  - Seven-day layout using the same grid math per day. Today’s column shows the NowIndicator.
  - Uses the same lane algorithm per day, with cross-day drag logic.

- MonthView (`src/components/MonthView.tsx`)
  - Month grid with daily event previews, roving focus, and basic drag-and-drop across days.

- EventBlock (`src/components/EventBlock.tsx`)
  - Absolutely positioned event UI with drag and resize handles. Visual-only; callers commit changes.
  - Core props: `id`, `title`, `color`, `startISO`, `endISO`, `draggable`, `resizable`, `onDragMove2D`, `onDragStart`, `onDragEnd`, `onResize`, `onResizeStart`, `onResizeEnd`, `onKeyDown`, `setRef`, `style`.

- SelectionOverlay (`src/components/SelectionOverlay.tsx`)
  - Visual selection panel when drag-selecting in empty time. Props: `startMins`, `endMins`, `pxPerMin`, `labelFor(mins)`.

- HoverIndicator (`src/components/HoverIndicator.tsx`)
  - Thin line + time label at hovered minute, snapped to `SNAP_MIN`. Props: `mins`, `pxPerMin`, `label`.

- NowIndicator (`src/components/NowIndicator.tsx`)
  - Live “now” line and dot, visible only if `isToday(anchor)`. Owns its own timer.

- CalendarNav, Sidebar, MonthCell, MonthPill, EventForm
  - UI scaffolding for navigation, filters, month cells, and event editing.

Context/state
- EventsContext (`src/context/EventsContext.tsx`)
  - App state and actions: CRUD, filters, view date/mode, persistence hook-up.

Data
- TinyBase store wrapper (`src/data/db.ts`) and legacy `storage.ts` (IndexedDB helper).
