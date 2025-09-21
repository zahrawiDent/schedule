import { parseISO, format, addHours, startOfDay, startOfWeek, endOfWeek, isSameDay, startOfDay as sod, endOfDay as eod } from 'date-fns'
import { weekRange } from '../utils/dateUtils'
import { useEvents } from '../context/EventsContext'
import { expandEventsForRange, filterEvents } from '../utils/occurrence'
import EventBlock from './EventBlock'
import { assignLanes } from '../utils/lanes'
import { HOURS, ROW_H, pxPerMinute, SNAP_MIN } from '../utils/timeGrid'
import { timesFromVerticalClick } from '../utils/slots'

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

  function snap(mins: number) {
    return Math.round(mins / SNAP_MIN) * SNAP_MIN
  }

  // Calculate new start when dragging across day/time
  function moveEventTo(id: string, dayIndex: number, newStartMins: number) {
    const ev = state.events.find((e) => e.id === id)
    if (!ev) return
    const start = parseISO(ev.start)
    const end = parseISO(ev.end)
    const dur = (end.getTime() - start.getTime()) / 60000
    const week0 = rangeStart()
    const target = new Date(week0)
    target.setDate(week0.getDate() + Math.max(0, Math.min(6, dayIndex)))
    target.setHours(0, 0, 0, 0)
    target.setMinutes(snap(Math.max(0, Math.min(24 * 60 - SNAP_MIN, newStartMins))))
    const newEnd = new Date(target.getTime() + dur * 60000)
    actions.update(id, { start: target.toISOString(), end: newEnd.toISOString() })
  }

  function resizeEventTo(id: string, dayIndex: number, newEndMins: number) {
    const ev = state.events.find((e) => e.id === id)
    if (!ev) return
    const start = parseISO(ev.start)
    const week0 = rangeStart()
    // Only allow resizing within the same day column for simplicity
    if (!isSameDay(start, new Date(week0.getFullYear(), week0.getMonth(), week0.getDate() + dayIndex))) return
    const minEnd = start.getHours() * 60 + start.getMinutes() + SNAP_MIN
    const mins = snap(Math.max(minEnd, Math.min(24 * 60, newEndMins)))
    const newEnd = new Date(start)
    newEnd.setHours(0, 0, 0, 0)
    newEnd.setMinutes(mins)
    actions.update(id, { end: newEnd.toISOString() })
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

  return (
    <div class="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-gray-50">
      {/* header */}
      <div class="bg-white border-b border-gray-200"></div>
      {days().map((d, i) => (
        <div
          class={`bg-white p-3 text-center text-sm font-medium text-gray-500 border-b border-gray-200 ${i < 6 ? 'border-r border-gray-200' : ''}`}
        >
          {format(d, 'EEE dd')}
        </div>
      ))}

      {/* time labels */}
    <div class="bg-white border-r border-gray-200" style={{ height: `${ROW_H * 24}px` }}>
        {HOURS.map((h) => (
      <div class="h-16 flex items-start justify-end pr-2 text-xs text-gray-500">{format(addHours(startOfDay(anchor()), h), 'ha')}</div>
        ))}
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

        const { sorted, laneIndexById, laneCount } = assignLanes(segs.map(s => ({ id: s.id, startMins: s.startMins, endMins: s.endMins, data: s })))
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
            {/* events */}
            {sorted.map(({ data }) => {
              const { e, id, startMins, endMins } = data
              const top = startMins * pxPerMin
              const height = Math.max(ROW_H / 2, (endMins - startMins) * pxPerMin)
              const lane = laneIndexById.get(id) ?? 0
              const gutter = 4 // px gap between lanes
              const widthPct = 100 / laneCount
              const leftPct = widthPct * lane
              return (
                <EventBlock
                  id={id}
                  title={e.title}
                  color={e.color}
                  startISO={e.start}
                  endISO={e.end}
                  draggable={!e.sourceId}
                  resizable={!e.sourceId}
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    left: `calc(${leftPct}% + ${gutter}px)`,
                    width: `calc(${widthPct}% - ${gutter * 2}px)`,
                    transition: 'top 120ms ease, height 120ms ease, left 120ms ease, width 120ms ease',
                  }}
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
                    if (ke.key === 'ArrowUp') { moveEventTo(id, i, sM - SNAP_MIN); ke.preventDefault(); }
                    if (ke.key === 'ArrowDown') { moveEventTo(id, i, sM + SNAP_MIN); ke.preventDefault(); }
                    if (ke.key === 'ArrowLeft') { resizeEventTo(id, i, Math.max(sM + SNAP_MIN, enM - SNAP_MIN)); ke.preventDefault(); }
                    if (ke.key === 'ArrowRight') { resizeEventTo(id, i, enM + SNAP_MIN); ke.preventDefault(); }
                  }}
                  setRef={(el) => blockRefs.push(el)}
                  onDragMove2D={(_dxPx, dyPx, ev) => {
                    const startAt = (parseISO(e.start).getHours() * 60 + parseISO(e.start).getMinutes())
                    const dayIdx = getDayIndexFromClientX((ev as any).clientX)
                    const deltaMin = dyPx / pxPerMin
                    moveEventTo(id, dayIdx ?? i, startAt + deltaMin)
                  }}
                  onResize={(_dyPx, ev) => {
                    const endAtAbs = parseISO(e.end)
                    const dayIdx = getDayIndexFromClientX((ev as any).clientX)
                    const minsInDay = snap(Math.max(0, Math.min(24 * 60, (endAtAbs.getHours() * 60 + endAtAbs.getMinutes()) + (_dyPx / pxPerMin))))
                    resizeEventTo(id, dayIdx, minsInDay)
                  }}
                />
              )
            })}
            {/* slot click to add/edit */}
            <div
              class="absolute inset-0 z-0"
              onClick={(ev) => {
                if (!props.onSlotClick) return
                const rect = (ev.currentTarget as HTMLDivElement).getBoundingClientRect()
                const y = (ev as any).clientY - rect.top
                const day = new Date(rangeStart())
                day.setDate(rangeStart().getDate() + i)
                const { startISO, endISO } = timesFromVerticalClick(day, y, pxPerMin)
                props.onSlotClick(startISO, endISO)
              }}
            />
          </div>
        )
      })}
    </div>
  )
}
