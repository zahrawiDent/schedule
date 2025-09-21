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
  return (
    <div
      class="absolute rounded shadow text-xs text-white cursor-pointer z-10"
      style={{ ...props.style, 'background-color': props.color ?? '#2563eb' }}
      onClick={(ce) => { ce.stopPropagation(); props.onClick?.(props.id) }}
  tabindex={props.tabIndex as any}
  onKeyDown={props.onKeyDown as any}
  onFocus={props.onFocus as any}
  ref={props.setRef as any}
  data-evid={props.id}
      title={props.title}
    >
    {props.draggable && (
        <div
          class="absolute top-1 left-1 w-5 h-5 flex items-center justify-center rounded bg-black/20 text-white cursor-grab active:cursor-grabbing select-none"
          title="Drag to move"
          onPointerDown={(pe) => {
            pe.stopPropagation()
            if (props.onDragMove2D) {
        withPointer2D((dx, dy, ev) => props.onDragMove2D!(dx, dy, ev))(pe as any)
            } else if (props.onDragMove) {
        withPointer((dy, ev) => props.onDragMove!(dy, ev))(pe as any)
            }
          }}
        >
      
        </div>
      )}
      <div class="px-2 py-1 pl-8">
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
