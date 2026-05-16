import type { ReactNode } from 'react'

// Phase 30: top hero of the season page. Crumb + eyebrow + display_title
// (with optional <em> colored accent) + lede + byline on the left; the
// SeasonInfoCard rides the right rail. Ported from
// design/tiered.tv · Heroes vs. Villains.html § header.hero.

type SeasonHeroProps = {
  crumb: ReactNode
  eyebrow?: string | null
  title: string
  displayTitle?: string | null
  lede: string
  byline?: ReactNode
  infoCard: ReactNode
}

type TitleNode =
  | { kind: 'text'; value: string }
  | { kind: 'accent'; value: string }
  | { kind: 'break' }

// display_title accepts a constrained HTML subset — `<em>...</em>` and
// `<br/>`. The schema regex (see src/content/schemas.ts) enforces shape,
// so a simple regex split is safe. <em> renders as `<span class="amp">`
// per the design's `.season-h1 .amp` style; <br/> renders as a literal
// line break.
const TITLE_TOKEN = /<em>([^<]+)<\/em>|<br\s*\/?>/gi

// display_title is authored as a constrained HTML subset, so an
// ampersand is written `&amp;` (and editors may reach for other
// entities — `&rsquo;`, `&mdash;`, `&#39;`). React renders text
// segments verbatim (JSX text is not HTML), so without this the h1
// would print the literal "&amp;". One combined pass over the
// schema-constrained, single-encoded set — no ongoing data
// discipline required (33b bolt-on 1 root cause).
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  rsquo: '’',
  lsquo: '‘',
  rdquo: '”',
  ldquo: '“',
  mdash: '—',
  ndash: '–',
  hellip: '…',
}

export function decodeTitleEntities(raw: string): string {
  return raw.replace(
    /&(#x[0-9a-f]+|#\d+|[a-z]+);/gi,
    (whole, body: string) => {
      if (body[0] === '#') {
        const code =
          body[1] === 'x' || body[1] === 'X'
            ? Number.parseInt(body.slice(2), 16)
            : Number.parseInt(body.slice(1), 10)
        return Number.isFinite(code) ? String.fromCodePoint(code) : whole
      }
      const named = NAMED_ENTITIES[body.toLowerCase()]
      return named ?? whole
    },
  )
}

export function parseDisplayTitle(raw: string): TitleNode[] {
  const nodes: TitleNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  TITLE_TOKEN.lastIndex = 0
  while ((m = TITLE_TOKEN.exec(raw)) !== null) {
    if (m.index > last) {
      nodes.push({
        kind: 'text',
        value: decodeTitleEntities(raw.slice(last, m.index)),
      })
    }
    if (m[1] != null) {
      nodes.push({ kind: 'accent', value: decodeTitleEntities(m[1]) })
    } else {
      nodes.push({ kind: 'break' })
    }
    last = m.index + m[0].length
  }
  if (last < raw.length) {
    nodes.push({ kind: 'text', value: decodeTitleEntities(raw.slice(last)) })
  }
  return nodes
}

function renderTitle(displayTitle: string | null | undefined, fallback: string) {
  if (!displayTitle) {
    return <>{fallback}</>
  }
  const nodes = parseDisplayTitle(displayTitle)
  return (
    <>
      {nodes.map((n, i) => {
        if (n.kind === 'text') return <span key={i}>{n.value}</span>
        if (n.kind === 'accent') {
          return (
            <span key={i} className="amp" data-testid="display-title-accent">
              {n.value}
            </span>
          )
        }
        return <br key={i} />
      })}
    </>
  )
}

export function SeasonHero({
  crumb,
  eyebrow,
  title,
  displayTitle,
  lede,
  byline,
  infoCard,
}: SeasonHeroProps) {
  return (
    <header className="hero" data-testid="season-hero">
      <div className="hero-left">
        <div className="season-crumb" data-testid="season-crumb">
          {crumb}
        </div>
        {eyebrow ? (
          <div className="season-eyebrow" data-testid="season-eyebrow">
            {eyebrow}
          </div>
        ) : null}
        <h1 className="season-h1" data-testid="season-h1">
          {renderTitle(displayTitle, title)}
        </h1>
        <p className="hero-lede" data-testid="hero-lede">
          {lede}
        </p>
        {byline ? (
          <div className="hero-byline" data-testid="hero-byline">
            {byline}
          </div>
        ) : null}
      </div>
      {infoCard}
    </header>
  )
}
