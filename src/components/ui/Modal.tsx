import { type JSXElement, Show, createEffect, onCleanup, onMount } from 'solid-js'
import { Portal } from 'solid-js/web'

type Shortcut = {
  key: string
  ctrl?: boolean
  meta?: boolean
  alt?: boolean
  shift?: boolean
  handler: () => void
}

let __modalId = 0
function nextId() {
  __modalId += 1
  return `modal-${__modalId}`
}

function matchShortcut(e: KeyboardEvent, s: Shortcut) {
  if (s.ctrl && !e.ctrlKey) return false
  if (s.meta && !e.metaKey) return false
  if (s.alt && !e.altKey) return false
  if (s.shift && !e.shiftKey) return false
  return e.key.toLowerCase() === s.key.toLowerCase()
}

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export type ModalProps = {
  open: boolean
  onClose: () => void

  title?: JSXElement | string
  description?: JSXElement | string
  ariaLabel?: string

  size?: 'sm' | 'md' | 'lg' | 'xl'
  closeOnBackdrop?: boolean
  closeOnEscape?: boolean
  initialFocusSelector?: string

  onSubmit?: () => void // Cmd/Ctrl+Enter will call this if provided
  shortcuts?: Shortcut[]

  footer?: JSXElement
  // Built-in primary action button for simple dialogs. If footer is provided, it takes precedence.
  primaryActionLabel?: string
  onPrimary?: () => void
  primaryDisabled?: boolean
  primaryType?: 'button' | 'submit'
  // When using built-in footer, show a Cancel button on the left (defaults to true)
  showCancel?: boolean
  cancelLabel?: string

  children: JSXElement
}

export default function Modal(props: ModalProps) {
  let dialogEl: HTMLDivElement | undefined
  let closeBtnEl: HTMLButtonElement | undefined
  const id = nextId()
  const titleId = props.title ? `${id}-title` : undefined
  const descId = props.description ? `${id}-desc` : undefined

  let prevActive: Element | null = null
  let prevBodyOverflow: string | null = null

  const sizeClass =
    props.size === 'xl'
      ? 'max-w-2xl'
      : props.size === 'lg'
      ? 'max-w-lg'
      : props.size === 'sm'
      ? 'max-w-sm'
      : 'max-w-md'

  function focusFirst() {
    if (!dialogEl) return
    if (props.initialFocusSelector) {
      const el = dialogEl.querySelector<HTMLElement>(props.initialFocusSelector)
      if (el) { el.focus(); return }
    }
    const focusables = Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('data-modal-ignore')
    )
    if (focusables.length > 0) { focusables[0]!.focus(); return }
    if (closeBtnEl) closeBtnEl.focus()
    else dialogEl.focus()
  }

  function getFocusables() {
    if (!dialogEl) return [] as HTMLElement[]
    return Array.from(dialogEl.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
      (el) => !el.hasAttribute('data-modal-ignore')
    )
  }

  function handleTabTrap(e: KeyboardEvent) {
    if (e.key !== 'Tab') return
    const items = getFocusables()
    if (items.length === 0) { e.preventDefault(); return }
    const first = items[0]!
    const last = items[items.length - 1]!
    const active = document.activeElement as HTMLElement | null
    if (e.shiftKey) {
      if (active === first || !dialogEl?.contains(active)) { e.preventDefault(); last.focus() }
    } else {
      if (active === last) { e.preventDefault(); first.focus() }
    }
  }

  function keydownHandler(e: KeyboardEvent) {
    if (props.closeOnEscape !== false && e.key === 'Escape') { e.preventDefault(); props.onClose(); return }
    if (props.onSubmit && e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); props.onSubmit(); return }
    for (const s of props.shortcuts ?? []) { if (matchShortcut(e, s)) { e.preventDefault(); s.handler(); return } }
  }

  createEffect(() => {
    if (props.open) {
      prevActive = document.activeElement
      prevBodyOverflow = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      queueMicrotask(() => focusFirst())
      document.addEventListener('keydown', keydownHandler)
      dialogEl?.addEventListener('keydown', handleTabTrap as any)
    } else {
      document.body.style.overflow = prevBodyOverflow ?? ''
      if (prevActive instanceof HTMLElement) prevActive.focus({ preventScroll: true })
      document.removeEventListener('keydown', keydownHandler)
      dialogEl?.removeEventListener('keydown', handleTabTrap as any)
    }
  })

  onCleanup(() => {
    document.removeEventListener('keydown', keydownHandler)
    dialogEl?.removeEventListener('keydown', handleTabTrap as any)
    document.body.style.overflow = prevBodyOverflow ?? ''
  })

  onMount(() => {
    if (dialogEl && !dialogEl.hasAttribute('tabindex')) dialogEl.setAttribute('tabindex', '-1')
  })

  return (
    <Show when={props.open}>
      <Portal>
        <div class="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            class="absolute inset-0 bg-black/40"
            onClick={() => { if (props.closeOnBackdrop !== false) props.onClose() }}
            aria-hidden="true"
          />
          {/* Dialog */}
          <div
            ref={dialogEl!}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={descId}
            aria-label={titleId ? undefined : props.ariaLabel}
            class={`relative bg-white rounded-lg shadow-xl border border-gray-200 w-[92vw] ${sizeClass} p-4 outline-none`}
            onClick={(e) => e.stopPropagation()}
          >
            <div class="flex items-center justify-between mb-3">
              <div class="min-w-0">
                {props.title ? (
                  <h2 id={titleId} class="text-lg font-semibold">{props.title}</h2>
                ) : null}
                {props.description ? (
                  <p id={descId} class="text-sm text-gray-600 mt-0.5">{props.description}</p>
                ) : null}
              </div>
              <button ref={closeBtnEl!} class="p-2 rounded hover:bg-gray-100" onClick={props.onClose} aria-label="Close">
                <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
              </button>
            </div>

            <div class="max-h-[80vh] overflow-auto">
              {props.children}
            </div>

            <div class="mt-4 flex items-center justify-end gap-2">
              {props.footer ?? (
                props.primaryActionLabel ? (
                  <>
                    {props.showCancel !== false && (
                      <button
                        type="button"
                        class="px-3 py-2 text-sm rounded-md border border-gray-300 hover:bg-gray-100"
                        onClick={props.onClose}
                      >
                        {props.cancelLabel ?? 'Cancel'}
                      </button>
                    )}
                    <button
                      type={props.primaryType ?? 'button'}
                      class={`px-3 py-2 text-sm rounded-md ${props.primaryDisabled ? 'bg-blue-400 text-white opacity-70 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                      disabled={props.primaryDisabled}
                      onClick={() => {
                        if (props.primaryType === 'submit') return
                        if (props.onPrimary) props.onPrimary()
                        else if (props.onSubmit) props.onSubmit()
                      }}
                    >
                      {props.primaryActionLabel}
                    </button>
                  </>
                ) : null
              )}
            </div>
          </div>
        </div>
      </Portal>
    </Show>
  )
}
