import type { HTMLAttributes } from 'react'

type ShieldBadgeProps = {
  inline?: boolean
  message?: string
} & HTMLAttributes<HTMLDivElement>

export function ShieldBadge({
  inline = false,
  message = 'No spoilers. Every page is reviewed before it goes live.',
  className,
  ...rest
}: ShieldBadgeProps) {
  const compiled = `shield${inline ? ' inline' : ''}${className ? ` ${className}` : ''}`
  return (
    <div
      className={compiled}
      data-testid="shield-badge"
      data-inline={inline || undefined}
      role="note"
      aria-label="spoiler policy"
      {...rest}
    >
      <span className="shield-dot" aria-hidden="true">
        ●
      </span>
      <span className="shield-text">{message}</span>
    </div>
  )
}
