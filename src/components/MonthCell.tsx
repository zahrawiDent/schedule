import { type JSX } from 'solid-js'
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
  setScrollRef?: (el: HTMLDivElement | null) => void
  onKeyDown?: (e: KeyboardEvent) => void
  onDayClick?: () => void
  childrenEvents: JSX.Element
  isLastInRow?: boolean
}) {
  // is day is today
  const isToday = () => format(props.date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  return (
    <div
      role="gridcell"
      tabindex={props.tabIndex}
      ref={props.setRef}
      class={`
        border-b border-gray-200 ${props.isLastInRow ? '' : 'border-r'}
  cursor-pointer h-36 sm:h-40 md:h-44 bg-white p-2
        flex flex-col relative outline-none 
        ${props.inMonth ? '' : 'opacity-50'}`}
      onClick={props.onDayClick}
      onKeyDown={(e) => props.onKeyDown?.(e as unknown as KeyboardEvent)}
    >


      {/* Date number */}
      <div class="flex items-center justify-between ">
        <span class={`text-xs font-medium
            ${isToday() ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
            ${!props.inMonth ? 'text-gray-400' : 'text-gray-900'}
          `}
        >{format(props.date, 'd')}
        </span>
      </div>

  {/* Scrollable events area */}
  <div class="month-scroll mt-1 space-y-1 flex-1 min-h-0 overflow-y-auto pr-1" ref={props.setScrollRef as any}>
        {props.childrenEvents}
      </div>
    </div>
  )
}
