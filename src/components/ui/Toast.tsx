import { createSignal, For, onCleanup, onMount } from 'solid-js'

// Toast types and singleton store
export type ToastItem = {
  id: string
  message: string
  type?: 'info' | 'success' | 'error'
  duration?: number // ms; if omitted, default 4000
  actionLabel?: string
  onAction?: () => void
}

const [toasts, setToasts] = createSignal<ToastItem[]>([])

export function pushToast(t: Omit<ToastItem, 'id'>) {
  const id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)
  const item: ToastItem = { id, type: 'info', duration: 4000, ...t }
  setToasts((prev) => [...prev, item])
  return id
}

export function dismissToast(id: string) {
  setToasts((prev) => prev.filter((t) => t.id !== id))
}

export function ToastContainer() {
  // per-toast timers
  const timers = new Map<string, number>()

  const startTimer = (t: ToastItem) => {
    if (t.duration && t.duration > 0 && !t.onAction) {
      const tm = window.setTimeout(() => dismissToast(t.id), t.duration)
      timers.set(t.id, tm)
    }
  }
  const clearTimer = (id: string) => {
    const tm = timers.get(id)
    if (tm) { window.clearTimeout(tm); timers.delete(id) }
  }

  onCleanup(() => {
    timers.forEach((tm) => window.clearTimeout(tm))
    timers.clear()
  })

  onMount(() => {
    // Start timers for any existing toasts on mount
    toasts().forEach(startTimer)
  })

  return (
    <div class="fixed z-[60] bottom-4 right-4 space-y-2 pointer-events-none" aria-live="polite" aria-atomic="true">
      <For each={toasts()}>
        {(t) => (
          <div
            class={`pointer-events-auto min-w-[240px] max-w-[360px] rounded-md shadow-lg border px-3 py-2 bg-white ${
              t.type === 'success' ? 'border-green-300' : t.type === 'error' ? 'border-red-300' : 'border-gray-200'
            }`}
            onMouseEnter={() => clearTimer(t.id)}
            onMouseLeave={() => startTimer(t)}
          >
            <div class="flex items-start gap-3">
              <div class="flex-1 text-sm text-gray-900">{t.message}</div>
              <button
                class="shrink-0 p-1 rounded hover:bg-gray-100 text-gray-600"
                aria-label="Dismiss"
                onClick={() => dismissToast(t.id)}
              >
                <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>
            {t.onAction && (
              <div class="mt-2">
                <button
                  class="text-xs font-medium text-blue-700 hover:text-blue-800 hover:underline"
                  onClick={() => { try { t.onAction?.() } finally { dismissToast(t.id) } }}
                >
                  {t.actionLabel ?? 'Action'}
                </button>
              </div>
            )}
          </div>
        )}
      </For>
    </div>
  )
}
