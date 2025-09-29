import type { Accessor, Setter } from 'solid-js'
import { Show } from 'solid-js'
import { Switch } from '../../components/ui/Switch'

export function ScheduleRow(props: {
  allDay: Accessor<boolean>
  setAllDay: Setter<boolean>
  start: Accessor<string>
  setStart: Setter<string>
  end: Accessor<string>
  setEnd: Setter<string>
  toLocalInputFromDate: (d: Date) => string
  addMinutesLocal: (local: string, mins: number) => string
}) {
  const toggleAllDay = (checked: boolean) => {
    props.setAllDay(checked)
    if (checked) {
      const d = new Date(props.start())
      d.setHours(0, 0, 0, 0)
      props.setStart(props.toLocalInputFromDate(d))
      const e2 = new Date(d)
      e2.setDate(d.getDate() + 1)
      props.setEnd(props.toLocalInputFromDate(e2))
    }
  }

  const adjustEnd = (deltaMins: number) => {
    // Proposed next end
    const next = new Date(props.addMinutesLocal(props.end(), deltaMins))
    const st = new Date(props.start())
    // Minimum gap: 15 minutes after start
    const min = new Date(st)
    min.setMinutes(min.getMinutes() + 15)
    if (next.getTime() < min.getTime()) {
      props.setEnd(props.toLocalInputFromDate(min))
    } else {
      props.setEnd(props.toLocalInputFromDate(next))
    }
  }

  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Start + All-day switch */}
      <div>
        <label class="text-xs font-medium text-gray-600 block mb-1">Start</label>
        <input
          type={props.allDay() ? 'date' : 'datetime-local'}
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          value={props.allDay() ? props.start().slice(0, 10) : props.start()}
          onInput={(e) => {
            const v = e.currentTarget.value
            if (props.allDay()) props.setStart(`${v}T00:00`)
            else props.setStart(v)
          }}
        />
        <div class="mt-3">
          <label for="all-day" class="text-xs font-medium text-gray-600 block mb-1">All-day</label>
          <Switch id="all-day" checked={props.allDay} onChange={(next) => toggleAllDay(next)} label="All-day" />
        </div>
      </div>

      {/* End + +/- controls */}
      <div>
        <label class="text-xs font-medium text-gray-600 block mb-1">End</label>
        <input
          type={props.allDay() ? 'date' : 'datetime-local'}
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          value={props.allDay() ? props.end().slice(0, 10) : props.end()}
          min={props.allDay() ? props.start().slice(0, 10) : props.start()}
          onInput={(e) => {
            const v = e.currentTarget.value
            if (props.allDay()) props.setEnd(`${v}T00:00`)
            else props.setEnd(v)
          }}
        />
        <Show when={!props.allDay()}>
          <div class="mt-3 flex items-center gap-2 text-[11px] text-gray-600">
            <span>Adjust:</span>
            <button
              type="button"
              class="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
              aria-label="Decrease 15 minutes"
              onClick={() => adjustEnd(-15)}
            >
              −15m
            </button>
            <button
              type="button"
              class="px-2 py-1 rounded border border-gray-300 hover:bg-gray-100"
              aria-label="Increase 15 minutes"
              onClick={() => adjustEnd(15)}
            >
              +15m
            </button>
          </div>
        </Show>
      </div>
    </div>
  )
}
