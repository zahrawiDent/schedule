import { createSignal, Show, onCleanup, createEffect } from 'solid-js'
import type { EventItem } from '../types'

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

  const [title, setTitle] = createSignal('')
  const [start, setStart] = createSignal(toLocalInput())
  const [end, setEnd] = createSignal(toLocalInput(new Date(Date.now() + 60 * 60 * 1000).toISOString()))
  const [category, setCategory] = createSignal<'College' | 'Personal' | 'Other'>('Personal')
  const [color, setColor] = createSignal('#2563eb')
  const [rrule, setRrule] = createSignal('')
  const [tags, setTags] = createSignal('')
  const [reminders, setReminders] = createSignal('')

  // Sync local state whenever the modal opens or the initial prop changes
  createEffect(() => {
    if (!props.open) return
    const init = props.initial ?? {}
    setTitle(init.title ?? '')
    setStart(toLocalInput(init.start))
    // default end = start + 1h when not provided
    const endISO = init.end ?? (init.start ? new Date(new Date(init.start).getTime() + 60 * 60 * 1000).toISOString() : undefined)
    setEnd(toLocalInput(endISO))
    setCategory((init.category as any) ?? 'Personal')
    setColor(init.color ?? '#2563eb')
    setRrule(init.rrule ?? '')
    setTags((init.tags ?? []).join(', '))
    setReminders((init.reminderMinutes ?? []).join(', '))
  })

  const submit = (e: Event) => {
    e.preventDefault()
    props.onSubmit({
      ...(props.initial?.id ? { id: props.initial.id } : {}),
  title: title(),
  // datetime-local values are local time; convert to ISO (UTC) for storage
  start: new Date(start()).toISOString(),
  end: new Date(end()).toISOString(),
      category: category() as any,
      color: color(),
      rrule: rrule().trim() || undefined,
      tags: tags().split(',').map((t) => t.trim()).filter(Boolean),
      reminderMinutes: reminders()
        .split(',')
        .map((n) => parseInt(n.trim(), 10))
        .filter((n) => Number.isFinite(n) && n >= 0),
    })
    props.onClose()
  }

  // a11y: focus trap + Esc to close
  let dialogEl: HTMLElement | null = null
  let openerEl: Element | null = null

  function focusables(root: HTMLElement): HTMLElement[] {
    const sel = [
      'a[href]','area[href]','button:not([disabled])','input:not([disabled])','select:not([disabled])',
      'textarea:not([disabled])','iframe','object','embed','[tabindex]:not([tabindex="-1"])','[contenteditable="true"]'
    ].join(',')
    return Array.from(root.querySelectorAll<HTMLElement>(sel)).filter((el) => el.offsetParent !== null)
  }

  createEffect(() => {
    if (!props.open) return
    openerEl = document.activeElement
    queueMicrotask(() => {
      const els = dialogEl ? focusables(dialogEl) : []
      els[0]?.focus()
    })
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        props.onClose()
      }
      if (e.key === 'Tab' && dialogEl) {
        const els = focusables(dialogEl)
        if (els.length === 0) return
        const first = els[0]
        const last = els[els.length - 1]
        const active = document.activeElement
        if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        } else if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)
    onCleanup(() => window.removeEventListener('keydown', onKey))
  })

  createEffect(() => {
    if (props.open) return
    const el = openerEl as HTMLElement | null
    if (el?.focus) setTimeout(() => el.focus(), 0)
  })

  return (
    <Show when={props.open}>
      <div class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" role="dialog" aria-modal="true" onClick={() => props.onClose()}>
        <form
          ref={(el) => (dialogEl = el)}
          class="bg-white w-full max-w-lg rounded-xl shadow-xl outline-none overflow-hidden"
          onSubmit={submit}
          tabindex={-1}
          aria-label="Event form"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-gray-50/60">
            <div class="text-base sm:text-lg font-semibold text-gray-900">
              {props.initial?.id ? 'Edit event' : 'Add event'}
            </div>
            <button type="button" class="p-1 rounded hover:bg-gray-200 text-gray-600" aria-label="Close" onClick={props.onClose}>
              ×
            </button>
          </div>

          {/* Body */}
          <div class="px-5 py-4 space-y-4">
            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1">Title</label>
              <input
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                value={title()}
                onInput={(e) => setTitle(e.currentTarget.value)}
                placeholder="Event title"
                required
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-medium text-gray-600 block mb-1">Start</label>
                <input
                  type="datetime-local"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  value={start()}
                  onInput={(e) => setStart(e.currentTarget.value)}
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600 block mb-1">End</label>
                <input
                  type="datetime-local"
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  value={end()}
                  min={start()}
                  onInput={(e) => setEnd(e.currentTarget.value)}
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label class="text-xs font-medium text-gray-600 block mb-1">Category</label>
                <select
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  value={category()}
                  onChange={(e) => setCategory(e.currentTarget.value as any)}
                >
                  <option>College</option>
                  <option>Personal</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600 block mb-1">Color</label>
                <div class="flex items-center gap-2">
                  <span class="inline-block h-5 w-5 rounded border" style={{ 'background-color': color() }} />
                  <input
                    type="color"
                    class="rounded-md border border-gray-300 h-9 w-12 p-1 bg-white"
                    value={color()}
                    onInput={(e) => setColor(e.currentTarget.value)}
                    aria-label="Pick color"
                  />
                </div>
              </div>
            </div>

            <div>
              <label class="text-xs font-medium text-gray-600 block mb-1">Repeat rule (RRULE)</label>
              <input
                class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                placeholder="e.g. FREQ=WEEKLY;BYDAY=MO,WE"
                value={rrule()}
                onInput={(e) => setRrule(e.currentTarget.value)}
              />
              <p class="mt-1 text-[11px] text-gray-500">Leave blank for one-time events.</p>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="text-xs font-medium text-gray-600 block mb-1">Tags</label>
                <input
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  placeholder="Comma-separated (e.g. work, urgent)"
                  value={tags()}
                  onInput={(e) => setTags(e.currentTarget.value)}
                />
              </div>
              <div>
                <label class="text-xs font-medium text-gray-600 block mb-1">Reminders (minutes)</label>
                <input
                  class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500"
                  placeholder="10, 30, 60"
                  value={reminders()}
                  onInput={(e) => setReminders(e.currentTarget.value)}
                />
                <p class="mt-1 text-[11px] text-gray-500">You’ll get notifications before the event.</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div class="flex items-center justify-between px-5 py-3 bg-gray-50 border-t border-gray-200">
            <div>
              {props.onDelete && (
                <button
                  type="button"
                  class="px-3 py-2 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => props.onDelete?.()}
                >
                  Delete
                </button>
              )}
            </div>
            <div class="flex gap-2">
              <button type="button" class="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100" onClick={props.onClose}>
                Cancel
              </button>
              <button class="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700" type="submit">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </Show>
  )
}
