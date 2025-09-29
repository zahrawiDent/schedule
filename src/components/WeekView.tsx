import { parseISO, format, addHours, startOfDay, startOfWeek, endOfWeek, isSameDay, startOfDay as sod, endOfDay as eod, isToday } from 'date-fns'
import { createSignal, For, Show } from 'solid-js'
import { weekRange } from '../utils/dateUtils'
import { useEvents } from '../context/EventsContext'
import { expandEventsForRange, filterEvents } from '../utils/occurrence'
import EventBlock from './EventBlock'
import { layoutLanesWithSpan } from '../utils/lanes'
import { HOURS, ROW_H, pxPerMinute, SNAP_MIN } from '../utils/timeGrid'
import HoverIndicator from './HoverIndicator'
import SelectionOverlay from './SelectionOverlay'
import NowIndicator from './NowIndicator'
import { computeMoveToDay, computeResizeToDay } from '../utils/eventUpdates'
import { createPreviewState } from '../utils/dragPreview'
import { createAutoScroll } from '../utils/autoScroll'

// use shared time grid constants

export default function WeekView(props: { onEventClick?: (id: string, patch?: Partial<import('../types').EventItem>) => void; onSlotClick?: (startISO: string, endISO: string) => void }) {
  const [state, actions] = useEvents()
  const anchor = () => parseISO(state.viewDate)
  const days = () => weekRange(anchor(), state.weekStartsOn)
  const rangeStart = () => startOfWeek(anchor(), { weekStartsOn: state.weekStartsOn })
  const rangeEnd = () => endOfWeek(anchor(), { weekStartsOn: state.weekStartsOn })
  const occurrences = () => expandEventsForRange(state.events, rangeStart(), rangeEnd())
  const visible = () => filterEvents(occurrences(), { query: state.filters.query, categories: state.filters.categories as any })

  const pxPerMin = pxPerMinute()
  // Track active dragging so we can move the actual block across columns
  const [dragging, setDragging] = createSignal<{ baseId: string } | null>(null)
  // WeekView no longer owns the "now" interval; NowIndicator handles it per day

  // Hover indicator (snapped to 15 min)
  const [hover, setHover] = createSignal<{ dayIndex: number, mins: number } | null>(null)
  const [selectRange, setSelectRange] = createSignal<{ dayIndex: number, start: number, end: number } | null>(null)

  function snap(mins: number) {
    return Math.round(mins / SNAP_MIN) * SNAP_MIN
  }

  // Calculate new start when dragging across day/time
  function moveEventTo(id: string, dayIndex: number, newStartMins: number) {
    const ev = state.events.find((e) => e.id === id)
    if (!ev) return
    const patch = computeMoveToDay(ev, rangeStart(), dayIndex, newStartMins, snap, SNAP_MIN)
    actions.update(id, patch)

    console.log('##############################')
    console.log('move patch', patch)
  }

  function resizeEventTo(id: string, dayIndex: number, newEndMins: number) {
    const ev = state.events.find((e) => e.id === id)
    if (!ev) return
    const patch = computeResizeToDay(ev, rangeStart(), dayIndex, newEndMins, snap, SNAP_MIN)
    actions.update(id, patch)

    console.log('##############################')
    console.log('resize patch', patch)
  }

  // using shared withPointer2D

  let columnEls: Array<HTMLDivElement | null> = []
  const blockRefs: HTMLDivElement[] = []
  const focusNeighbor = (currentId: string, dir: -1 | 1) => {
    const idx = blockRefs.findIndex((el) => el?.dataset?.evid === currentId)
    const next = idx + dir
    const el = blockRefs[next]
    if (el && typeof (el as any).focus === 'function') (el as any).focus()
  }

  function getDayIndexFromClientX(clientX: number) {
    const rects = columnEls.map((el) => el?.getBoundingClientRect()).filter(Boolean) as Array<DOMRect>
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i]!
      if (clientX >= r.left && clientX <= r.right) return i
    }
    // fallback: nearest
    if (rects.length === 0) return 0
    let nearest = 0
    let minDist = Infinity
    rects.forEach((r, i) => {
      const cx = (r.left + r.right) / 2
      const d = Math.abs(clientX - cx)
      if (d < minDist) { minDist = d; nearest = i }
    })
    return nearest
  }

  const minsFromClientYInDay = (clientY: number, dayIndex: number) => {
    const el = columnEls[dayIndex]
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const y = clientY - rect.top
    return y / pxPerMin
  }

  // Shared preview state and auto-scroll
  const { preview, setStart: setPreviewStart, setEnd: setPreviewEnd, clearStart: clearPreviewStart, clearEnd: clearPreviewEnd } = createPreviewState((m) => Math.round(m / SNAP_MIN) * SNAP_MIN, SNAP_MIN)
  const { start: startAuto, stop: stopAuto } = createAutoScroll()

  return (
    <div class="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-gray-50">

      {/* header */}
      <div class="bg-white border-b border-gray-200"></div>
      <For each={days()}>
        {(d, i) => (
          <div
            class={`p-3 text-center text-sm font-medium border-b border-gray-200 ${i() < 6 ? 'border-r border-gray-200' : ''} ${isToday(d) ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-500'}`}
          >
            {format(d, 'EEE dd')}
          </div>
        )}
      </For>

      {/* time labels */}
      <div class="bg-white border-r border-gray-200" style={{ height: `${ROW_H * 24}px` }}>
        <For each={HOURS}>
          {(h) => (
            <div class="h-16 flex items-start justify-end pr-2 text-xs text-gray-500">{format(addHours(startOfDay(anchor()), h), 'ha')}</div>
          )}
        </For>
      </div>

      {/* 7 day columns */}
      {days().map((d, i) => {
        // Include events that overlap this day, not just those starting today
        const dayStart = sod(d)
        const dayEnd = eod(d)
        const dayOcc = visible().filter((e) => {
          const s = parseISO(e.start)
          const en = parseISO(e.end)
          return s < dayEnd && en > dayStart
        })

        // Build day segments and assign lanes (collision-aware stacking)
        const segs = dayOcc
          .map((e) => {
            const s = parseISO(e.start)
            const en = parseISO(e.end)
            const startMins = Math.max(0, (isSameDay(s, d) ? (s.getHours() * 60 + s.getMinutes()) : 0))
            const endMins = Math.min(24 * 60, (isSameDay(en, d) ? (en.getHours() * 60 + en.getMinutes()) : 24 * 60))
            // Use occurrence id for stable lane assignment
            return { e, id: e.id, startMins, endMins }
          })
          .filter((seg) => seg.endMins > seg.startMins)
          .sort((a, b) => a.startMins - b.startMins || a.endMins - b.endMins)

  // Improved width allocation: allow events to span across adjacent free columns
  const { sorted, byId } = layoutLanesWithSpan(segs.map(s => ({ id: s.id, startMins: s.startMins, endMins: s.endMins, data: s })))
        return (
          <div
            class={`relative bg-white border-b border-gray-200 ${i < 6 ? 'border-r border-gray-200' : ''}`}
            style={{ height: `${ROW_H * 24}px` }}
            ref={(el) => (columnEls[i] = el)}
          >
            {/* grid lines */}
            {HOURS.map((h) => (
              h > 0 ? (
                <div class="absolute left-0 right-0 border-b border-gray-200" style={{ top: `${h * ROW_H}px`, 'pointer-events': 'none' }} />
              ) : null
            ))}
            {/* today background */}
            {isToday(d) && (
              <div class="absolute inset-0 bg-blue-50/40 pointer-events-none" />
            )}
            {/* hover indicator (shared) */}

            <Show when={hover()?.dayIndex === i}>
              <HoverIndicator
                mins={hover()!.mins}
                pxPerMin={pxPerMin}
                label={(() => {
                  const day = new Date(rangeStart())
                  day.setDate(rangeStart().getDate() + i)
                  day.setHours(0, 0, 0, 0)
                  day.setMinutes(hover()!.mins)
                  return format(day, 'h:mm')
                })()}
              />
            </Show>

            {/* selection overlay for this day */}
            {selectRange()?.dayIndex === i && (() => {
              const sel = selectRange()!
              return (
                <SelectionOverlay
                  startMins={sel.start}
                  endMins={sel.end}
                  pxPerMin={pxPerMin}
                  labelFor={(mins) => {
                    const d0 = new Date(rangeStart())
                    d0.setDate(rangeStart().getDate() + i)
                    d0.setHours(0, 0, 0, 0)
                    d0.setMinutes(mins)
                    return format(d0, 'h:mm')
                  }}
                />
              )
            })()}
            {/* current time line in today's column (shared) */}
            <Show when={isToday(d)}>
              <NowIndicator date={d} pxPerMin={pxPerMin} />
            </Show>
            {/* events */}
            {sorted.map(({ data }) => {
              const { e, id, startMins, endMins } = data
              const baseId = e.sourceId ?? e.id
              const p = preview()[baseId]
              const isDraggingThis = dragging()?.baseId === baseId
              const dispStartMins = (() => {
                if (isDraggingThis && p?.startMins != null) return p.startMins
                if (p?.startMins != null && (p?.dayIndex == null || p.dayIndex === i)) return p.startMins
                return startMins
              })()
              const dispEndMins = (() => {
                if (isDraggingThis && p?.endMins != null) return p.endMins
                if (p?.endMins != null && (p?.dayIndex == null || p.dayIndex === i)) return p.endMins
                return endMins
              })()
              const top = dispStartMins * pxPerMin
              const height = Math.max(ROW_H / 2, (dispEndMins - startMins) * pxPerMin)
              const meta = byId.get(id) || { lane: 0, span: 1, totalLanes: 1 }
              const lane = meta.lane
              const span = meta.span
              const total = meta.totalLanes
              const gutter = 4 // px gap between lanes
              const widthPct = 100 / total
              const leftPct = widthPct * lane
              // Determine if this segment is on the event's start day or end day
              const sAbs = parseISO(e.start)
              const eAbs = parseISO(e.end)
              const isStartSegment = isSameDay(sAbs, d)
              const isEndSegment = isSameDay(eAbs, d)
              // Compute target column rect if dragging across columns
              const targetDayIdx = p?.dayIndex ?? i
              const targetRect = targetDayIdx != null ? columnEls[targetDayIdx]?.getBoundingClientRect() : null
              return (
                <EventBlock
                  id={id}
                  title={e.title}
                  color={e.color}
                  startISO={e.start}
                  endISO={e.end}
                  draggable={!e.sourceId && isStartSegment}
                  resizable={!e.sourceId && isEndSegment}
                  style={(() => {
                    if (isDraggingThis && targetRect) {
                      return {
                        top: `${targetRect.top + top}px`,
                        height: `${height}px`,
                        left: `${targetRect.left + gutter}px`,
                        width: `${targetRect.width - gutter * 2}px`,
                        transition: 'none',
                        ...({ position: 'fixed', zIndex: 60 } as any),
                      }
                    }
                    return {
                      top: `${top}px`,
                      height: `${height}px`,
                      left: `calc(${leftPct}% + ${gutter}px)`,
                      width: `calc(${widthPct * span}% - ${gutter * 2}px)`,
                      transition: 'top 120ms ease, height 120ms ease, left 120ms ease, width 120ms ease',
                    }
                  })()}
                  onClick={(id) => props.onEventClick?.(id, { start: e.start, end: e.end })}
                  tabIndex={0}
                  onKeyDown={(ke: any) => {
                    if (ke.ctrlKey && (ke.key === 'ArrowUp' || ke.key === 'ArrowDown')) {
                      focusNeighbor(id, ke.key === 'ArrowUp' ? -1 : 1)
                      ke.preventDefault();
                      return
                    }
                    if (ke.key === 'Enter') { props.onEventClick?.(id, { start: e.start, end: e.end }); ke.preventDefault(); return }
                    if (ke.key === 'Delete' || ke.key === 'Backspace') { actions.remove(id); ke.preventDefault(); return }
                    const s = parseISO(e.start)
                    const en = parseISO(e.end)
                    const sM = s.getHours() * 60 + s.getMinutes()
                    const enM = en.getHours() * 60 + en.getMinutes()
                    if (ke.key === 'ArrowUp' && isStartSegment) { moveEventTo(id, i, sM - SNAP_MIN); ke.preventDefault(); }
                    if (ke.key === 'ArrowDown' && isStartSegment) { moveEventTo(id, i, sM + SNAP_MIN); ke.preventDefault(); }
                    if (ke.key === 'ArrowLeft' && isEndSegment) { resizeEventTo(id, i, Math.max(sM + SNAP_MIN, enM - SNAP_MIN)); ke.preventDefault(); }
                    if (ke.key === 'ArrowRight' && isEndSegment) { resizeEventTo(id, i, enM + SNAP_MIN); ke.preventDefault(); }
                  }}
                  setRef={(el) => blockRefs.push(el)}
                  onDragMove2D={(_dxPx, _dyPx, ev: any) => {
                    if (!isStartSegment) return
                    const dayIdx = getDayIndexFromClientX(ev.clientX)
                    const mins = minsFromClientYInDay(ev.clientY, dayIdx ?? i)
                    setPreviewStart(baseId, mins, dayIdx ?? i)
                  }}
                  onDragStart={() => { setDragging({ baseId }); startAuto() }}
                  onDragEnd={() => {
                    const p = preview()[baseId]
                    if (p?.startMins != null) {
                      moveEventTo(baseId, p.dayIndex ?? i, p.startMins)
                    }
                    clearPreviewStart(baseId)
                    setDragging(null)
                    stopAuto()
                  }}
                  onResize={(_dyPx, ev: any) => {
                    if (!isEndSegment) return
                    const dayIdx = getDayIndexFromClientX(ev.clientX)
                    const mins = minsFromClientYInDay(ev.clientY, dayIdx ?? i)
                    setPreviewEnd(baseId, mins, dayIdx ?? i)
                  }}
                  onResizeStart={() => startAuto()}
                  onResizeEnd={() => {
                    const pr = preview()[baseId]
                    if (pr?.endMins != null) {
                      resizeEventTo(baseId, pr.dayIndex ?? i, pr.endMins)
                    }
                    clearPreviewEnd(baseId)
                    stopAuto()
                  }}
                />
              )
            })}
            {/* slot click/drag to add/edit */}
            <div
              class="absolute inset-0 z-0"
              onMouseMove={(ev) => {
                const rect = (ev.currentTarget as HTMLDivElement).getBoundingClientRect()
                // Don't show hover when over an EventBlock
                const tgt = ev.target as HTMLElement
                if (tgt && tgt.closest('[data-evid]')) { setHover(null); return }
                const y = (ev as any).clientY - rect.top
                const minsRaw = y / pxPerMin
                const mins = Math.max(0, Math.min(24 * 60 - SNAP_MIN, snap(minsRaw)))
                setHover({ dayIndex: i, mins })
              }}
              onPointerDown={(ev) => {
                if (!props.onSlotClick) return

                const startRaw = minsFromClientYInDay((ev as any).clientY, i)
                const startMin = snap(Math.max(0, Math.min(24 * 60 - SNAP_MIN, startRaw)))
                setSelectRange({ dayIndex: i, start: startMin, end: startMin })

                let hasDragged = false
                startAuto()

                const onMove = (e: PointerEvent) => {
                  hasDragged = true
                  const curRaw = minsFromClientYInDay((e as any).clientY, i)
                  const curMin = snap(Math.max(0, Math.min(24 * 60, curRaw)))
                  setSelectRange({ dayIndex: i, start: startMin, end: curMin })
                }

                const onUp = () => {
                  window.removeEventListener('pointermove', onMove)
                  window.removeEventListener('pointerup', onUp)
                  stopAuto()

                  // Use the current selection state instead of recalculating from pointer position
                  const selection = selectRange()
                  if (!selection || selection.dayIndex !== i) {
                    setSelectRange(null)
                    return
                  }

                  const startMins = Math.min(selection.start, selection.end)
                  const endMins = Math.max(selection.start, selection.end)

                  // Create start and end times for the selected day
                  const day = days()[i]
                  const start = new Date(day)
                  start.setHours(0, 0, 0, 0)
                  start.setMinutes(startMins)

                  const end = new Date(day)
                  end.setHours(0, 0, 0, 0)
                  // If no drag occurred or same position, default to 1 hour duration
                  if (!hasDragged || endMins === startMins) {
                    end.setMinutes(Math.min(24 * 60, startMins + 60))
                  } else {
                    end.setMinutes(endMins)
                  }

                  props.onSlotClick!(start.toISOString(), end.toISOString())
                  setSelectRange(null)
                }

                try { (ev.currentTarget as any).setPointerCapture?.((ev as any).pointerId) } catch { }
                window.addEventListener('pointermove', onMove)
                window.addEventListener('pointerup', onUp, { once: true } as any)
              }}
              onMouseLeave={() => setHover(null)}
            />
          </div>
        )
      })}
    </div>
  )
}
