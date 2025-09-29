# Overview

Schedule is a fast, accessible calendar app built with SolidJS + Vite. It provides Month/Week/Day views, drag & drop editing, RRULE-based recurrence, and local persistence.

Goals
- Snappy interactions on modest hardware
- Keyboard-first, pointer-friendly UX
- Clean separation of visuals (TimeGrid) and logic (occurrence, lanes, eventUpdates)
- Offline-first via localStorage; optional server for deploy

Technologies
- SolidJS, Tailwind v4, Vite
- date-fns, rrule
- TinyBase (local store) with persister
- Optional: PocketBase (Go) server embedding the built frontend
