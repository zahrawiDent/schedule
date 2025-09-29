//
// import { createSignal, Show, createEffect, For } from 'solid-js'
// import { EventsProvider, useEvents } from './context/EventsContext'
// import CalendarNav from './components/CalendarNav'
// import MonthView from './components/MonthView'
// import WeekView from './components/WeekView'
// import DayView from './components/DayView'
// import EventForm from './components/EventForm'
// // import Sidebar from './components/Sidebar'
// import { onCleanup, onMount } from 'solid-js'
// import { scheduleReminders } from './utils/reminders'
//
// import { queryCollectionOptions } from "@tanstack/query-db-collection"
// import { QueryClient } from '@tanstack/query-core'
// import { z } from 'zod';
// // import { } from '@tanstack/db'
// import { useLiveQuery, createCollection } from '@tanstack/solid-db'
//
//
// import PocketBase from 'pocketbase';
//
// const pb = new PocketBase('http://127.0.0.1:8090');
//
// await pb.collection("_superusers").authWithPassword("admin@example.com", "changeme123");
//
//
//
// export const ViewModeSchema = z.enum(["month", "week", "day"]);
// export type ViewMode = z.infer<typeof ViewModeSchema>;
//
// export const CategorySchema = z.enum(["College", "Personal", "Other"]);
// export type Category = z.infer<typeof CategorySchema>;
//
// export const EventIdSchema = z.string();
// export type EventId = z.infer<typeof EventIdSchema>;
//
// export const WeekStartDaySchema = z.union([
//   z.literal(0),
//   z.literal(1),
//   z.literal(2),
//   z.literal(3),
//   z.literal(4),
//   z.literal(5),
//   z.literal(6),
// ]);
// export type WeekStartDay = z.infer<typeof WeekStartDaySchema>;
//
// // --- EventBase ---
// export const EventBaseSchema = z.object({
//   id: EventIdSchema,
//   title: z.string(),
//   start: z.iso.datetime(), // ISO string
//   end: z.iso.datetime(),
//   allDay: z.boolean().optional(),
//   category: CategorySchema.optional(),
//   color: z.string().optional(),      // hex or tailwind token
//   tags: z.array(z.string()).optional(),
//   location: z.string().optional(),
//   notes: z.string().optional(),
//   reminderMinutes: z.array(z.number().int().nonnegative()).optional(),
//   rrule: z.string().optional(),      // iCal RRULE
//   exdates: z.array(z.iso.datetime()).optional(),
//   parentId: EventIdSchema.optional(), // detached occurrence parent
// });
//
// export type EventBase = z.infer<typeof EventBaseSchema>;
// export const EventItemSchema = EventBaseSchema;
// export type EventItem = z.infer<typeof EventItemSchema>;
//
// // --- EventOccurrence ---
// export const EventOccurrenceSchema = EventBaseSchema.extend({
//   sourceId: EventIdSchema.optional(),
// });
// export type EventOccurrence = z.infer<typeof EventOccurrenceSchema>;
//
// // --- Filters ---
// export const FiltersSchema = z.object({
//   query: z.string().optional(),
//   categories: z.array(CategorySchema).optional(),
//   dateRange: z
//     .object({
//       start: z.iso.datetime(),
//       end: z.iso.datetime(),
//     })
//     .optional(),
// });
// export type Filters = z.infer<typeof FiltersSchema>;
//
// const queryClient = new QueryClient()
//
//
// const eventsCollection = createCollection(
//   queryCollectionOptions({
//     queryKey: ['events'],
//     queryClient,
//     getKey: (e: any) => e.id,
//     queryFn: async () => {
//       // return await pb.collection('events').getFullList()
//       const records = await pb.collection('events').getFullList()
//       return records.map(r => ({
//         id: r.id,
//         title: r.title,
//         start: r.start,
//         end: r.end,
//         allDay: r.allDay,
//         category: r.category,
//         color: r.color,
//         tags: r.tags,
//         location: r.location,
//         notes: r.notes,
//         reminderMinutes: r.reminderMinutes,
//         rrule: r.rrule,
//         exdates: r.exdates,
//         parentId: r.parentId,
//       })) as EventItem[]
//       // return eventsData
//     },
//     onInsert: async ({ transaction }: { transaction: { mutations: { modified: EventItem }[] } }) => {
//       const newItems = transaction.mutations.map(m => m.modified)
//       console.log(newItems[0].id)
//       await pb.collection('events').create(newItems[0])
//       // Returning nothing or { refetch: true } will trigger a refetch
//       // Return { refetch: false } to skip automatic refetch
//     },
//     onDelete: async ({ transaction }: { transaction: { mutations: { modified: EventItem }[] } }) => {
//       const deletedItems = transaction.mutations.map(m => m.modified)
//       console.log(deletedItems[0].id)
//       await pb.collection('events').delete(deletedItems[0].id)
//       // Returning nothing or { refetch: true } will trigger a refetch
//       // Return { refetch: false } to skip automatic refetch
//     },
//     onUpdate: async ({ transaction }: { transaction: { mutations: { modified: EventItem }[] } }) => {
//       const updatedItems = transaction.mutations.map(m => m.modified)
//       console.log(updatedItems[0].id)
//       await pb.collection('events').update(updatedItems[0].id, updatedItems[0])
//       // Returning nothing or { refetch: true } will trigger a refetch
//       // Return { refetch: false } to skip automatic refetch
//     }
//   })
// )
//
//
//
// function CalendarApp() {
//   const { data: events } = useLiveQuery((q) => {
//     return q.from({ todo: eventsCollection })
//   })
//
//   console.log(events)
//   // eventsCollection.insert(
//   //   {
//   //   id: crypto.randomUUID().replace(/-/g, '').substring(0, 15),
//   //   title: 'Event 1',
//   //   start: new Date().toISOString(),
//   //   end: new Date().toISOString(),
//   //   allDay: true,
//   //   category: 'Personal',
//   //   color: '#ff0000',
//   //   tags: ['tag1', 'tag2'],
//   //   location: 'Location 1',
//   //   notes: 'Notes 1',
//   //   reminderMinutes: [15, 30],
//   //   rrule: 'FREQ=DAILY',
//   //   exdates: [],
//   // }
//   //                        )
//   // console.log(events)
//
//
//
//   const [open, setOpen] = createSignal(false)
//   const [editing, setEditing] = createSignal<any>(null)
//   const [state, actions] = useEvents()
//   const [remindersOn] = createSignal(false)
//
//   function submit(data: any) {
//     if (data.id) actions.update(data.id, data)
//     else actions.add({ ...data })
//   }
//
//   function onEventClick(id: string, patch?: Partial<{ start: string; end: string }>) {
//     // If id looks like an expanded occurrence (id::iso), map back to series id
//     const baseId = id.includes('::') ? id.split('::')[0] : id
//     const ev = state.events.find((e) => e.id === baseId)
//     if (!ev) return
//     const isOccurrence = id.includes('::') || !!ev.rrule
//     if (isOccurrence && ev.rrule) {
//       const choice = window.confirm('Edit only this occurrence? Click OK for this occurrence, Cancel for the entire series.')
//       if (choice) {
//         // Detach this occurrence as a standalone event instance; add exdate to parent
//         const occStartISO = patch?.start ?? ev.start
//         const occEndISO = patch?.end ?? ev.end
//         const detached = { ...ev, id: `${ev.id}-${occStartISO}`, parentId: ev.id, rrule: undefined, exdates: undefined, start: occStartISO, end: occEndISO }
//         actions.update(ev.id, { exdates: [...(ev.exdates ?? []), occStartISO] })
//         actions.add(detached as any)
//         setEditing(detached)
//         setOpen(true)
//         return
//       }
//       // else fall through to edit series
//     }
//     const initial = { ...ev, ...(patch ?? {}) }
//     setEditing(initial)
//     setOpen(true)
//   }
//
//   onMount(() => {
//     const handler = (e: KeyboardEvent) => {
//       if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') return
//       if (e.key.toLowerCase() === 'n') {
//         setOpen(true)
//       }
//       if (['m', 'w', 'd'].includes(e.key.toLowerCase())) {
//         const map: any = { m: 'month', w: 'week', d: 'day' }
//         actions.setViewMode(map[e.key.toLowerCase()])
//       }
//       if (['ArrowLeft', 'ArrowRight'].includes(e.key)) {
//         const delta = e.key === 'ArrowLeft' ? -1 : 1
//         const now = new Date(state.viewDate)
//         const next = state.viewMode === 'month' ? new Date(now.setMonth(now.getMonth() + delta)) : state.viewMode === 'week' ? new Date(now.setDate(now.getDate() + delta * 7)) : new Date(now.setDate(now.getDate() + delta))
//         actions.setViewDate(next.toISOString())
//       }
//     }
//     window.addEventListener('keydown', handler)
//     onCleanup(() => window.removeEventListener('keydown', handler))
//   })
//
//   // schedule reminders when toggled on
//   let cleanup: undefined | (() => void)
//   createEffect(() => {
//     if (remindersOn()) {
//       cleanup?.()
//       cleanup = scheduleReminders(state.events)
//     } else {
//       cleanup?.()
//       cleanup = undefined
//     }
//   })
//
//   return (
//     <div class="min-h-screen flex flex-col">
//       {/* CalendarNav */}
//       <CalendarNav />
//
//       <button
//         onClick={async () => {
//           const randEventName = () => `Event ${crypto.randomUUID().replace(/-/g, '').substring(0, 15)}`
//           eventsCollection.insert(
//             {
//               id: crypto.randomUUID().replace(/-/g, '').substring(0, 15),
//               title: randEventName(),
//               start: new Date().toISOString(),
//               end: new Date().toISOString(),
//               allDay: true,
//               category: 'Personal',
//               color: '#ff0000',
//               tags: ['tag1', 'tag2'],
//               location: 'Location 1',
//               notes: 'Notes 1',
//               reminderMinutes: [15, 30],
//               rrule: 'FREQ=DAILY',
//               exdates: [],
//             }
//
//           )
//         }}
//       >
//         Add
//       </button>
//       <For each={events}>
//         {(todo) => (
//
//           <>
//             <div>{todo.title}</div>
//             <button onClick={() => eventsCollection.delete(todo.id)}>Delete</button>
//             <button onClick={() => eventsCollection.update(todo.id, (draft) => {
//               draft.title = 'new title'
//             })}>Update</button>
//           </>
//         )}
//       </For>
//
//
//       {/* Event controls (add, reminders) */}
//
//       {/* <div class="p-2 flex gap-2 items-center border-b"> */}
//       {/*   <button class="px-3 py-1 rounded bg-blue-600 text-white" onClick={() => setOpen(true)} aria-keyshortcuts="N">Add event</button> */}
//       {/*   <button class="px-3 py-1 rounded border" onClick={async () => { */}
//       {/*     if (!('Notification' in window)) return */}
//       {/*     if (Notification.permission !== 'granted') await Notification.requestPermission() */}
//       {/*     setRemindersOn((v) => !v) */}
//       {/*   }}> */}
//       {/*     {remindersOn() ? 'Reminders: On' : 'Reminders: Off'} */}
//       {/*   </button> */}
//       {/* </div> */}
//
//       <div class="flex-1 overflow-hidden flex">
//         {/* Sidebar */}
//         {/* <div class="hidden sm:block shrink-0"> */}
//         {/*   <Sidebar /> */}
//         {/* </div> */}
//
//         <div class="flex-1 overflow-auto">
//           <Show when={state.viewMode === 'month'}>
//             <MonthView
//               onEventClick={(id, patch) => onEventClick(id, patch)}
//               onDayClick={(startISO, endISO) => {
//                 // Prefill a 1-hour event at 9:00 if today; otherwise full-day
//                 const start = new Date(startISO)
//                 const end = new Date(endISO)
//                 if (state.viewMode === 'month') {
//                   // Choose noon default 1h for better UX
//                   start.setHours(12, 0, 0, 0)
//                   end.setTime(start.getTime() + 60 * 60000)
//                 }
//                 setEditing({ start: start.toISOString(), end: end.toISOString() })
//                 setOpen(true)
//               }}
//             />
//           </Show>
//           <Show when={state.viewMode === 'week'}>
//             <WeekView
//               onEventClick={onEventClick}
//               onSlotClick={(startISO, endISO) => {
//                 setEditing({ start: startISO, end: endISO })
//                 setOpen(true)
//               }}
//             />
//           </Show>
//           <Show when={state.viewMode === 'day'}>
//             <DayView
//               onEventClick={onEventClick}
//               onSlotClick={(startISO, endISO) => {
//                 setEditing({ start: startISO, end: endISO })
//                 setOpen(true)
//               }}
//             />
//           </Show>
//         </div>
//       </div>
//       <EventForm
//         open={open()}
//         onClose={() => {
//           setOpen(false)
//           setEditing(null)
//         }}
//         initial={editing() ?? undefined}
//         onSubmit={submit}
//         onDelete={editing()?.id ? () => (actions.remove(editing()!.id), setOpen(false), setEditing(null)) : undefined}
//       />
//     </div >
//   )
// }
//
// export default function App() {
//   return (
//     <EventsProvider>
//       <CalendarApp />
//     </EventsProvider>
//   )
// }
//
