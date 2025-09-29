import type { Accessor } from 'solid-js'
import { type JSXElement } from 'solid-js'

type SwitchProps = {
  id?: string
  checked: Accessor<boolean>
  onChange: (next: boolean) => void
  disabled?: boolean
  label?: string
  class?: string
}

export function Switch(props: SwitchProps): JSXElement {
  const toggle = () => {
    if (props.disabled) return
    props.onChange(!props.checked())
  }

  const onKeyDown = (e: KeyboardEvent) => {
    if (props.disabled) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      toggle()
    }
  }

  return (
    <div class={props.class}>
      <button
        id={props.id}
        type="button"
        role="switch"
        aria-checked={props.checked()}
        aria-disabled={props.disabled}
        class={`inline-flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-full select-none`}
        onClick={toggle}
        onKeyDown={onKeyDown as any}
        disabled={props.disabled}
      >
        <span
          class="relative w-11 h-6 rounded-full transition-colors duration-200 ease-out"
          classList={{ 'bg-blue-600': props.checked(), 'bg-gray-300': !props.checked(), 'opacity-50': !!props.disabled }}
        >
          <span
            class="absolute top-1 left-1 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ease-out"
            classList={{ 'translate-x-5': props.checked() }}
          />
        </span>
        {props.label && <span class="ml-2 text-sm text-gray-700">{props.label}</span>}
      </button>
    </div>
  )
}
