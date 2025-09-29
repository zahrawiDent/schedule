/**
 * EventForm
 * ---------
 * Modal form used to create or edit events. Manages local form state and emits a normalized
 * payload on submit. Provides basic a11y with focus trap, Esc to close, and keyboard handling.
 */
import { createSignal, createEffect } from 'solid-js'
import type { EventItem } from '../types'
import { EventFormHeader } from './event-form/Header'
import { TitleField } from './event-form/TitleField'
import { ScheduleRow } from './event-form/ScheduleRow'
import { ColorCategory } from './event-form/ColorCategory'
import { LocationNotes } from './event-form/LocationNotes'
import { RepeatRule } from './event-form/RepeatRule'
import { TagsReminders } from './event-form/TagsReminders'
import { EventFormFooter } from './event-form/Footer'
import Modal from './ui/Modal'

type Props = {
  open: boolean
  onClose: () => void
  onSubmit: (data: Omit<EventItem, 'id'> & { id?: string }) => void
  initial?: Partial<EventItem>
  onDelete?: () => void
}

export default function EventForm(props: Props) {
  // Helper to convert ISO string to value acceptable by input[type=datetime-local]
  function toLocalInput(iso?: string): string {
    const d = iso ? new Date(iso) : new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  }
  function toLocalInputFromDate(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, '0')
    const yyyy = d.getFullYear()
    const mm = pad(d.getMonth() + 1)
    const dd = pad(d.getDate())
    const hh = pad(d.getHours())
    const mi = pad(d.getMinutes())
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`
  }
  function addMinutesLocal(local: string, mins: number): string {
    const d = new Date(local)
    d.setMinutes(d.getMinutes() + mins)
    return toLocalInputFromDate(d)
  }

  const [title, setTitle] = createSignal('')
  const [start, setStart] = createSignal(toLocalInput())
  const [end, setEnd] = createSignal(toLocalInput(new Date(Date.now() + 60 * 60 * 1000).toISOString()))
  const [allDay, setAllDay] = createSignal(false)
  const [category, setCategory] = createSignal<'College' | 'Personal' | 'Other'>('Personal')
  const [color, setColor] = createSignal('#2563eb')
  const [rrule, setRrule] = createSignal('')
  const [location, setLocation] = createSignal('')
  const [notes, setNotes] = createSignal('')
  const [tags, setTags] = createSignal('')
  const COLOR_PRESETS = ['#2563eb', '#0891b2', '#16a34a', '#ca8a04', '#ef4444', '#7c3aed', '#0ea5e9', '#f97316']
  const PRESET_REMINDERS = [5, 10, 15, 30, 60]
  const [reminderSet, setReminderSet] = createSignal<Set<number>>(new Set())
  const [extraReminders, setExtraReminders] = createSignal('')

  // Recurrence editor (simple builder) ------------------------------
  type Repeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [repeat, setRepeat] = createSignal<Repeat>('none')
  const [interval, setInterval] = createSignal(1)
  const [endMode, setEndMode] = createSignal<'never' | 'on' | 'after'>('never')
  const [endOn, setEndOn] = createSignal<string>('') // datetime-local
  const [count, setCount] = createSignal<number>(10)
  const DAY_CODES = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'] as const
  const [weekDays, setWeekDays] = createSignal<string[]>([])
  const [useAdvanced, setUseAdvanced] = createSignal(false)

  function yyyymmddThhmmssZ(localDateTime: string): string {
    if (!localDateTime) return ''
    const d = new Date(localDateTime)
    // Convert to UTC and format as YYYYMMDDT000000Z (ignore time part from input)
    const yyyy = d.getUTCFullYear()
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
    const dd = String(d.getUTCDate()).padStart(2, '0')
    return `${yyyy}${mm}${dd}T000000Z`
  }

  function buildRRule(): string {
    if (repeat() === 'none') return ''
    const parts: string[] = []
    const FREQ = repeat().toUpperCase()
    parts.push(`FREQ=${FREQ}`)
    if (interval() > 1) parts.push(`INTERVAL=${interval()}`)
    if (repeat() === 'weekly' && weekDays().length > 0) {
      parts.push(`BYDAY=${weekDays().join(',')}`)
    }
    if (repeat() === 'monthly') {
      // Default to day-of-month of the start date
      const d = new Date(start())
      parts.push(`BYMONTHDAY=${d.getDate()}`)
    }
    if (endMode() === 'on' && endOn()) {
      parts.push(`UNTIL=${yyyymmddThhmmssZ(endOn())}`)
    } else if (endMode() === 'after' && count() > 0) {
      parts.push(`COUNT=${count()}`)
    }
    return parts.join(';')
  }

  function tryParseRRule(raw: string) {
    // Very light-weight parser for common cases
    const m = new Map<string, string>()
    raw.split(';').forEach((kv) => {
      const [k, v] = kv.split('=')
      if (k && v) m.set(k.toUpperCase(), v)
    })
    const freq = (m.get('FREQ') || '').toLowerCase() as Repeat
    if (!freq) { setRepeat('none'); return }
    if (!['daily', 'weekly', 'monthly', 'yearly'].includes(freq)) { setUseAdvanced(true); return }
    setRepeat(freq)
    const iv = parseInt(m.get('INTERVAL') || '1', 10)
    setInterval(Number.isFinite(iv) && iv > 0 ? iv : 1)
    if (freq === 'weekly') {
      const byday = (m.get('BYDAY') || '')
      const days = byday.split(',').map((s) => s.trim()).filter((s) => DAY_CODES.includes(s as any))
      if (days.length) setWeekDays(days)
      else {
        // default to start date's day
        const d = new Date(start())
        setWeekDays([DAY_CODES[d.getDay()]])
      }
    } else if (freq === 'monthly') {
      // ignore BYMONTHDAY parsing for now; builder will regenerate from start date
    }
    if (m.has('COUNT')) {
      const c = parseInt(m.get('COUNT') || '0', 10)
      if (Number.isFinite(c) && c > 0) { setEndMode('after'); setCount(c) }
    } else if (m.has('UNTIL')) {
      // UNTIL in forms like YYYYMMDD or YYYYMMDDTHHMMSSZ
      const until = m.get('UNTIL') || ''
      const y = until.slice(0, 4), mo = until.slice(4, 6), d = until.slice(6, 8)
      if (y && mo && d) { setEndMode('on'); setEndOn(`${y}-${mo}-${d}T00:00`) }
    } else {
      setEndMode('never')
    }
  }

  // Sync local state whenever the modal opens or the initial prop changes
  createEffect(() => {
    if (!props.open) return
    const init = props.initial ?? {}
    setTitle(init.title ?? '')
    setAllDay(!!init.allDay)
    setStart(toLocalInput(init.start))
    // default end = start + 1h (or +1 day if all-day) when not provided
    const defaultEndISO = (() => {
      if (!init.start) return undefined
      const sd = new Date(init.start)
      if (init.allDay) {
        const ed = new Date(sd)
        ed.setDate(sd.getDate() + 1)
        ed.setHours(0, 0, 0, 0)
        return ed.toISOString()
      }
      return new Date(sd.getTime() + 60 * 60 * 1000).toISOString()
    })()
    const endISO = init.end ?? defaultEndISO
    setEnd(toLocalInput(endISO))
    setCategory((init.category as any) ?? 'Personal')
    setColor(init.color ?? '#2563eb')
    const raw = init.rrule ?? ''
    setRrule(raw)
    // Initialize builder
    setUseAdvanced(false)
    setInterval(1)
    setRepeat('none')
    setEndMode('never')
    setEndOn('')
    setCount(10)
    // Preselect weekly day to start's DOW by default
    const s = new Date(toLocalInput(init.start))
    setWeekDays([DAY_CODES[s.getDay()]])
    if (raw) {
      tryParseRRule(raw)
    }
    setTags((init.tags ?? []).join(', '))
    setLocation(init.location ?? '')
    setNotes(init.notes ?? '')
    setReminderSet(new Set((init.reminderMinutes ?? []).filter((n) => Number.isFinite(n))))
    setExtraReminders('')
  })

  // When builder changes (and not in advanced mode), regenerate RRULE
  createEffect(() => {
    if (!props.open) return
    if (useAdvanced()) return
    const r = buildRRule()
    setRrule(r)
  })

  const submit = (e: Event) => {
    e.preventDefault()
    // Validation
    const s = new Date(start())
    const en = new Date(end())
    if (en.getTime() <= s.getTime()) {
      // naive guard; UI also prevents invalid end
      alert('End must be after start')
      return
    }
    // Compose reminders
    const extra = extraReminders()
      .split(',')
      .map((n) => parseInt(n.trim(), 10))
      .filter((n) => Number.isFinite(n) && n >= 0)
    const finalRem = Array.from(new Set<number>([...Array.from(reminderSet()), ...extra]))

    props.onSubmit({
      ...(props.initial?.id ? { id: props.initial.id } : {}),
      title: title(),
      // datetime-local values are local time; convert to ISO (UTC) for storage
      start: new Date(start()).toISOString(),
      end: new Date(end()).toISOString(),
      allDay: allDay() || undefined,
      category: category() as any,
      color: color(),
      rrule: rrule().trim() || undefined,
      location: location() || undefined,
      notes: notes() || undefined,
      tags: tags().split(',').map((t) => t.trim()).filter(Boolean),
      reminderMinutes: finalRem,
    })
    props.onClose()
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title={props.initial?.id ? 'Edit event' : 'New event'} size="xl" onSubmit={submit as any}>
      <form onSubmit={submit} aria-label="Event form">
        {/* Header (keep actions in header within the form’s content as we have modal title) */}
        <EventFormHeader isEdit={!!props.initial?.id} onClose={props.onClose} />

        {/* Body */}
        <div class="px-1 py-2 sm:px-2 sm:py-3 space-y-4 sm:space-y-5">
            <TitleField title={title} setTitle={setTitle} />
            <ScheduleRow
              allDay={allDay}
              setAllDay={setAllDay}
              start={start}
              setStart={setStart}
              end={end}
              setEnd={setEnd}
              toLocalInputFromDate={toLocalInputFromDate}
              addMinutesLocal={addMinutesLocal}
            />

            <ColorCategory category={category as any} setCategory={setCategory as any} color={color} setColor={setColor} presets={COLOR_PRESETS} />

            <LocationNotes location={location} setLocation={setLocation} notes={notes} setNotes={setNotes} />

            <RepeatRule
              repeat={repeat}
              setRepeat={setRepeat}
              interval={interval}
              setInterval={setInterval}
              endMode={endMode}
              setEndMode={setEndMode}
              endOn={endOn}
              setEndOn={setEndOn}
              count={count}
              setCount={setCount}
              weekDays={weekDays}
              setWeekDays={setWeekDays}
              DAY_CODES={DAY_CODES as any}
              start={start}
              rrule={rrule}
              setRrule={setRrule}
              useAdvanced={useAdvanced}
              setUseAdvanced={setUseAdvanced}
            />

            <TagsReminders
              tags={tags}
              setTags={setTags}
              reminderSet={reminderSet}
              setReminderSet={setReminderSet}
              extraReminders={extraReminders}
              setExtraReminders={setExtraReminders}
              presets={PRESET_REMINDERS}
            />
        </div>

        {/* Footer */}
        <EventFormFooter onDelete={props.onDelete} onCancel={props.onClose} />
      </form>
    </Modal>
  )
}
