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
        try { (pe as any).preventDefault?.() } catch {}
        if (props.onDragMove2D) {
          withPointer2D((dx, dy, ev) => {
            if (Math.abs(dx) > 2 || Math.abs(dy) > 2) didDrag = true
            props.onDragMove2D!(dx, dy, ev)
          }, () => {
            // delay reset so click handler can see didDrag
            setTimeout(() => (didDrag = false), 0)
          })(pe as any)
        } else if (props.onDragMove) {
          withPointer((dy, ev) => {
            if (Math.abs(dy) > 2) didDrag = true
            props.onDragMove!(dy, ev)
          }, () => {
            setTimeout(() => (didDrag = false), 0)
          })(pe as any)
        }
      }}
      tabindex={props.tabIndex as any}
      onKeyDown={props.onKeyDown as any}
      onFocus={props.onFocus as any}
      ref={props.setRef as any}
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
            withPointer((dy, ev) => props.onResize?.(dy, ev))(pe as any)
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
