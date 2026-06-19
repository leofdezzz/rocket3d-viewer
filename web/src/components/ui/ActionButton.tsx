import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ActionButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost'
  children: ReactNode
}

export function ActionButton({
  variant = 'primary',
  className = '',
  children,
  ...props
}: ActionButtonProps) {
  return (
    <button type="button" className={`action-btn action-btn--${variant} ${className}`.trim()} {...props}>
      {children}
    </button>
  )
}
