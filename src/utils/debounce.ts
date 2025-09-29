/**
 * debounce
 * --------
 * Lightweight debounce with flush support.
 * Usage:
 *  const d = makeDebounced((x) => doThing(x), 80)
 *  d(arg) // schedule
 *  d.flush() // commit latest immediately (e.g., on pointerup)
 */

export type DebouncedFn<T extends any[]> = ((...args: T) => void) & { flush: () => void }

export function makeDebounced<T extends any[]>(fn: (...args: T) => void, wait = 80): DebouncedFn<T> {
  let t: number | undefined
  let a: T | undefined
  const fire = () => { t = undefined; if (a) { fn(...a); a = undefined } }
  const d = ((...args: T) => { a = args; if (t) clearTimeout(t); t = window.setTimeout(fire, wait) }) as DebouncedFn<T>
  d.flush = () => { if (t) { clearTimeout(t); fire() } else if (a) { fn(...a); a = undefined } }
  return d
}
