type BrandMarkProps = {
  size?: 16 | 22 | 28 | 48 | 96 | 240
  className?: string
}

const ALLOWED_SIZES = [16, 22, 28, 48, 96, 240] as const

export function BrandMark({ size = 22, className }: BrandMarkProps) {
  if (
    process.env.NODE_ENV !== 'production' &&
    !ALLOWED_SIZES.includes(size as (typeof ALLOWED_SIZES)[number])
  ) {
    // biome-ignore lint/suspicious/noConsole: dev-time guard
    console.warn(
      `<BrandMark> size must be one of ${ALLOWED_SIZES.join(', ')}; got ${String(size)}`,
    )
  }
  return (
    <svg
      viewBox="0 0 28 28"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      data-testid="brand-mark"
    >
      <path
        d="M2 11 L14 3 L26 11 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <line x1="5" y1="14" x2="5" y2="25" stroke="currentColor" strokeWidth="1.4" />
      <line x1="14" y1="14" x2="14" y2="25" stroke="currentColor" strokeWidth="1.4" />
      <line x1="23" y1="14" x2="23" y2="25" stroke="currentColor" strokeWidth="1.4" />
      <line x1="2" y1="26" x2="26" y2="26" stroke="currentColor" strokeWidth="1.4" />
    </svg>
  )
}
