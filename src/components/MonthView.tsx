import { monthGrid, inMonth, getWeekDayLabels } from '../utils/dateUtils'
import { parseISO, startOfDay, endOfDay, isWithinInterval, set } from 'date-fns'
import { useEvents } from '../context/EventsContext'
import { expandEventsForRange, filterEvents } from '../utils/occurrence'
import { startOfMonth, endOfMonth } from 'date-fns'
import { DragDropProvider, DragDropSensors, closestCenter, createDraggable, createDroppable, DragOverlay } from '@thisbeyond/solid-dnd'
import type { DragEvent } from '@thisbeyond/solid-dnd'
import { createSignal, onMount, createEffect, For } from 'solid-js'
import MonthCell from './MonthCell'
import MonthPill from './MonthPill'
import { defaultMonthClickTimes } from '../utils/slots'
import type { EventItem } from '../types'

export default function MonthView(props: { onEventClick?: (id: string, patch?: Partial<EventItem>) => void; onDayClick?: (startISO: string, endISO: string) => void }) {
  const [state, actions] = useEvents()
  const anchor = () => parseISO(state.viewDate)
  const days = () => monthGrid(anchor(), state.weekStartsOn)
  const weekDayLabels = () => getWeekDayLabels(state.weekStartsOn)
  const rangeStart = () => startOfDay(startOfMonth(anchor()))
  const rangeEnd = () => endOfDay(endOfMonth(anchor()))
  const occurrences = () => expandEventsForRange(state.events, rangeStart(), rangeEnd())
  const visible = () => filterEvents(occurrences(), { query: state.filters.query, categories: state.filters.categories as any })

  // Roving tabindex for keyboard navigation within the month grid
  const [focusIdx, setFocusIdx] = createSignal(0)
  let cellRefs: Array<HTMLDivElement | null> = []
  // Track active draggable id to hide source while dragging
  const [activeDragId, setActiveDragId] = createSignal<string | null>(null)
  // Track scroll containers per day and restore scroll positions after drop
  const scrollElMap = new Map<string, HTMLDivElement>()
  const scrollPos = new Map<string, number>()
  onMount(() => {
    // Focus today's cell if present
    const todayISO = new Date().toISOString().slice(0, 10)
    const idx = days().findIndex((d) => d.toISOString().slice(0, 10) === todayISO)
    setFocusIdx(idx >= 0 ? idx : 0)
  })
  createEffect(() => {
    const idx = focusIdx()
    const el = cellRefs[idx]
    if (el) el.focus()
  })

  // No popover; all events are visible via scroll

  function onDragEnd(ev: DragEvent) {
    const src = ev.draggable?.id as string | undefined
    const dest = ev.droppable?.id as string | undefined
    // Clear active id regardless of valid drop
    setActiveDragId(null)
    if (!src || !dest) return
    const targetDate = new Date(dest)
    const occ = visible().find((e) => (e.sourceId ?? e.id) === src)
    if (!occ) return
    // Skip moving expanded occurrences of recurring events for now
    if (occ.sourceId) return

    // Capture scroll positions for source and destination days before state update
    const srcDayISO = startOfDay(parseISO(occ.start)).toISOString()
    const destDayISO = startOfDay(targetDate).toISOString()
    const srcEl = scrollElMap.get(srcDayISO)
    const destEl = scrollElMap.get(destDayISO)
    if (srcEl) scrollPos.set(srcDayISO, srcEl.scrollTop)
    if (destEl) scrollPos.set(destDayISO, destEl.scrollTop)

    const start = parseISO(occ.start)
    const end = parseISO(occ.end)
    const newStart = set(targetDate, { hours: start.getHours(), minutes: start.getMinutes(), seconds: 0, milliseconds: 0 })
    const duration = end.getTime() - start.getTime()
    const newEnd = new Date(newStart.getTime() + duration)
    actions.update(occ.id, { start: newStart.toISOString(), end: newEnd.toISOString() })

    // Restore scroll positions on next frame after DOM updates
    requestAnimationFrame(() => {
      const sEl = scrollElMap.get(srcDayISO)
      const dEl = scrollElMap.get(destDayISO)
      const sTop = scrollPos.get(srcDayISO)
      const dTop = scrollPos.get(destDayISO)
      if (sEl != null && sTop != null) sEl.scrollTop = sTop
      if (dEl != null && dTop != null) dEl.scrollTop = dTop
    })
  }

  return (
  <DragDropProvider
      collisionDetector={closestCenter}
      onDragStart={(ev) => {
        const id = ev.draggable?.id as string | undefined
        if (id) setActiveDragId(id)
      }}
      onDragEnd={onDragEnd}
    >
      <DragDropSensors />

      <div class="grid grid-cols-7  gap-px bg-gray-50 border-b border-gray-200" role="grid" aria-label="Month grid">
        {/* grid-rows-6 */}

        {/* Day labels */}
        <For each={weekDayLabels()}>
          {(day, index) => (
            <div class={`p-3 text-center text-sm font-medium text-gray-500 border-b border-gray-200 ${index() === weekDayLabels().length - 1 ? '' : 'border-r'}`}>
              {day}
            </div>
          )}
        </For>

        {/* Calendar days cells */}
  {days().map((d, i) => {
          const dayEvents = visible().filter((e) =>
            isWithinInterval(d, { start: startOfDay(parseISO(e.start)), end: endOfDay(parseISO(e.end)) })
          )
          return (
            <MonthDroppable id={d.toISOString()}>

              {/* <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50"> */}
              {/* </div> */}
              <MonthCell
                date={d}
                inMonth={inMonth(d, anchor())}
                tabIndex={focusIdx() === i ? 0 : -1}
                setRef={(el) => (cellRefs[i] = el)}
                isLastInRow={(i + 1) % 7 === 0}
                setScrollRef={(el) => {
                  if (el) scrollElMap.set(startOfDay(d).toISOString(), el)
                }}
                onDayClick={() => {
                  if (!props.onDayClick) return
                  const { startISO, endISO } = defaultMonthClickTimes(d)
                  props.onDayClick(startISO, endISO)
                }}
                onKeyDown={(e) => {
                  const key = e.key
                  let next = focusIdx()
                  if (key === 'ArrowLeft') next = Math.max(0, focusIdx() - 1)
                  else if (key === 'ArrowRight') next = Math.min(days().length - 1, focusIdx() + 1)
                  else if (key === 'ArrowUp') next = Math.max(0, focusIdx() - 7)
                  else if (key === 'ArrowDown') next = Math.min(days().length - 1, focusIdx() + 7)
                  else if (key === 'Home') next = Math.floor(focusIdx() / 7) * 7
                  else if (key === 'End') next = Math.min(days().length - 1, Math.floor(focusIdx() / 7) * 7 + 6)
                  else if (key === 'Enter') {
                    const { startISO, endISO } = defaultMonthClickTimes(d)
                    props.onDayClick?.(startISO, endISO)
                    return
                  }
                  if (next !== focusIdx()) {
                    e.preventDefault()
                    setFocusIdx(next)
                  }
                }}
                childrenEvents={(
                  <>
                    {dayEvents.map((e) => (
                      <MonthDraggable 
                        id={e.sourceId ?? e.id}
                        onEventClick={props.onEventClick}
                        start={e.start}
                        end={e.end}
                        hideSource={activeDragId() === (e.sourceId ?? e.id)}
                      >
                        <MonthPill
                          title={e.title}
                          color={e.color}
                        />
                      </MonthDraggable>
                    ))}
                  </>
                )}
              />
            </MonthDroppable>
          )
        })}
      </div>
      {/* Optional: a simple overlay keeps a drag preview so the source stays visible */}
      <DragOverlay>
        {(draggable) => {
          if (!draggable) return null as any
          // Find event title/color for preview if available
          const occ = visible().find((e) => (e.sourceId ?? e.id) === draggable.id)
          return (
            <div class="pointer-events-none">
              <MonthPill title={occ?.title ?? ''} color={occ?.color} />
            </div>
          )
        }}
      </DragOverlay>
    </DragDropProvider>
  )
}

function MonthDraggable(props: { id: string; children: any; onEventClick?: (id: string, patch?: Partial<EventItem>) => void; start: string; end: string; hideSource?: boolean }) {
  const draggable = createDraggable(props.id)
  return (
    <div 
      use:draggable={draggable} 
  class={`relative z-20 ${props.hideSource ? 'invisible' : ''}`}
      onClick={(e) => {
        // Only trigger click if it's not a drag operation
        if (!e.defaultPrevented) {
          e.stopPropagation();
          props.onEventClick?.(props.id, { start: props.start, end: props.end });
        }
      }}
    >
      {props.children}
    </div>
  )
}

function MonthDroppable(props: { id: string; children: any }) {
  const droppable = createDroppable(props.id)
  return (
    <div use:droppable={droppable} class="overflow-visible">{props.children}</div>
  )
}

// Popover removed
