import { useEvents } from '../context/EventsContext'

export default function Sidebar() {
  const [state, actions] = useEvents()

  return (
    <aside class="p-2 border-r w-full sm:w-64 flex gap-2 sm:block">
      <input
        type="search"
        placeholder="Search events..."
        class="border rounded px-2 py-1 w-full"
        value={state.filters.query ?? ''}
        onInput={(e) => actions.setFilters({ query: e.currentTarget.value })}
        aria-label="Search events"
      />
      <div class="mt-2 flex gap-2 sm:flex-col">
        {['College', 'Personal', 'Other'].map((c) => {
          const active = state.filters.categories?.includes(c as any)
          return (
            <button
              class={`px-2 py-1 rounded border text-sm ${active ? 'bg-gray-900 text-white' : ''}`}
              onClick={() => {
                const list = new Set(state.filters.categories ?? [])
                if (list.has(c as any)) list.delete(c as any)
                else list.add(c as any)
                actions.setFilters({ categories: Array.from(list) as any })
              }}
            >
              {c}
            </button>
          )
        })}
      </div>
    </aside>
  )
}
