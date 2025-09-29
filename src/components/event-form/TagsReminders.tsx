import type { Accessor, Setter } from 'solid-js'

export function TagsReminders(props: {
  tags: Accessor<string>
  setTags: Setter<string>
  reminderSet: Accessor<Set<number>>
  setReminderSet: Setter<Set<number>>
  extraReminders: Accessor<string>
  setExtraReminders: Setter<string>
  presets: number[]
}) {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
      <div>
        <label class="text-xs font-medium text-gray-600 block mb-1">Tags</label>
        <input
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          placeholder="Comma-separated (e.g. work, urgent)"
          value={props.tags()}
          onInput={(e) => props.setTags(e.currentTarget.value)}
        />
      </div>
      <div>
        <label class="text-xs font-medium text-gray-600 block mb-1">Reminders</label>
        <div class="flex flex-wrap gap-1.5 mb-1">
          {props.presets.map((m) => {
            const on = props.reminderSet().has(m)
            return (
              <button
                type="button"
                class={`px-2 py-1 rounded border text-xs ${on ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
                onClick={() => {
                  const s = new Set(props.reminderSet())
                  if (s.has(m)) s.delete(m)
                  else s.add(m)
                  props.setReminderSet(s)
                }}
              >
                {m}m
              </button>
            )
          })}
        </div>
        <input
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          placeholder="Custom (comma-separated, e.g. 90, 120)"
          value={props.extraReminders()}
          onInput={(e) => props.setExtraReminders(e.currentTarget.value)}
        />
        <p class="mt-1 text-[11px] text-gray-500">You’ll get notifications before the event.</p>
      </div>
    </div>
  )
}
