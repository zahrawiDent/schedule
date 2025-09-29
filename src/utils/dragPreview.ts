/**
 * dragPreview
 * -----------
 * Small ephemeral store that tracks in-progress drag/resize values per base event id.
 *
 * Purpose
 * - Keep UI responsive by updating visuals immediately while deferring real state updates
 * - Support vertical moves (startMins), resizes (endMins), and week-column moves (dayIndex)
 */
import { createSignal } from 'solid-js'

export type PreviewEntry = {
  // minutes from 00:00 within a day
  startMins?: number
  endMins?: number
  // for week view horizontal moves
  dayIndex?: number
}

export type PreviewMap = Record<string, PreviewEntry>

/**
 * Creates a small preview store and helpers used during drag/resize.
 * - Only affects visuals; caller commits to the real store on release.
 * - Clamps and snaps minutes and optionally tracks the target day index.
 */
export function createPreviewState(snap: (m: number) => number, SNAP_MIN: number) {
  const [preview, setPreview] = createSignal<PreviewMap>({})

  const setStart = (baseId: string, mins: number, dayIndex?: number) => {
    const m = snap(Math.max(0, Math.min(24 * 60 - SNAP_MIN, mins)))
    setPreview((p) => ({
      ...p,
      [baseId]: { ...(p[baseId] ?? {}), startMins: m, dayIndex: dayIndex ?? p[baseId]?.dayIndex },
    }))
  }

  const setEnd = (baseId: string, mins: number, dayIndex?: number) => {
    const m = snap(Math.max(SNAP_MIN, Math.min(24 * 60, mins)))
    setPreview((p) => ({
      ...p,
      [baseId]: { ...(p[baseId] ?? {}), endMins: m, dayIndex: dayIndex ?? p[baseId]?.dayIndex },
    }))
  }

  const clearStart = (baseId: string) => {
    setPreview((p) => {
      const n = { ...p }
      const cur = n[baseId]
      if (!cur) return n
      const { endMins, dayIndex } = cur
      if (endMins != null || dayIndex != null) n[baseId] = { endMins, dayIndex }
      else delete n[baseId]
      return n
    })
  }

  const clearEnd = (baseId: string) => {
    setPreview((p) => {
      const n = { ...p }
      const cur = n[baseId]
      if (!cur) return n
      const { startMins, dayIndex } = cur
      if (startMins != null || dayIndex != null) n[baseId] = { startMins, dayIndex }
      else delete n[baseId]
      return n
    })
  }

  const clearAll = (baseId: string) => {
    setPreview((p) => {
      const n = { ...p }
      delete n[baseId]
      return n
    })
  }

  return { preview, setStart, setEnd, clearStart, clearEnd, clearAll }
}
