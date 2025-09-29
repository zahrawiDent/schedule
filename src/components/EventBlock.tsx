/**
 * EventBlock
 * ----------
 *
 * A purely presentational, interactive block positioned absolutely inside the TimeGrid right pane.
 * It supports vertical drag (and optional 2D drag), resize from the bottom edge, click, keyboard,
 * and focus. It does not perform any time calculations itself; callers convert between pixels and
 * minutes and pass computed styles.
 *
 * Visuals
 * - Styled card with gradient background derived from `color`
 * - Minimum height to remain tappable
 * - Optional bottom handle area for resizing (ns-resize cursor)
 *
 * Interactions
 * - Drag: starts when movement exceeds a 2px threshold to avoid accidental drags
 * - Resize: dedicated pointer area at the bottom triggers resize callbacks
 * - Click: suppressed when a drag just occurred (didDrag flag)
 * - Keyboard/focus: forwarded to parent via props
 *
 * Accessibility
 * - `tabindex` is applied when provided, enabling roving focus patterns in parent components
 * - `title` attribute shows times on hover
 *
 * Layout within the lane
 * ----------------------
 *  left/width are determined by the parent (lane system). This component only consumes them.
 *
 * Pointer helpers
 * ---------------
 * Uses withPointer/withPointer2D util wrappers to manage pointer capture and lifecycle, calling
 * the supplied callbacks (onDragMove/onResize) with delta pixels.
 */
import { format, parseISO } from 'date-fns'
import { withPointer, withPointer2D } from '../utils/pointer'

export type EventBlockProps = {
  id: string
  title: string
  color?: string
  startISO: string
  endISO: string
  style: { top: string; height: string; left?: string; width?: string; transition?: string }
  draggable?: boolean
  resizable?: boolean
  onClick?: (id: string) => void
  onDragMove?: (dyPx: number, ev: PointerEvent) => void
  onDragMove2D?: (dxPx: number, dyPx: number, ev: PointerEvent) => void
  onResize?: (dyPx: number, ev: PointerEvent) => void
  onDragStart?: () => void
  onDragEnd?: () => void
  onResizeStart?: () => void
  onResizeEnd?: () => void
  tabIndex?: number
  onKeyDown?: (ev: KeyboardEvent) => void
  onFocus?: (ev: FocusEvent) => void
  setRef?: (el: HTMLDivElement) => void
}

export default function EventBlock(props: EventBlockProps) {
  const s = parseISO(props.startISO)
  const e = parseISO(props.endISO)
  // Track if a drag occurred to suppress click
  let didDrag = false
  // Local ref to mutate z-index during drag/resize so the block stays on top
  let rootEl: HTMLDivElement | null = null
  const setElevated = (on: boolean) => {
    if (!rootEl) return
    // Use inline style to outrank Tailwind class z-index
    rootEl.style.zIndex = on ? '50' : ''
  }
  return (
    <div
  class={`absolute rounded-lg shadow-sm border border-white/20 text-white z-20 overflow-hidden transition-all duration-200 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-1 focus:ring-offset-gray-100 select-none touch-none ${props.draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
      style={{
        ...props.style,
        'background': `linear-gradient(135deg, ${props.color ?? '#2563eb'} 0%, ${adjustColorBrightness(props.color ?? '#2563eb', -20)} 100%)`,
        'min-height': '24px'
      }}
      onClick={(ce) => {
        ce.stopPropagation()
        if (didDrag) {
          // suppress click after a drag
          didDrag = false
          return
        }
        props.onClick?.(props.id)
      }}
      onPointerDown={(pe) => {
        if (!props.draggable) return
        // Start drag from anywhere in the block
        pe.stopPropagation()
        let started = false
    // When consumers provide 2D drag, use that; otherwise fallback to vertical-only
    if (props.onDragMove2D) {
          withPointer2D((dx, dy, ev) => {
            if (!started) {
              if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
                didDrag = true
                started = true
                setElevated(true)
                props.onDragStart?.()
              } else {
                return
              }
            }
            props.onDragMove2D!(dx, dy, ev)
          }, () => {
            // delay reset so click handler can see didDrag
            setTimeout(() => (didDrag = false), 0)
            setElevated(false)
            if (started) props.onDragEnd?.()
          })(pe as any)
        } else if (props.onDragMove) {
          withPointer((dy, ev) => {
            if (!started) {
              if (Math.abs(dy) > 2) {
                didDrag = true
                started = true
                setElevated(true)
                props.onDragStart?.()
              } else {
                return
              }
            }
            props.onDragMove!(dy, ev)
          }, () => {
            setTimeout(() => (didDrag = false), 0)
            setElevated(false)
            if (started) props.onDragEnd?.()
          })(pe as any)
        }
      }}
      tabindex={props.tabIndex as any}
      onKeyDown={props.onKeyDown as any}
      onFocus={props.onFocus as any}
      ref={(el) => { rootEl = el as HTMLDivElement; (props.setRef as any)?.(el) }}
      data-evid={props.id}
      title={`${props.title}\n${format(s, 'p')} – ${format(e, 'p')}`}
    >
      <div class="px-2 py-1">
        <div class="font-semibold truncate">{props.title}</div>
        <div class="opacity-90 truncate">{format(s, 'p')} – {format(e, 'p')}</div>
      </div>
      {props.resizable && (
        <div
          class="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize"
          title="Drag to resize"
          onPointerDown={(pe) => {
            pe.stopPropagation()
            setElevated(true)
            props.onResizeStart?.()
            withPointer((dy, ev) => props.onResize?.(dy, ev), () => { props.onResizeEnd?.(); setElevated(false) })(pe as any)
          }}
        />
      )}
    </div>
  )
}

// Helper function to adjust color brightness
function adjustColorBrightness(color: string, percent: number): string {
  // Convert hex to RGB
  const hex = color.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)

  // Adjust brightness
  const newR = Math.max(0, Math.min(255, r + (r * percent / 100)))
  const newG = Math.max(0, Math.min(255, g + (g * percent / 100)))
  const newB = Math.max(0, Math.min(255, b + (b * percent / 100)))

  // Convert back to hex
  return `#${Math.round(newR).toString(16).padStart(2, '0')}${Math.round(newG).toString(16).padStart(2, '0')}${Math.round(newB).toString(16).padStart(2, '0')}`
}
