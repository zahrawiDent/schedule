import type { Accessor, Setter } from 'solid-js'

export function TitleField(props: { title: Accessor<string>; setTitle: Setter<string> }) {
  return (
    <div>
      <label class="text-xs font-medium text-gray-600 block mb-1">Title</label>
      <input
        class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
        value={props.title()}
        onInput={(e) => props.setTitle(e.currentTarget.value)}
        placeholder="Event title"
        required
      />
    </div>
  )
}
