
import { createSignal, Show, createEffect } from 'solid-js'
import { EventsProvider, useEvents } from './context/EventsContext'
import CalendarNav from './components/CalendarNav'
import MonthView from './components/MonthView'
import WeekView from './components/WeekView'
import DayView from './components/DayView'
import EventForm from './components/EventForm'
// import Sidebar from './components/Sidebar'
import { onCleanup, onMount } from 'solid-js'
import { scheduleReminders } from './utils/reminders'


function CalendarApp() {
  const [open, setOpen] = createSignal(false)
  const [editing, setEditing] = createSignal<any>(null)
  const [state, actions] = useEvents()
  const [remindersOn] = createSignal(false)

  function submit(data: any) {
    if (data.id) actions.update(data.id, data)
    else actions.add({ ...data })
  }

  function onEventClick(id: string, patch?: Partial<{ start: string; end: string }>) {
    // If id looks like an expanded occurrence (id::iso), map back to series id
    const baseId = id.includes('::') ? id.split('::')[0] : id
    const ev = state.events.find((e) => e.id === baseId)
    if (!ev) return
    const isOccurrence = id.includes('::') || !!ev.rrule
    if (isOccurrence && ev.rrule) {
      const choice = window.confirm('Edit only this occurrence? Click OK for this occurrence, Cancel for the entire series.')
      if (choice) {
        // Detach this occurrence as a standalone event instance; add exdate to parent
        const occStartISO = patch?.start ?? ev.start
        const occEndISO = patch?.end ?? ev.end
        const detached = { ...ev, id: `${ev.id}-${occStartISO}`, parentId: ev.id, rrule: undefined, exdates: undefined, start: occStartISO, end: occEndISO }
        actions.update(ev.id, { exdates: [...(ev.exdates ?? []), occStartISO] })
        actions.add(detached as any)
        setEditing(detached)
        setOpen(true)
        return
      }
      // else fall through to edit series
    }
    const initial = { ...ev, ...(patch ?? {}) }
    setEditing(initial)
    setOpen(true)
  }

  onMount(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
      if (e.key.toLowerCase() === 'n') {
        setOpen(true)
      }
      if (['m', 'w', 'd'].includes(e.key.toLowerCase())) {
        const map: any = { m: 'month', w: 'week', d: 'day' }
        actions.setViewMode(map[e.key.toLowerCase()])
      }
      if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
        const delta = e.key === 'ArrowLeft' ? -1 : 1
        const now = new Date(state.viewDate)
        const next = state.viewMode === 'month' ? new Date(now.setMonth(now.getMonth() + delta)) : state.viewMode === 'week' ? new Date(now.setDate(now.getDate() + delta * 7)) : new Date(now.setDate(now.getDate() + delta))
        actions.setViewDate(next.toISOString())
      }
    }
    window.addEventListener('keydown', handler)
    onCleanup(() => window.removeEventListener('keydown', handler))
  })

  // schedule reminders when toggled on
  let cleanup: undefined | (() => void)
  createEffect(() => {
    if (remindersOn()) {
      cleanup?.()
      cleanup = scheduleReminders(state.events)
    } else {
      cleanup?.()
      cleanup = undefined
    }
  })

  return (
    <div class="min-h-screen flex flex-col">
      <CalendarNav />

      <div class="flex-1 overflow-hidden flex">

        <div class="flex-1 overflow-auto">
          <Show when={state.viewMode === 'month'}>
            <MonthView
              onEventClick={(id, patch) => onEventClick(id, patch)}
              onDayClick={(startISO, endISO) => {
                // Prefill a 1-hour event at 9:00 if today; otherwise full-day
                const start = new Date(startISO)
                const end = new Date(endISO)
                if (state.viewMode === 'month') {
                  // Choose noon default 1h for better UX
                  start.setHours(12, 0, 0, 0)
                  end.setTime(start.getTime() + 60 * 60000)
                }
                setEditing({ start: start.toISOString(), end: end.toISOString() })
                setOpen(true)
              }}
            />
          </Show>
          <Show when={state.viewMode === 'week'}>
            <WeekView
              onEventClick={onEventClick}
              onSlotClick={(startISO, endISO) => {
                setEditing({ start: startISO, end: endISO })
                setOpen(true)
              }}
            />
          </Show>
          <Show when={state.viewMode === 'day'}>
            <DayView
              onEventClick={onEventClick}
              onSlotClick={(startISO, endISO) => {
                setEditing({ start: startISO, end: endISO })
                setOpen(true)
              }}
            />
          </Show>
        </div>
      </div>
      <EventForm
        open={open()}
        onClose={() => {
          setOpen(false)
          setEditing(null)
        }}
        initial={editing() ?? undefined}
        onSubmit={submit}
        onDelete={editing()?.id ? () => (actions.remove(editing()!.id), setOpen(false), setEditing(null)) : undefined}
      />
    </div >
  )
}

export default function App() {
  return (
    <EventsProvider>
      <CalendarApp />
    </EventsProvider>
  )
}

