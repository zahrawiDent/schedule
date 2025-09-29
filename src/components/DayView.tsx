/**
 * DayView
 * -------
 *
 * Renders a single day's time grid (via TimeGrid) along with interactive event blocks.
 *
 * Responsibilities
 * - Expand recurring events to concrete occurrences for the anchor day
 * - Compute collision-aware lanes so overlapping events sit side-by-side
 * - Provide drag-to-move and resize interactions with snapping
 * - Provide drag-to-select on empty time to quickly create an event
 * - Support keyboard roving focus and nudges
 * - Provide instant visual feedback during drag/resize while DEBOUNCING the actual state updates
 *
 * Data flow
 * ---------
 *  state.events ──expandEventsForRange──▶ occurrences
 *        │                                 │
 *        └───────────── filter ◀───────────┘ (query/category + day-overlap)
 *                                  │
 *                           segments (startMins/endMins per occurrence)
 *                                  │
 *                       assignLanes (stable lane index per segment)
 *                                  │
 *                              render EventBlock(s)
 *
 * Lanes diagram (side-by-side stacking)
 * -------------------------------------
 * When events overlap in time, they are assigned lanes 0..N-1 and rendered with equal width
 * and a small gutter:
 *
 *  |<--------------------- 100% width ---------------------->|
 *  | lane 0         | lane 1         | lane 2               |
 *  | [ event A ]    | [ event B ]    | [ event C ]          |
 *
 * Vertical coordinate system (shared with TimeGrid)
 * -------------------------------------------------
 *  y(px) = minutesFromMidnight * (ROW_H / 60)
 *  height(px) = durationMins * (ROW_H / 60)
 *
 * Instant preview + debounced commit
 * ----------------------------------
 * To keep UI buttery while reducing store churn:
 * - Visual position/size is driven by a local `preview` signal updated on every pointer move
 * - Actual event updates (actions.update) are debounced (~80ms) and flushed on pointer up
 *
 *  Dragging:
 *   - preview.startMins changes instantly (top moves)
 *   - debounced moveEvent commits start/end
 *
 *  Resizing:
 *   - preview.endMins changes instantly (height grows/shrinks)
 *   - debounced resizeEvent commits end
 *
 *  On end: flush debounced call and clear preview for that base event.
 */
import { parseISO, isSameDay, startOfDay, endOfDay } from 'date-fns'
import { useEvents } from '../context/EventsContext'
import { expandEventsForRange, filterEvents } from '../utils/occurrence'
import EventBlock from './EventBlock'
import { assignLanes } from '../utils/lanes'
import TimeGrid from './TimeGrid'
import { createSignal } from 'solid-js'
import { ROW_H, pxPerMinute, snapMins, SNAP_MIN } from '../utils/timeGrid'
import type { EventItem } from '../types'

type DayViewProps = {
  // Fired when an EventBlock is clicked
  onEventClick?: (id: string, patch?: Partial<EventItem>) => void
  // Fired when the user clicks or drag-selects empty space to create a new event
  onSlotClick?: (startISO: string, endISO: string) => void
}

export default function DayView(props: DayViewProps) {
  const [state, actions] = useEvents()
  // The day the user is currently looking at
  const anchor = () => parseISO(state.viewDate)

  // Occurrences are concrete instances within the day window.
  // - Non-recurring events pass through as-is
  // - Recurring events get expanded into instances for the day
  // Detached (parentId) instances are treated as standalone occurrences by the expander.
  const occurrences = () => expandEventsForRange(state.events, startOfDay(anchor()), endOfDay(anchor()))

  // Include any events that overlap today, not only those that start today
  const events = () =>
    filterEvents(occurrences(), { query: state.filters.query, categories: state.filters.categories as any }).filter((e) => {
      const s = parseISO(e.start)
      const en = parseISO(e.end)
      return s < endOfDay(anchor()) && en > startOfDay(anchor())
    })

  const pxPerMin = pxPerMinute()

  const snap = (mins: number) => snapMins(mins)


  // Debounce utility to limit expensive state updates during drag/resize
  type DebouncedFn<T extends any[]> = ((...args: T) => void) & { flush: () => void; cancel: () => void }
  function makeDebounced<T extends any[]>(fn: (...args: T) => void, wait = 80): DebouncedFn<T> {
    let timer: number | null = null
    let lastArgs: T | null = null
    const fire = () => {
      timer = null
      if (lastArgs) fn(...lastArgs)
      lastArgs = null
    }
    const d = ((...args: T) => {
      lastArgs = args
      if (timer) window.clearTimeout(timer)
      timer = window.setTimeout(fire, wait)
    }) as DebouncedFn<T>
    d.flush = () => {
      if (timer) {
        window.clearTimeout(timer)
        fire()
      } else if (lastArgs) {
        fn(...lastArgs)
        lastArgs = null
      }
    }
    d.cancel = () => {
      if (timer) window.clearTimeout(timer)
      timer = null
      lastArgs = null
    }
    return d
  }

  // Instant visual preview for the block being interacted with (no state writes)
  // Keyed by baseId (series source); store either a startMins override (drag) or endMins override (resize)
  const [preview, setPreview] = createSignal<Record<string, { startMins?: number; endMins?: number }>>({})
  const setPreviewStart = (baseId: string, mins: number) => setPreview((p) => ({ ...p, [baseId]: { ...(p[baseId] ?? {}), startMins: snap(Math.max(0, Math.min(24 * 60 - SNAP_MIN, mins))) } }))
  const setPreviewEnd = (baseId: string, mins: number) => setPreview((p) => ({ ...p, [baseId]: { ...(p[baseId] ?? {}), endMins: snap(Math.max(SNAP_MIN, Math.min(24 * 60, mins))) } }))
  const clearPreviewStart = (baseId: string) => setPreview((p) => { const n = { ...p }; if (n[baseId]) { const { endMins } = n[baseId]; if (endMins != null) n[baseId] = { endMins }; else delete n[baseId] } return n })
  const clearPreviewEnd = (baseId: string) => setPreview((p) => { const n = { ...p }; if (n[baseId]) { const { startMins } = n[baseId]; if (startMins != null) n[baseId] = { startMins }; else delete n[baseId] } return n })

  // Keep per-event debouncers so we don't recreate on every render
  const debouncers = new Map<string, { move: DebouncedFn<[number]>; resize: DebouncedFn<[number]> }>()
  const getDebouncers = (baseId: string) => {
    let d = debouncers.get(baseId)
    if (!d) {
      d = { move: makeDebounced((mins: number) => moveEvent(baseId, mins)), resize: makeDebounced((mins: number) => resizeEvent(baseId, mins)) }
      debouncers.set(baseId, d)
    }
    return d
  }

  function moveEvent(id: string, newStartMins: number) {
    // Move the base event (series source for instances) by setting new start within the day.
    // Keeps original duration, snaps to grid, and clamps within [0, 24h - SNAP_MIN].
    const ev = state.events.find((e) => e.id === id)
    if (!ev) return
    const start = parseISO(ev.start)
    const end = parseISO(ev.end)
    const MS_IN_MIN = 60000
    const dur = (end.getTime() - start.getTime()) / MS_IN_MIN
    const day = anchor()
    const newStart = new Date(day)
    newStart.setHours(0, 0, 0, 0)
    newStart.setMinutes(snap(Math.max(0, Math.min(24 * 60 - SNAP_MIN, newStartMins))))
    const newEnd = new Date(newStart.getTime() + dur * 60000)
    actions.update(id, { start: newStart.toISOString(), end: newEnd.toISOString() })
    console.log('##############################')
    console.log('newStart', newStart, 'newEnd', newEnd)
  }

  function resizeEvent(id: string, newEndMins: number) {
    // Resize the base event's end within the day with snapping and a minimum length of SNAP_MIN.
    const ev = state.events.find((e) => e.id === id)
    if (!ev) return
    const start = parseISO(ev.start)
    const day = anchor()
    const minEnd = start.getHours() * 60 + start.getMinutes() + SNAP_MIN
    const mins = snap(Math.max(minEnd, Math.min(24 * 60, newEndMins)))
    const newEnd = new Date(day)
    newEnd.setHours(0, 0, 0, 0)
    newEnd.setMinutes(mins)
    actions.update(id, { end: newEnd.toISOString() })

    console.log('##############################')
    console.log('newEnd', newEnd)
  }

  // using shared withPointer from utils/pointer

  let rightPaneRef: HTMLDivElement | null = null
  const minsFromClientY = (clientY: number) => {
    // Convert a pointer Y (viewport) to minutes from the top of the right pane.
    const el = rightPaneRef
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const y = clientY - rect.top
    return y / (ROW_H / 60)
  }

  // Drag-to-select range state (reactive)
  const [selectRange, setSelectRange] = createSignal<{ start: number; end: number } | null>(null)

  // Auto-scroll near viewport edges while dragging/resizing
  let autoRaf = 0
  const EDGE = 28
  const WIN_SPEED = 20
  const ptr = { x: 0, y: 0 }
  const onPtrMove = (e: PointerEvent) => { ptr.x = (e as any).clientX; ptr.y = (e as any).clientY }
  const tick = () => {
    // If the pointer nears the viewport top/bottom, auto-scroll the page to aid long drags.
    const yTop = ptr.y
    const yBottom = window.innerHeight - ptr.y
    let delta = 0
    if (yTop < EDGE) delta = -Math.ceil(((EDGE - yTop) / EDGE) * WIN_SPEED)
    else if (yBottom < EDGE) delta = Math.ceil(((EDGE - yBottom) / EDGE) * WIN_SPEED)
    if (delta !== 0) window.scrollBy(0, delta)
    autoRaf = window.requestAnimationFrame(tick)
  }
  const startAuto = () => {
    if (autoRaf) return
    window.addEventListener('pointermove', onPtrMove)
    autoRaf = window.requestAnimationFrame(tick)
  }
  const stopAuto = () => {
    if (!autoRaf) return
    window.cancelAnimationFrame(autoRaf)
    autoRaf = 0
    window.removeEventListener('pointermove', onPtrMove)
  }

  return (
    <TimeGrid anchor={anchor()} setRightPaneRef={(el) => (rightPaneRef = el)}>
      {/* collision-aware stacking: compute segments and lanes */}
      {(() => {
        const day = anchor()
        // Collect refs for roving focus
        const blockRefs: HTMLDivElement[] = []
        const focusNeighbor = (currentId: string, dir: -1 | 1) => {
          const idx = blockRefs.findIndex((el) => el?.dataset?.evid === currentId)
          const next = idx + dir
          const el = blockRefs[next]
          if (el && typeof el.focus === 'function') el.focus()
        }
        const segs = events()
          .map((e) => {
            const sAbs = parseISO(e.start)
            const eAbs = parseISO(e.end)
            // For multi-day events, clamp the visual segment to this day only.
            const startMins = Math.max(0, isSameDay(sAbs, day) ? sAbs.getHours() * 60 + sAbs.getMinutes() : 0)
            const endMins = Math.min(24 * 60, isSameDay(eAbs, day) ? eAbs.getHours() * 60 + eAbs.getMinutes() : 24 * 60)
            // Use the occurrence id (unique) for lane stacking to avoid collisions for recurring series
            return { e, id: e.id, startMins, endMins }
          })
          .filter((seg) => seg.endMins > seg.startMins)
          .sort((a, b) => a.startMins - b.startMins || a.endMins - b.endMins)

        const { sorted, laneIndexById, laneCount } = assignLanes(segs.map(s => ({ id: s.id, startMins: s.startMins, endMins: s.endMins, data: s })))
        const gutter = 4

        return sorted.map(({ data }) => {
          const { e, id, startMins, endMins } = data
          const baseId = e.sourceId ?? e.id
          const p = preview()[baseId]
          // Visual overrides: drag sets startMins (top), resize sets endMins (height)
          const dispStartMins = p?.startMins != null ? p.startMins : startMins
          const dispEndMins = p?.endMins != null ? p.endMins : endMins
          const top = dispStartMins * pxPerMin
          const height = Math.max(ROW_H / 2, (dispEndMins - startMins) * pxPerMin)
          const lane = laneIndexById.get(id) ?? 0
          const widthPct = 100 / laneCount
          const leftPct = widthPct * lane
          const sAbs = parseISO(e.start)
          const eAbs = parseISO(e.end)
          const isStartSegment = isSameDay(sAbs, day)
          const isEndSegment = isSameDay(eAbs, day)
          return (
            <EventBlock
              id={id}
              title={e.title}
              color={e.color}
              startISO={e.start}
              endISO={e.end}
              // Only allow editing on non-recurring base events and on the segment that
              // actually starts/ends on this day (avoids cross-day drag confusion).
              draggable={!e.sourceId && isStartSegment}
              resizable={!e.sourceId && isEndSegment}
              style={{
                top: `${top}px`,
                height: `${height}px`,
                left: `calc(${leftPct}% + ${gutter}px)`,
                width: `calc(${widthPct}% - ${gutter * 2}px)`,
                transition: 'top 120ms ease, height 120ms ease, left 120ms ease, width 120ms ease',
              }}
              onClick={(id) => props.onEventClick?.(id, { start: e.start, end: e.end })}
              onDragMove={(_dyPx, ev: any) => {
                // Convert pointer Y to minutes and move the base event.
                if (!isStartSegment) return
                const mins = minsFromClientY(ev.clientY)
                setPreviewStart(baseId, mins)
                const { move } = getDebouncers(baseId)
                move(mins)
              }}
              onDragStart={() => startAuto()}
              onDragEnd={() => {
                // Commit last position and clear preview
                const { move } = getDebouncers(baseId)
                move.flush()
                clearPreviewStart(baseId)
                stopAuto()
              }}
              onResize={(_dyPx, ev: any) => {
                // Convert pointer Y to minutes and resize the base event's end.
                if (!isEndSegment) return
                const mins = minsFromClientY(ev.clientY)
                setPreviewEnd(baseId, mins)
                const { resize } = getDebouncers(baseId)
                resize(mins)
              }}
              onResizeStart={() => startAuto()}
              onResizeEnd={() => {
                const { resize } = getDebouncers(baseId)
                resize.flush()
                clearPreviewEnd(baseId)
                stopAuto()
              }}
              onKeyDown={(ke: any) => {
                // Keyboard: roving focus, open, delete, and nudge move/resize by SNAP_MIN.
                if (ke.ctrlKey && (ke.key === 'ArrowUp' || ke.key === 'ArrowDown')) {
                  focusNeighbor(id, ke.key === 'ArrowUp' ? -1 : 1)
                  ke.preventDefault();
                  return
                }
                if (ke.key === 'Enter') { props.onEventClick?.(id, { start: e.start, end: e.end }); ke.preventDefault(); return }
                if (ke.key === 'Delete' || ke.key === 'Backspace') { actions.remove(baseId); ke.preventDefault(); return }
                const s = parseISO(e.start)
                const en = parseISO(e.end)
                const sM = s.getHours() * 60 + s.getMinutes()
                const enM = en.getHours() * 60 + en.getMinutes()
                if (ke.key === 'ArrowUp' && isStartSegment) { moveEvent(baseId, sM - SNAP_MIN); ke.preventDefault(); }
                if (ke.key === 'ArrowDown' && isStartSegment) { moveEvent(baseId, sM + SNAP_MIN); ke.preventDefault(); }
                if (ke.key === 'ArrowLeft' && isEndSegment) { resizeEvent(baseId, Math.max(sM + SNAP_MIN, enM - SNAP_MIN)); ke.preventDefault(); }
                if (ke.key === 'ArrowRight' && isEndSegment) { resizeEvent(baseId, enM + SNAP_MIN); ke.preventDefault(); }
              }}
              tabIndex={0}
              setRef={(el) => blockRefs.push(el)}
            />
          )
        })
      })()}
      {/* selection overlay (visual) */}
      {(() => {
        const sel = selectRange()
        if (!sel) return null as any
        const top = Math.min(sel.start, sel.end) * pxPerMin
        const height = Math.max(SNAP_MIN, Math.abs(sel.end - sel.start)) * pxPerMin
        const startLabel = (() => {
          // Label = anchor date with minutes set to selection start
          const d = new Date(anchor())
          d.setHours(0, 0, 0, 0)
          d.setMinutes(Math.min(sel.start, sel.end))
          return d
        })()
        const endLabel = (() => {
          // Label = anchor date with minutes set to selection end
          const d = new Date(anchor())
          d.setHours(0, 0, 0, 0)
          d.setMinutes(Math.max(sel.start, sel.end))
          return d
        })()
        return (
          <div class="absolute inset-x-0 z-10 pointer-events-none">
            <div class="absolute left-0 right-0 bg-blue-200/30 border border-blue-300 rounded-sm" style={{ top: `${top}px`, height: `${height}px` }} />
            <div class="absolute left-2 -translate-y-1/2 text-[10px] text-blue-700 bg-white/80 px-1.5 py-0.5 rounded border border-blue-200 shadow-sm" style={{ top: `${top}px` }}>
              {new Date(startLabel).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
            <div class="absolute left-2 -translate-y-1/2 text-[10px] text-blue-700 bg-white/80 px-1.5 py-0.5 rounded border border-blue-200 shadow-sm" style={{ top: `${top + height}px` }}>
              {new Date(endLabel).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
            </div>
          </div>
        )
      })()}
      {/* slot overlay for click or drag-to-select */}
      <div
        class="absolute inset-0 z-0"
        onPointerDown={(ev) => {
          if (!props.onSlotClick) return
          const startRaw = minsFromClientY((ev as any).clientY)
          const startMin = snap(Math.max(0, Math.min(24 * 60 - SNAP_MIN, startRaw)))
          setSelectRange({ start: startMin, end: startMin })
          startAuto()
          const onMove = (e: PointerEvent) => {
            const curRaw = minsFromClientY((e as any).clientY)
            const curMin = snap(Math.max(0, Math.min(24 * 60, curRaw)))
            setSelectRange({ start: startMin, end: curMin })
          }
          const onUp = (e: PointerEvent) => {
            window.removeEventListener('pointermove', onMove)
            window.removeEventListener('pointerup', onUp)
            stopAuto()
            const endRaw = minsFromClientY((e as any).clientY)
            const endMin = snap(Math.max(0, Math.min(24 * 60, endRaw)))
            const s = Math.min(startMin, endMin)
            const en = Math.max(startMin, endMin)
            const start = new Date(anchor())
            start.setHours(0, 0, 0, 0)
            start.setMinutes(s)
            const end = new Date(anchor())
            end.setHours(0, 0, 0, 0)
            // If there was no drag, default to 60 minutes
            if (en === s) {
              end.setMinutes(Math.min(24 * 60, s + 60))
            } else {
              end.setMinutes(en)
            }
            props.onSlotClick!(start.toISOString(), end.toISOString())
            setSelectRange(null)
          }
          try { (ev.currentTarget as any).setPointerCapture?.((ev as any).pointerId) } catch { }
          window.addEventListener('pointermove', onMove)
          window.addEventListener('pointerup', onUp, { once: true } as any)
        }}
      />

    </TimeGrid>
  )
}
