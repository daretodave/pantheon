import path from 'node:path'

let contentRootOverride: string | null = null

export function setContentRoot(root: string | null): void {
  contentRootOverride = root
}

export function getContentRoot(): string {
  return contentRootOverride ?? path.resolve(process.cwd(), 'content')
}

export const showsDir = (): string => path.join(getContentRoot(), 'shows')
export const showFile = (slug: string): string => path.join(showsDir(), `${slug}.md`)
export const seasonsDir = (slug: string): string => path.join(showsDir(), slug, 'seasons')
export const canonFile = (slug: string): string => path.join(showsDir(), slug, 'canon.md')
export const themesDir = (): string => path.join(getContentRoot(), 'themes')
export const themeFile = (slug: string): string => path.join(themesDir(), `${slug}.md`)
export const legalDir = (): string => path.join(getContentRoot(), 'legal')
export const legalFile = (slug: string): string => path.join(legalDir(), `${slug}.md`)
