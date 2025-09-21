import type { EventItem } from '../types'

function whenFor(e: EventItem): number[] {
  const mins = e.reminderMinutes ?? []
  const start = new Date(e.start).getTime()
  return mins
    .map((m) => start - m * 60_000)
    .filter((t) => t > Date.now() && t - Date.now() < 1000 * 60 * 60 * 24) // within 24h
    .sort((a, b) => a - b)
}

export function scheduleReminders(events: EventItem[]) {
  const timers: number[] = []
  if (typeof window === 'undefined' || !('Notification' in window)) return () => {}
  if (Notification.permission !== 'granted') return () => {}

  for (const e of events) {
    for (const t of whenFor(e)) {
      const id = window.setTimeout(() => {
        try {
          new Notification(e.title, {
            body: e.notes ?? '',
            tag: e.id,
          })
        } catch {}
      }, Math.max(0, t - Date.now()))
      timers.push(id)
    }
  }

  return () => timers.forEach((id) => clearTimeout(id))
}
