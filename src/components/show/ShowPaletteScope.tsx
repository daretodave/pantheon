import type { CSSProperties, HTMLAttributes, ReactNode } from 'react'
import { getShow } from '@/content/loaders'

type Palette = {
  paper: string
  ink: string
  primary: string
}

type ShowPaletteScopeProps = {
  show?: string
  palette?: Palette | null
  children?: ReactNode
} & Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'>

function paletteCssVars(palette: Palette | null | undefined): CSSProperties {
  if (!palette) return {}
  return {
    '--show-paper': palette.paper,
    '--show-ink': palette.ink,
    '--show-primary': palette.primary,
  } as CSSProperties
}

export function ShowPaletteScope({
  show,
  palette,
  children,
  className,
  ...rest
}: ShowPaletteScopeProps) {
  let resolved: Palette | null = null

  if (palette) {
    resolved = palette
  } else if (show) {
    const fromContent = getShow(show)
    if (fromContent) resolved = fromContent.palette
  }

  return (
    <div
      data-show={show ?? undefined}
      data-testid="show-palette-scope"
      style={paletteCssVars(resolved)}
      className={className}
      {...rest}
    >
      {children}
    </div>
  )
}
