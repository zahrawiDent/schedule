import { Show } from 'solid-js'
import type { Accessor, Setter } from 'solid-js'

export type Repeat = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'

export function RepeatRule(props: {
  repeat: Accessor<Repeat>
  setRepeat: Setter<Repeat>
  interval: Accessor<number>
  setInterval: Setter<number>
  endMode: Accessor<'never' | 'on' | 'after'>
  setEndMode: Setter<'never' | 'on' | 'after'>
  endOn: Accessor<string>
  setEndOn: Setter<string>
  count: Accessor<number>
  setCount: Setter<number>
  weekDays: Accessor<string[]>
  setWeekDays: Setter<string[]>
  DAY_CODES: readonly string[]
  start: Accessor<string>
  rrule: Accessor<string>
  setRrule: Setter<string>
  useAdvanced: Accessor<boolean>
  setUseAdvanced: Setter<boolean>
}) {
  return (
    <div class="space-y-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-medium text-gray-600 block">Repeat</label>
        <button
          type="button"
          class="text-xs text-blue-700 hover:underline"
          onClick={() => props.setUseAdvanced(!props.useAdvanced())}
        >
          {props.useAdvanced() ? 'Back to simple' : 'Advanced (RRULE)'}
        </button>
      </div>

      <Show when={!props.useAdvanced()}>
        <div class="grid sm:grid-cols-2 gap-2 items-center">
          <select
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            value={props.repeat()}
            onChange={(e) => props.setRepeat(e.currentTarget.value as any)}
          >
            <option value="none">Does not repeat</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
          <Show when={props.repeat() !== 'none'}>
            <div class="flex items-center gap-2 sm:gap-3">
              <span class="text-xs text-gray-600">Every</span>
              <input
                type="number"
                min={1}
                class="w-20 rounded-md border border-gray-300 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                value={String(props.interval())}
                onInput={(e) => props.setInterval(Math.max(1, parseInt(e.currentTarget.value || '1', 10)))}
              />
              <span class="text-xs text-gray-600 capitalize">{props.repeat()}</span>
            </div>
          </Show>
        </div>

        <Show when={props.repeat() === 'weekly'}>
          <div class="flex flex-wrap gap-1.5">
            {props.DAY_CODES.map((d, idx) => (
              <button
                type="button"
                class={`px-2 py-1 rounded border text-xs ${props.weekDays().includes(d) ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                onClick={() => {
                  const cur = new Set(props.weekDays())
                  if (cur.has(d)) cur.delete(d)
                  else cur.add(d)
                  const next = Array.from(cur)
                  // Ensure at least one day is selected
                  if (next.length === 0) {
                    const dow = new Date(props.start()).getDay()
                    props.setWeekDays([props.DAY_CODES[dow] as string])
                  } else props.setWeekDays(next)
                }}
                aria-pressed={props.weekDays().includes(d)}
              >
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][idx]}
              </button>
            ))}
          </div>
        </Show>

        <Show when={props.repeat() !== 'none'}>
          <div class="mt-1">
            <div class="text-xs font-medium text-gray-600 mb-1">Ends</div>
            <div class="flex flex-wrap items-center gap-3 text-sm">
              <label class="inline-flex items-center gap-1">
                <input type="radio" name="ends" checked={props.endMode() === 'never'} onInput={() => props.setEndMode('never')} />
                <span>Never</span>
              </label>
              <label class="inline-flex items-center gap-1">
                <input type="radio" name="ends" checked={props.endMode() === 'on'} onInput={() => props.setEndMode('on')} />
                <span>On</span>
                <input type="date" class="ml-1 rounded border border-gray-300 px-2 py-1"
                  value={props.endOn().slice(0,10)}
                  onInput={(e) => props.setEndOn(`${e.currentTarget.value}T00:00`)}
                  disabled={props.endMode() !== 'on'}
                />
              </label>
              <label class="inline-flex items-center gap-1">
                <input type="radio" name="ends" checked={props.endMode() === 'after'} onInput={() => props.setEndMode('after')} />
                <span>After</span>
                <input type="number" min={1} class="ml-1 w-20 rounded border border-gray-300 px-2 py-1"
                  value={String(props.count())}
                  onInput={(e) => props.setCount(Math.max(1, parseInt(e.currentTarget.value || '1', 10)))}
                  disabled={props.endMode() !== 'after'}
                />
                <span>occurrence(s)</span>
              </label>
            </div>
          </div>
        </Show>

        <div class="text-[11px] text-gray-500">
          <Show when={props.repeat() === 'none'} fallback={<span>Rule preview: <code class="text-gray-800">{props.rrule() || '(none)'}</code></span>}>
            <span>Leave as “Does not repeat” for one-time events.</span>
          </Show>
        </div>
      </Show>

      <Show when={props.useAdvanced()}>
        <div>
          <label class="text-xs font-medium text-gray-600 block mb-1">Repeat rule (RRULE)</label>
          <input
            class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
            placeholder="e.g. FREQ=WEEKLY;BYDAY=MO,WE"
            value={props.rrule()}
            onInput={(e) => props.setRrule(e.currentTarget.value)}
          />
        </div>
      </Show>
    </div>
  )
}
