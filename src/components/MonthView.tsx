import { monthGrid, inMonth } from '../utils/dateUtils'
import { parseISO, format, startOfDay, endOfDay, isWithinInterval, set } from 'date-fns'
import { useEvents } from '../context/EventsContext'
import { expandEventsForRange, filterEvents } from '../utils/occurrence'
import { startOfMonth, endOfMonth } from 'date-fns'
import { DragDropProvider, DragDropSensors, closestCenter, createDraggable, createDroppable } from '@thisbeyond/solid-dnd'
import type { DragEvent } from '@thisbeyond/solid-dnd'
import { createSignal, onMount, createEffect, onCleanup } from 'solid-js'
import MonthCell from './MonthCell'
import MonthPill from './MonthPill'
import { defaultMonthClickTimes } from '../utils/slots'
import type { EventItem } from '../types'

export default function MonthView(props: { onEventClick?: (id: string, patch?: Partial<EventItem>) => void; onDayClick?: (startISO: string, endISO: string) => void }) {
  const [state, actions] = useEvents()
  const anchor = () => parseISO(state.viewDate)
  const days = () => monthGrid(anchor())
  const rangeStart = () => startOfDay(startOfMonth(anchor()))
  const rangeEnd = () => endOfDay(endOfMonth(anchor()))
  const occurrences = () => expandEventsForRange(state.events, rangeStart(), rangeEnd())
  const visible = () => filterEvents(occurrences(), { query: state.filters.query, categories: state.filters.categories as any })

  // Roving tabindex for keyboard navigation within the month grid
  const [focusIdx, setFocusIdx] = createSignal(0)
  let cellRefs: Array<HTMLDivElement | null> = []
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

  // Day popover for listing all events when "+N more" is clicked
  const [openDayISO, setOpenDayISO] = createSignal<string | null>(null)

  function onDragEnd(ev: DragEvent) {
    const src = ev.draggable?.id as string | undefined
    const dest = ev.droppable?.id as string | undefined
    if (!src || !dest) return
    const targetDate = new Date(dest)
    const occ = visible().find((e) => (e.sourceId ?? e.id) === src)
    if (!occ) return
    // Skip moving expanded occurrences of recurring events for now
    if (occ.sourceId) return
    const start = parseISO(occ.start)
    const end = parseISO(occ.end)
    const newStart = set(targetDate, { hours: start.getHours(), minutes: start.getMinutes(), seconds: 0, milliseconds: 0 })
    const duration = end.getTime() - start.getTime()
    const newEnd = new Date(newStart.getTime() + duration)
    actions.update(occ.id, { start: newStart.toISOString(), end: newEnd.toISOString() })
  }

  return (
    <DragDropProvider collisionDetector={closestCenter} onDragEnd={onDragEnd}>
      <DragDropSensors />
      <div class="grid grid-cols-7 grid-rows-6 gap-px bg-gray-50 border-b border-gray-200" role="grid" aria-label="Month grid">
        {days().map((d, i) => {
          const dayEvents = visible().filter((e) =>
            isWithinInterval(d, { start: startOfDay(parseISO(e.start)), end: endOfDay(parseISO(e.end)) })
          )
          return (
            <MonthDroppable id={d.toISOString()}>
              <MonthCell
                date={d}
                inMonth={inMonth(d, anchor())}
                tabIndex={focusIdx() === i ? 0 : -1}
                setRef={(el) => (cellRefs[i] = el)}
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
                    {dayEvents.slice(0, 4).map((e) => (
                      <MonthDraggable id={e.sourceId ?? e.id}>
                        <MonthPill
                          title={e.title}
                          color={e.color}
                          onActivate={() => props.onEventClick?.(e.sourceId ?? e.id, { start: e.start, end: e.end })}
                        />
                      </MonthDraggable>
                    ))}
                  </>
                )}
                moreCount={dayEvents.length > 4 ? dayEvents.length - 4 : 0}
                onMoreClick={() => setOpenDayISO(d.toISOString())}
              />
            </MonthDroppable>
          )
        })}
      </div>
      {/* Day events popover */}
      <ShowDayPopover
        dayISO={openDayISO()}
        onClose={() => setOpenDayISO(null)}
        events={visible()}
        onEventClick={(id, patch) => props.onEventClick?.(id, patch)}
        onAdd={(dayISO) => {
          const d = new Date(dayISO)
          const s = startOfDay(d)
          s.setHours(12, 0, 0, 0)
          const e = new Date(s.getTime() + 60 * 60000)
          props.onDayClick?.(s.toISOString(), e.toISOString())
        }}
      />
    </DragDropProvider>
  )
}

function MonthDraggable(props: { id: string; children: any }) {
  const draggable = createDraggable(props.id)
  return (
    <div use:draggable={draggable} class="relative z-20">{props.children}</div>
  )
}

function MonthDroppable(props: { id: string; children: any }) {
  const droppable = createDroppable(props.id)
  return (
    <div use:droppable={droppable} class="overflow-visible">{props.children}</div>
  )
}

function ShowDayPopover(props: {
  dayISO: string | null
  events: ReturnType<typeof expandEventsForRange>
  onClose: () => void
  onEventClick: (id: string, patch?: Partial<EventItem>) => void
  onAdd: (dayISO: string) => void
}) {
  if (!props.dayISO) return null as any
  const day = parseISO(props.dayISO)
  let dialogEl: HTMLDivElement | null = null
  let lastFocus: Element | null = null

  function getFocusable(root: HTMLElement): HTMLElement[] {
    const sel = [
      'a[href]', 'area[href]', 'button:not([disabled])', 'input:not([disabled])', 'select:not([disabled])',
      'textarea:not([disabled])', 'iframe', 'object', 'embed', '[tabindex]:not([tabindex="-1"])', '[contenteditable="true"]'
    ].join(',')
    return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((el) => el.offsetParent !== null)
  }

  onMount(() => {
    lastFocus = document.activeElement
    // Focus first focusable in dialog
    queueMicrotask(() => {
      const els = dialogEl ? getFocusable(dialogEl) : []
        ; (els[0] as HTMLElement | undefined)?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        props.onClose()
      }
    }
    window.addEventListener('keydown', onKey)
    onCleanup(() => window.removeEventListener('keydown', onKey))
  })

  onCleanup(() => {
    const el = lastFocus as HTMLElement | null
    if (el?.focus) el.focus()
  })

  function onKeyDownTrap(e: KeyboardEvent) {
    if (e.key !== 'Tab' || !dialogEl) return
    const els = getFocusable(dialogEl)
    if (els.length === 0) return
    const first = els[0]
    const last = els[els.length - 1]
    const active = document.activeElement
    if (!e.shiftKey && active === last) {
      e.preventDefault()
        ; (first as HTMLElement).focus()
    } else if (e.shiftKey && active === first) {
      e.preventDefault()
        ; (last as HTMLElement).focus()
    }
  }

  const list = props.events
    .filter((e) => isWithinInterval(day, { start: startOfDay(parseISO(e.start)), end: endOfDay(parseISO(e.end)) }))
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
  return (
    <div class="fixed inset-0 z-40 flex items-center justify-center" aria-hidden={false}>
      <div class="absolute inset-0 bg-black/30" onClick={props.onClose} />
      <div
        ref={(el) => (dialogEl = el)}
        class="relative z-10 w-[min(90vw,480px)] max-h-[80vh] rounded bg-white shadow-lg overflow-hidden outline-none"
        role="dialog"
        aria-modal="true"
        aria-label="Day events"
        tabindex={-1}
        onKeyDown={(e) => onKeyDownTrap(e as unknown as KeyboardEvent)}
      >
        <div class="flex items-center justify-between px-4 py-2 border-b">
          <div class="font-semibold">{format(day, 'PPPP')}</div>
          <div class="flex gap-2">
            <button class="px-2 py-1 text-sm rounded border" onClick={() => props.onAdd(props.dayISO!)}>Add event</button>
            <button class="px-2 py-1 text-sm rounded border" onClick={props.onClose}>Close</button>
          </div>
        </div>
        <div class="p-2 overflow-auto divide-y">
          {list.map((e) => (
            <button
              class="w-full text-left px-2 py-2 hover:bg-gray-50 rounded"
              title={e.title}
              onClick={() => props.onEventClick(e.sourceId ?? e.id, { start: e.start, end: e.end })}
            >
              <div class="flex items-center gap-2">
                <span class="inline-block w-2 h-2 rounded" style={{ 'background-color': e.color ?? '#94a3b8' }} />
                <span class="font-medium truncate flex-1">{e.title}</span>
                <span class="text-xs text-gray-600 whitespace-nowrap">{format(parseISO(e.start), 'p')} – {format(parseISO(e.end), 'p')}</span>
              </div>
              {e.location && <div class="text-xs text-gray-500 truncate mt-0.5">{e.location}</div>}
            </button>
          ))}
          {list.length === 0 && (
            <div class="text-sm text-gray-500 px-2 py-6 text-center">No events</div>
          )}
        </div>
      </div>
    </div>
  )
}
