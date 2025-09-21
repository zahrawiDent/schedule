## Usage

```bash
$ npm install # or pnpm install or yarn install
```

### Learn more on the [Solid Website](https://solidjs.com) and come chat with us on our [Discord](https://discord.com/invite/solidjs)

## Available Scripts

In the project directory, you can run:

### `npm run dev`

Runs the app in the development mode.<br>
Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

### `npm run build`

Builds the app for production to the `dist` folder.<br>
It correctly bundles Solid in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.<br>
Your app is ready to be deployed!

## Deployment

Learn more about deploying your application with the [documentations](https://vite.dev/guide/static-deploy.html)



# Schedule – SolidJS Calendar

Personal calendar with Month/Week/Day views, local storage, search/filter, and keyboard shortcuts.

Features (MVP)
- Month / Week / Day views with smooth navigation
- Add events via modal; edit/delete next
- Recurring events via RRULE expansion (read-only for now)
- Categories and color coding; search/filter sidebar
- Keyboard shortcuts: N (new), M/W/D (switch view), ←/→ (navigate)

Run
```sh
pnpm install
pnpm dev
```

Tech
- SolidJS + Vite, Tailwind v4
- date-fns for date math, rrule for recurrence
- IndexedDB via idb-keyval for local storage

Next
- Drag & drop + resize with solid-dnd
- Edit/delete UI, reminders, accessibility pass
- Mobile fine-tuning, animations, tests




