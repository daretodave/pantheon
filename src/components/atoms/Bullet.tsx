type BulletProps = {
  color: string
  size?: number
  className?: string
  'aria-hidden'?: boolean
}

export function Bullet({
  color,
  size = 12,
  className,
  'aria-hidden': ariaHidden = true,
}: BulletProps) {
  return (
    <span
      data-testid="bullet"
      className={`bullet${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size, background: color }}
      aria-hidden={ariaHidden}
    />
  )
}
