interface StatusPillProps {
  variant: 'live' | 'connecting' | 'error' | 'standby'
  label: string
}

export function StatusPill({ variant, label }: StatusPillProps) {
  return (
    <span className={`status-pill status-pill--${variant}`}>
      <span className="status-pill__dot" />
      {label}
    </span>
  )
}
