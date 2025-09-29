/**
 * MonthPill
 * ---------
 * Small pill-like button used inside month cells to represent a single event.
 *
 * Props
 * - title: text shown inside the pill
 * - color: optional color dot shown before the title
 * - onActivate: fired on click or keyboard activate (Enter/Space)
 */
type Props = {
  title: string
  color?: string
  onActivate?: () => void
}

export default function MonthPill(props: Props) {
  return (
    <button
      type="button"
      class="w-full group text-left text-[11px] px-2 py-1 rounded-md cursor-pointer select-none border shadow-sm flex items-center gap-2 hover:bg-white/80 focus:outline-none focus:ring-2 focus:ring-blue-500"
  style={{ 'background-color': '#ffffff', 'border-color': 'rgba(148, 163, 184, 0.35)' }}
      title={props.title}
      onClick={props.onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); props.onActivate?.()
        }
      }}
    >
      <span class="inline-block w-2 h-2 rounded-full flex-none" style={{ 'background-color': props.color ?? '#94a3b8' }} />
      <span class="truncate">
        {props.title}
      </span>
    </button>
  )
}
