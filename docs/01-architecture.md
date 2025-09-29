# Architecture

```mermaid
graph LR
  UI[Solid Components] --> EC[EventsContext]
  EC <--> DB["TinyBase Store<br/>(localStorage persister)"]
  UI --> UT["Utils<br/>(timeGrid, lanes, occurrence, eventUpdates, dragPreview, pointer, autoScroll)"]

  subgraph "Optional Backend"
    PB[PocketBase]
    DIST[Embedded dist/]
  end

  EC -.->|future sync| PB
  PB --> DIST
```

Folders
- `src/components` – presentational + interactive UI
- `src/context` – global app state (events, view, filters)
- `src/utils` – pure helpers and interaction primitives
- `src/data` – storage implementation (TinyBase)
- `backend` – PocketBase server for serving `dist/`
