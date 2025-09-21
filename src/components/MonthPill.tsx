type Props = {
  title: string
  color?: string
  onActivate?: () => void
}

export default function MonthPill(props: Props) {
  return (
    <button
      type="button"
      class="w-full truncate text-xs px-1 py-0.5 rounded cursor-pointer hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
      style={{ 'background-color': props.color ?? '#e2e8f0' }}
      title={props.title}
      onClick={props.onActivate}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault(); props.onActivate?.()
        }
      }}
    >
      {props.title}
    </button>
  )
}
