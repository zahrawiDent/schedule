import type { JSX } from 'solid-js'
import { format } from 'date-fns'
/**
 * A month grid cell that renders the day number, event pills, and an optional “+N more” button.
 * It supports roving tabIndex for keyboard nav, click-to-add, and custom keydown handling.
 */
export default function MonthCell(props: {
  date: Date
  inMonth: boolean
  tabIndex: number
  setRef?: (el: HTMLDivElement) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onDayClick?: () => void
  childrenEvents: JSX.Element
  moreCount?: number
  onMoreClick?: () => void
}) {
  return (
    <div
      role="gridcell"
      tabindex={props.tabIndex}
      ref={props.setRef}
  class={`min-h-28 bg-white p-1 flex flex-col relative outline-none ${props.inMonth ? '' : 'opacity-50'}`}
      onClick={props.onDayClick}
      onKeyDown={(e) => props.onKeyDown?.(e as unknown as KeyboardEvent)}
    >
      <div class="flex items-center justify-between">
        <span class="text-xs">{format(props.date, 'd')}</span>
      </div>
      <div class="mt-1 space-y-1">
        {props.childrenEvents}
        {typeof props.moreCount === 'number' && props.moreCount > 0 && (
          <button
            type="button"
            class="text-[10px] text-blue-600 hover:underline"
            onClick={(ev) => { ev.stopPropagation(); props.onMoreClick?.() }}
          >
            +{props.moreCount} more
          </button>
        )}
      </div>
    </div>
  )
}
