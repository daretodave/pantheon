import type { HTMLAttributes, ReactNode } from 'react'

type SeasonGridProps = {
  children?: ReactNode
} & Omit<HTMLAttributes<HTMLDivElement>, 'children'>

export function SeasonGrid({ children, className, ...rest }: SeasonGridProps) {
  const compiled = `season-grid${className ? ` ${className}` : ''}`
  return (
    <div className={compiled} data-testid="season-grid" {...rest}>
      {children}
    </div>
  )
}
