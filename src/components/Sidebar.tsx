/**
 * Sidebar
 * -------
 * Optional sidebar with simple client-side filters.
 *
 * Features
 * - Text search over events (title, tags, location, notes via filterEvents)
 * - Category toggles (College, Personal, Other)
 *
 * State integration
 * - Reads and updates EventsContext filters.
 */
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
      <div class="mt-4">
        <label class="block text-xs text-gray-600 mb-1">Start of day</label>
        <select
          class="border rounded px-2 py-1 w-full text-sm"
          value={String(state.dayStartHour ?? 0)}
          onChange={(e) => actions.setDayStartHour(parseInt(e.currentTarget.value, 10))}
        >
          {Array.from({ length: 24 }, (_, h) => h).map((h) => (
            <option value={h}>{`${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`}</option>
          ))}
        </select>
      </div>
    </aside>
  )
}
