import { useState, type ReactNode } from 'react'

interface CollapsibleSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export function CollapsibleSection({ title, defaultOpen = true, children }: CollapsibleSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <section className={`collapsible ${open ? 'collapsible--open' : ''}`}>
      <button
        type="button"
        className="collapsible__trigger"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className="collapsible__chevron" aria-hidden />
      </button>
      {open && <div className="collapsible__body">{children}</div>}
    </section>
  )
}
