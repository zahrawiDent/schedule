import { parseISO, isSameDay, startOfDay, endOfDay } from 'date-fns'
import { useEvents } from '../context/EventsContext'
import { expandEventsForRange, filterEvents } from '../utils/occurrence'
import EventBlock from './EventBlock'
import { assignLanes } from '../utils/lanes'
import TimeGrid from './TimeGrid'
import { ROW_H, pxPerMinute, snapMins, SNAP_MIN } from '../utils/timeGrid'
import { timesFromVerticalClick } from '../utils/slots'
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

  return (
    <TimeGrid anchor={anchor()}>
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
                onDragMove={(dyPx) => {
                  if (!isStartSegment) return
                  const deltaMin = dyPx / pxPerMin
                  moveEvent(baseId, startMins + deltaMin)
                }}
                onResize={(dyPx) => {
                  if (!isEndSegment) return
                  const deltaMin = dyPx / pxPerMin
                  resizeEvent(baseId, endMins + deltaMin)
                }}
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
  {/* slot overlay for click-to-add */}
        <div
          class="absolute inset-0 z-0"
          onClick={(ev) => {
            if (!props.onSlotClick) return
            const rect = (ev.currentTarget as HTMLDivElement).getBoundingClientRect()
            const y = (ev as any).clientY - rect.top
            const { startISO, endISO } = timesFromVerticalClick(anchor(), y, ROW_H / 60)
            props.onSlotClick(startISO, endISO)
          }}
        />
      
    </TimeGrid>
  )
}
