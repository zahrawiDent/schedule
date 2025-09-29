import Modal from './ui/Modal'

export default function RecurrenceChoiceModal(props: {
  open: boolean
  onCancel: () => void
  onEditOccurrence: () => void
  onEditSeries: () => void
  title?: string
  whenLabel?: string
}) {
  return (
    <Modal open={props.open} onClose={props.onCancel} title="Edit recurring event" size="md"
      shortcuts={[
        { key: 'Enter', handler: props.onEditOccurrence },
        { key: '1', handler: props.onEditOccurrence },
        { key: '2', handler: props.onEditSeries },
      ]}
      footer={(
        <div class="flex items-center justify-between w-full">
          <button type="button" class="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100" onClick={props.onCancel}>Cancel</button>
          <div class="flex gap-2">
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
              aria-keyshortcuts="2"
              title="Shortcut: 2"
              onClick={props.onEditSeries}
            >
              <span class="text-gray-500 mr-1">[2]</span> Edit entire series
            </button>
            <button
              type="button"
              class="px-3 py-1.5 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700"
              aria-keyshortcuts="Enter 1"
              title="Shortcuts: Enter or 1"
              onClick={props.onEditOccurrence}
            >
              <span class="text-white/80 mr-1">[1]</span> Edit only this occurrence
            </button>
          </div>
        </div>
      )}
    >
      <div class="space-y-2">
        {props.title && (
          <p class="text-sm text-gray-900">{props.title}</p>
        )}
        {props.whenLabel && (
          <p class="text-xs text-gray-500">{props.whenLabel}</p>
        )}
        <p class="text-sm text-gray-700">This event is part of a repeating series. Choose whether to edit only this occurrence or the entire series.</p>
        <p class="text-xs text-gray-500">Shortcuts: Press <kbd class="px-1 py-0.5 border rounded">1</kbd> for this occurrence, <kbd class="px-1 py-0.5 border rounded">2</kbd> for entire series, or <kbd class="px-1 py-0.5 border rounded">Enter</kbd> for this occurrence.</p>
        <ul class="list-disc pl-5 text-sm text-gray-600 space-y-1">
          <li><b>This occurrence</b> updates only the selected instance and keeps the rest of the series unchanged.</li>
          <li><b>Entire series</b> updates the base event and applies to all future instances.</li>
        </ul>
      </div>
    </Modal>
  )
}
