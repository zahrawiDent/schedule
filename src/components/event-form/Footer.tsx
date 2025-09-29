import { type JSXElement, Show } from 'solid-js'

export function EventFormFooter(props: {
  onDelete?: () => void
  onCancel: () => void
}): JSXElement {
  return (
    <div class="flex items-center justify-between px-5 py-3 bg-white border-t border-gray-200 sticky bottom-0 z-10">
      <div>
        <Show when={props.onDelete}>
          <button
            type="button"
            class="px-3 py-2 text-sm rounded-md border border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => props.onDelete?.()}
          >
            Delete
          </button>
        </Show>
      </div>
      <div class="flex gap-2">
        <button type="button" class="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100" onClick={props.onCancel}>
          Cancel
        </button>
        <button class="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700" type="submit">
          Save
        </button>
      </div>
    </div>
  )
}
