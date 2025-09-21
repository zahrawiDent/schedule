import { parseISO, isSameDay, startOfDay, endOfDay } from 'date-fns'
import { useEvents } from '../context/EventsContext'
import { expandEventsForRange, filterEvents } from '../utils/occurrence'
import EventBlock from './EventBlock'
import { assignLanes } from '../utils/lanes'
import TimeGrid from './TimeGrid'
import { createSignal } from 'solid-js'
import { ROW_H, pxPerMinute, snapMins, SNAP_MIN } from '../utils/timeGrid'
import type { EventItem } from '../types'


export default function DayView(props: { onEventClick?: (id: string, patch?: Partial<EventItem>) => void; onSlotClick?: (startISO: string, endISO: string) => void }) {
  const [state, actions] = useEvents()
  const anchor = () => parseISO(state.viewDate)

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

  function moveEvent(id: string, newStartMins: number) {
    const ev = state.events.find((e) => e.id === id)
    if (!ev) return
    const start = parseISO(ev.start)
    const end = parseISO(ev.end)
    const dur = (end.getTime() - start.getTime()) / 60000
    const day = anchor()
    const newStart = new Date(day)
    newStart.setHours(0, 0, 0, 0)
    newStart.setMinutes(snap(Math.max(0, Math.min(24 * 60 - SNAP_MIN, newStartMins))))
    const newEnd = new Date(newStart.getTime() + dur * 60000)
    actions.update(id, { start: newStart.toISOString(), end: newEnd.toISOString() })
  }

  function resizeEvent(id: string, newEndMins: number) {
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
  }

  // using shared withPointer from utils/pointer

  let rightPaneRef: HTMLDivElement | null = null
  const minsFromClientY = (clientY: number) => {
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
            const top = startMins * pxPerMin
            const height = Math.max(ROW_H / 2, (endMins - startMins) * pxPerMin)
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
                  if (!isStartSegment) return
                  const mins = minsFromClientY(ev.clientY)
                  moveEvent(baseId, mins)
                }}
                onDragStart={() => startAuto()}
                onDragEnd={() => stopAuto()}
                onResize={(_dyPx, ev: any) => {
                  if (!isEndSegment) return
                  const mins = minsFromClientY(ev.clientY)
                  resizeEvent(baseId, mins)
                }}
                onResizeStart={() => startAuto()}
                onResizeEnd={() => stopAuto()}
                onKeyDown={(ke: any) => {
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
            const d = new Date(anchor())
            d.setHours(0, 0, 0, 0)
            d.setMinutes(Math.min(sel.start, sel.end))
            return d
          })()
          const endLabel = (() => {
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
            try { (ev.currentTarget as any).setPointerCapture?.((ev as any).pointerId) } catch {}
            window.addEventListener('pointermove', onMove)
            window.addEventListener('pointerup', onUp, { once: true } as any)
          }}
        />
      
      </TimeGrid>
  )
}
