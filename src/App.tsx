
import { createSignal, Show, createEffect } from 'solid-js'
import { EventsProvider, useEvents } from './context/EventsContext'
import CalendarNav from './components/CalendarNav'
import SettingsModal from './components/SettingsModal'
import CheatSheetModal from './components/CheatSheetModal'
import RecurrenceChoiceModal from './components/RecurrenceChoiceModal'
import MonthView from './components/MonthView'
import WeekView from './components/WeekView'
import DayView from './components/DayView'
import EventForm from './components/EventForm'
import { ToastContainer } from './components/ui/Toast'
// import Sidebar from './components/Sidebar'
import { onCleanup, onMount } from 'solid-js'
import { scheduleReminders } from './utils/reminders'


function CalendarApp() {
  const [open, setOpen] = createSignal(false)
  const [editing, setEditing] = createSignal<any>(null)
  const [settingsOpen, setSettingsOpen] = createSignal(false)
  const [cheatsOpen, setCheatsOpen] = createSignal(false)
  const [state, actions] = useEvents()
  const [remindersOn] = createSignal(false)
  const [recurrenceOpen, setRecurrenceOpen] = createSignal(false)
  const [recCtx, setRecCtx] = createSignal<{ baseId: string; ev: any; patch?: Partial<{ start: string; end: string }>; clickedId: string } | null>(null)

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
      // Open a proper modal to choose between editing the series or only this occurrence
      setRecCtx({ baseId, ev, patch, clickedId: id })
      setRecurrenceOpen(true)
      return
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
      if (e.key === '?') {
        setCheatsOpen(true)
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
  <CalendarNav onOpenSettings={() => setSettingsOpen(true)} onOpenCheats={() => setCheatsOpen(true)} />

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
  <SettingsModal open={settingsOpen()} onClose={() => setSettingsOpen(false)} />
  <CheatSheetModal open={cheatsOpen()} onClose={() => setCheatsOpen(false)} />
  <RecurrenceChoiceModal
    open={recurrenceOpen()}
    onCancel={() => { setRecurrenceOpen(false); setRecCtx(null) }}
    onEditOccurrence={() => {
      const ctx = recCtx()
      if (!ctx) return
      const ev = ctx.ev
      const occStartISO = ctx.patch?.start ?? ev.start
      const occEndISO = ctx.patch?.end ?? ev.end
      const detached = { ...ev, id: `${ev.id}-${occStartISO}`, parentId: ev.id, rrule: undefined, exdates: undefined, start: occStartISO, end: occEndISO }
      actions.update(ev.id, { exdates: [...(ev.exdates ?? []), occStartISO] })
      actions.add(detached as any)
      setRecurrenceOpen(false)
      setRecCtx(null)
      setEditing(detached)
      setOpen(true)
    }}
    onEditSeries={() => {
      const ctx = recCtx()
      if (!ctx) return
      const initial = { ...ctx.ev, ...(ctx.patch ?? {}) }
      setRecurrenceOpen(false)
      setRecCtx(null)
      setEditing(initial)
      setOpen(true)
    }}
    title={(() => {
      const ctx = recCtx()
      return ctx?.ev?.title
    })() as any}
    whenLabel={(() => {
      const ctx = recCtx()
      if (!ctx) return undefined
      const s = new Date(ctx.patch?.start ?? ctx.ev.start)
      const e = new Date(ctx.patch?.end ?? ctx.ev.end)
      return `${s.toLocaleString([], { hour: 'numeric', minute: '2-digit', weekday: 'short', month: 'short', day: 'numeric' })} – ${e.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`
    })() as any}
  />
  <ToastContainer />
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

