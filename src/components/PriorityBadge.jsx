const config = {
  high: {
    bg: 'bg-error-container/10',
    text: 'text-error',
    label: 'HIGH',
  },
  medium: {
    bg: 'bg-primary-container/20',
    text: 'text-primary',
    label: 'MED',
  },
  low: {
    bg: 'bg-surface-container-high',
    text: 'text-on-surface-variant',
    label: 'LOW',
  },
}

export default function PriorityBadge({ priority }) {
  const c = config[priority] || config.low
  return (
    <span
      className={`px-2 py-0.5 rounded-full ${c.bg} ${c.text} text-[10px] font-bold tracking-wide uppercase`}
    >
      {c.label}
    </span>
  )
}
