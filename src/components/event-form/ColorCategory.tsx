import type { Accessor, Setter } from 'solid-js'

export function ColorCategory(props: {
  category: Accessor<'College' | 'Personal' | 'Other'>
  setCategory: Setter<'College' | 'Personal' | 'Other'>
  color: Accessor<string>
  setColor: Setter<string>
  presets: string[]
}) {
  return (
    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 items-end">
      <div>
        <label class="text-xs font-medium text-gray-600 block mb-1">Category</label>
        <select
          class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
          value={props.category()}
          onChange={(e) => props.setCategory(e.currentTarget.value as any)}
        >
          <option>College</option>
          <option>Personal</option>
          <option>Other</option>
        </select>
      </div>
      <div>
        <label class="text-xs font-medium text-gray-600 block mb-1">Color</label>
        <div class="flex flex-wrap items-center gap-2">
          <input
            type="color"
            class="rounded-md border border-gray-300 h-8 w-10 p-0.5 bg-white"
            value={props.color()}
            onInput={(e) => props.setColor(e.currentTarget.value)}
            aria-label="Pick color"
            title="Pick color"
          />
          {props.presets.map((c) => (
            <button
              type="button"
              class="h-6 w-6 rounded border"
              style={{ 'background-color': c, 'box-shadow': props.color() === c ? '0 0 0 2px white, 0 0 0 4px #3b82f6' : undefined }}
              onClick={() => props.setColor(c)}
              aria-label={`Use color ${c}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
