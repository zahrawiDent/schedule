import type { JSXElement } from "solid-js";

export function EventFormHeader(props: { isEdit: boolean; onClose: () => void }): JSXElement {
  return (
    <div class="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white sticky top-0 z-10">
      <div class="text-base sm:text-lg font-semibold text-gray-900">
        {props.isEdit ? 'Edit event' : 'Add event'}
      </div>
      <button type="button" class="p-1 rounded hover:bg-gray-200 text-gray-600" aria-label="Close" onClick={props.onClose}>
        ×
      </button>
    </div>
  )
}
