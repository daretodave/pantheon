import type { ReactNode } from 'react'

type WrapProps = {
  children: ReactNode
  className?: string
}

export function Wrap({ children, className }: WrapProps) {
  return (
    <div
      data-testid="wrap"
      className={`wrap${className ? ` ${className}` : ''}`}
    >
      {children}
    </div>
  )
}
