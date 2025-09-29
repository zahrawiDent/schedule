import Modal from './ui/Modal'

export default function CheatSheetModal(props: { open: boolean; onClose: () => void }) {
  const K = (s: string) => (
    <kbd class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-mono border rounded bg-gray-50 text-gray-800 border-gray-300">
      {s}
    </kbd>
  )
  return (
    <Modal open={props.open} onClose={props.onClose} title="Keyboard Shortcuts" size="lg" primaryActionLabel="Close" onPrimary={props.onClose}>
      <div class="px-1 py-2 space-y-6">
        <section>
          <h3 class="text-sm font-semibold text-gray-800 mb-2">Global</h3>
          <ul class="text-sm space-y-1">
            <li>{K('?')} Open this Cheat Sheet</li>
            <li>{K('M')} Switch to Month view</li>
            <li>{K('W')} Switch to Week view</li>
            <li>{K('D')} Switch to Day view</li>
            <li>{K('Today')} Jump to today</li>
            <li>{K('←')} {K('→')} Navigate previous/next (by month/week/day)</li>
            <li>{K('N')} New event</li>
          </ul>
        </section>
        <section>
          <h3 class="text-sm font-semibold text-gray-800 mb-2">Event form</h3>
          <ul class="text-sm space-y-1">
            <li>{K('Esc')} Close</li>
            <li>{K('⌘/Ctrl')} + {K('Enter')} Save</li>
          </ul>
        </section>
        <section>
          <h3 class="text-sm font-semibold text-gray-800 mb-2">Grid interactions</h3>
          <ul class="text-sm space-y-1">
            <li>Hover line snaps to 15 min</li>
            <li>Drag events to move; resize bottom to extend</li>
            <li>While dragging near edges: auto-navigate across days/weeks</li>
            <li>Keyboard over event: {K('Ctrl')} + {K('↑')} / {K('↓')} roving focus</li>
            <li>Keyboard nudge on selected event: {K('↑')} / {K('↓')} move, {K('←')} / {K('→')} resize</li>
            <li>{K('Enter')} Open, {K('Delete/Backspace')} Remove</li>
          </ul>
        </section>
      </div>
    </Modal>
  )
}
