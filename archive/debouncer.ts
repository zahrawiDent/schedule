// Debounce utility to limit expensive state updates during drag/resize
type DebouncedFn<T extends any[]> = ((...args: T) => void) & { flush: () => void; cancel: () => void }
function makeDebounced<T extends any[]>(fn: (...args: T) => void, wait = 80): DebouncedFn<T> {
  let timer: number | null = null
  let lastArgs: T | null = null
  const fire = () => {
    timer = null
    if (lastArgs) fn(...lastArgs)
    lastArgs = null
  }
  const d = ((...args: T) => {
    lastArgs = args
    if (timer) window.clearTimeout(timer)
    timer = window.setTimeout(fire, wait)
  }) as DebouncedFn<T>
  d.flush = () => {
    if (timer) {
      window.clearTimeout(timer)
      fire()
    } else if (lastArgs) {
      fn(...lastArgs)
      lastArgs = null
    }
  }
  d.cancel = () => {
    if (timer) window.clearTimeout(timer)
    timer = null
    lastArgs = null
  }
  return d
}

// Instant visual preview for the block being interacted with (no state writes)
// Keyed by baseId (series source); store either a startMins override (drag) or endMins override (resize)
const [preview, setPreview] = createSignal<Record<string, { startMins?: number; endMins?: number }>>({})
const setPreviewStart = (baseId: string, mins: number) => setPreview((p) => ({ ...p, [baseId]: { ...(p[baseId] ?? {}), startMins: snap(Math.max(0, Math.min(24 * 60 - SNAP_MIN, mins))) } }))
const setPreviewEnd = (baseId: string, mins: number) => setPreview((p) => ({ ...p, [baseId]: { ...(p[baseId] ?? {}), endMins: snap(Math.max(SNAP_MIN, Math.min(24 * 60, mins))) } }))
const clearPreviewStart = (baseId: string) => setPreview((p) => { const n = { ...p }; if (n[baseId]) { const { endMins } = n[baseId]; if (endMins != null) n[baseId] = { endMins }; else delete n[baseId] } return n })
const clearPreviewEnd = (baseId: string) => setPreview((p) => { const n = { ...p }; if (n[baseId]) { const { startMins } = n[baseId]; if (startMins != null) n[baseId] = { startMins }; else delete n[baseId] } return n })

// Keep per-event debouncers so we don't recreate on every render
const debouncers = new Map<string, { move: DebouncedFn<[number]>; resize: DebouncedFn<[number]> }>()
const getDebouncers = (baseId: string) => {
  let d = debouncers.get(baseId)
  if (!d) {
    d = { move: makeDebounced((mins: number) => moveEvent(baseId, mins)), resize: makeDebounced((mins: number) => resizeEvent(baseId, mins)) }
    debouncers.set(baseId, d)
  }
  return d
}
