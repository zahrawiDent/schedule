import { useEvents } from '../context/EventsContext'
import type { WeekStartDay } from '../types'
import Modal from './ui/Modal'

export default function SettingsModal(props: { open: boolean; onClose: () => void }) {
  const [state, actions] = useEvents()

  const weekDayLabel = (d: number) => ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][d]!
  const hourLabel = (h: number) => `${((h + 11) % 12) + 1}${h < 12 ? 'am' : 'pm'}`

  return (
    <Modal open={props.open} onClose={props.onClose} title="Settings" size="md">
      <div class="space-y-4">
            {/* Week starts on */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Week starts on</label>
              <select
                class="w-full border rounded-md px-2 py-1 bg-white"
                value={String(state.weekStartsOn)}
                onChange={(e) => actions.setWeekStartsOn(parseInt(e.currentTarget.value, 10) as WeekStartDay)}
              >
                {Array.from({ length: 7 }, (_, d) => d).map((d) => (
                  <option value={d}>{weekDayLabel(d)}</option>
                ))}
              </select>
            </div>

            {/* Start of day */}
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Start of day</label>
              <select
                class="w-full border rounded-md px-2 py-1 bg-white"
                value={String(state.dayStartHour ?? 0)}
                onChange={(e) => actions.setDayStartHour(parseInt(e.currentTarget.value, 10))}
              >
                {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                  <option value={h}>{hourLabel(h)}</option>
                ))}
              </select>
            </div>
      </div>
      <div slot="footer" />
    </Modal>
  )
}
