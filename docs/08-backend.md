# Backend (optional)

Folder: `backend/`
- PocketBase is embedded to serve the built frontend (`dist/`).
- `main.go` wires PocketBase with an embedded filesystem to host the SPA.

Usage
- Build the frontend (pnpm build) and then run the Go server to serve `dist/`.

Future work
- Add event sync endpoints and a lightweight auth model.
- Consider WebSocket push for multi-tab updates.
