/**
 * MonthView
 * ---------
 * Renders a month grid with 7 columns and 5-6 weeks, using MonthCell for each day and
 * MonthPill for events. Supports drag-and-drop to move events between days, keyboard
 * navigation with roving focus, auto-scroll during drag, and a simple click-to-add interaction.
 */
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
  const dayKey = (d: Date) => {
    // Use local date key to avoid timezone offset issues
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }
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

  // Track pointer position during drag to resolve drop via elementFromPoint
  let lastPointer = { x: 0, y: 0 }
  const onGlobalPointerMove = (e: PointerEvent) => {
    lastPointer.x = (e as any).clientX
    lastPointer.y = (e as any).clientY
  }

  // Auto-scroll while dragging near edges
  let autoScrollRaf = 0
  const AUTO_THRESH = 28 // px from edge to start auto-scroll
  const MAX_SPEED = 16 // px per frame for inner lists
  const MAX_WIN_SPEED = 20 // px per frame for window
  const autoScrollTick = () => {
    // Determine which day we're currently over
    let dayKeyHit: string | undefined
    try {
      const el = document.elementFromPoint(lastPointer.x, lastPointer.y) as HTMLElement | null
      const hit = el?.closest('[data-day-key]') as HTMLElement | null
      dayKeyHit = hit?.getAttribute('data-day-key') || undefined
    } catch {}

    if (dayKeyHit) {
      const scroller = scrollElMap.get(dayKeyHit)
      if (scroller) {
        const rect = scroller.getBoundingClientRect()
        const dyTop = lastPointer.y - rect.top
        const dyBottom = rect.bottom - lastPointer.y
        let delta = 0
        if (dyTop >= 0 && dyTop < AUTO_THRESH) {
          const factor = (AUTO_THRESH - dyTop) / AUTO_THRESH
          delta = -Math.ceil(factor * MAX_SPEED)
        } else if (dyBottom >= 0 && dyBottom < AUTO_THRESH) {
          const factor = (AUTO_THRESH - dyBottom) / AUTO_THRESH
          delta = Math.ceil(factor * MAX_SPEED)
        }
        if (delta !== 0) {
          scroller.scrollTop += delta
        }
      }
    }

    // Also auto-scroll the window if near viewport edges
    const vh = window.innerHeight
    const dyTopView = lastPointer.y
    const dyBottomView = vh - lastPointer.y
    let winDelta = 0
    if (dyTopView < AUTO_THRESH) {
      const factor = (AUTO_THRESH - dyTopView) / AUTO_THRESH
      winDelta = -Math.ceil(factor * MAX_WIN_SPEED)
    } else if (dyBottomView < AUTO_THRESH) {
      const factor = (AUTO_THRESH - dyBottomView) / AUTO_THRESH
      winDelta = Math.ceil(factor * MAX_WIN_SPEED)
    }
    if (winDelta !== 0) window.scrollBy(0, winDelta)

    autoScrollRaf = window.requestAnimationFrame(autoScrollTick)
  }
  const startAutoScroll = () => {
    if (autoScrollRaf) return
    autoScrollRaf = window.requestAnimationFrame(autoScrollTick)
  }
  const stopAutoScroll = () => {
    if (autoScrollRaf) {
      window.cancelAnimationFrame(autoScrollRaf)
      autoScrollRaf = 0
    }
  }

  function onDragEnd(ev: DragEvent) {
    const src = ev.draggable?.id as string | undefined
    let dest = ev.droppable?.id as string | undefined
    // Clear active id regardless of valid drop
    setActiveDragId(null)
    // Stop tracking pointer
    window.removeEventListener('pointermove', onGlobalPointerMove)
  stopAutoScroll()

    // Resolve destination using the element under the actual pointer at drop time
    try {
      const el = document.elementFromPoint(lastPointer.x, lastPointer.y) as HTMLElement | null
      const hit = el?.closest('[data-day-key]') as HTMLElement | null
      const key = hit?.getAttribute('data-day-key') || undefined
      if (key) dest = key
    } catch {}
    if (!src || !dest) return
  // Decode local date-only key
  const [y, m, d] = (dest || '').split('-').map((n) => parseInt(n, 10))
  if (!y || !m || !d) return
  const targetDate = new Date(y, m - 1, d)
    const occ = visible().find((e) => (e.sourceId ?? e.id) === src)
    if (!occ) return
    // Skip moving expanded occurrences of recurring events for now
    if (occ.sourceId) return

    // Capture scroll positions for source and destination days before state update
  const srcKey = dayKey(startOfDay(parseISO(occ.start)))
  const destKey = dayKey(startOfDay(targetDate))
  const srcEl = scrollElMap.get(srcKey)
  const destEl = scrollElMap.get(destKey)
  if (srcEl) scrollPos.set(srcKey, srcEl.scrollTop)
  if (destEl) scrollPos.set(destKey, destEl.scrollTop)

    const start = parseISO(occ.start)
    const end = parseISO(occ.end)
    const newStart = set(targetDate, { hours: start.getHours(), minutes: start.getMinutes(), seconds: 0, milliseconds: 0 })
    const duration = end.getTime() - start.getTime()
    const newEnd = new Date(newStart.getTime() + duration)
    actions.update(occ.id, { start: newStart.toISOString(), end: newEnd.toISOString() })

    // Restore scroll positions on next frame after DOM updates
    requestAnimationFrame(() => {
      const sEl = scrollElMap.get(srcKey)
      const dEl = scrollElMap.get(destKey)
      const sTop = scrollPos.get(srcKey)
      const dTop = scrollPos.get(destKey)
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
  // Begin tracking pointer position during drag
  window.addEventListener('pointermove', onGlobalPointerMove)
  startAutoScroll()
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
            <MonthDroppable id={dayKey(d)}>

              {/* <div class="grid grid-cols-7 border-b border-gray-200 bg-gray-50"> */}
              {/* </div> */}
              <MonthCell
                date={d}
                inMonth={inMonth(d, anchor())}
                tabIndex={focusIdx() === i ? 0 : -1}
                setRef={(el) => (cellRefs[i] = el)}
                isLastInRow={(i + 1) % 7 === 0}
                setScrollRef={(el) => {
                  if (el) scrollElMap.set(dayKey(startOfDay(d)), el)
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
  <div use:droppable={droppable} class="overflow-visible" data-day-key={props.id}>{props.children}</div>
  )
}

// Popover removed
