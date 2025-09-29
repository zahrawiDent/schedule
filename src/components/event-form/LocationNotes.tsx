import type { Accessor, Setter } from 'solid-js'

export function LocationNotes(props: {
  location: Accessor<string>
  setLocation: Setter<string>
  notes: Accessor<string>
  setNotes: Setter<string>
}) {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <label class="text-xs font-medium text-gray-600 block mb-1">Location</label>
        <input
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          placeholder="Where is it?"
          value={props.location()}
          onInput={(e) => props.setLocation(e.currentTarget.value)}
        />
      </div>
      <div>
        <label class="text-xs font-medium text-gray-600 block mb-1">Notes</label>
        <input
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          placeholder="Details, links, etc."
          value={props.notes()}
          onInput={(e) => props.setNotes(e.currentTarget.value)}
        />
      </div>
    </div>
  )
}
