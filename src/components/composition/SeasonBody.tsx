// Phase 19c: editorial body block matching
// design/Pantheon · Heroes vs. Villains.html §SHELL.season-body.
// Renders a serif lede, optional body paragraphs (from a multi-line
// `body` frontmatter field), and an optional pull-quote.

type SeasonBodyProps = {
  lede: string
  body?: string
  pull?: string
}

function splitParagraphs(body: string): string[] {
  return body
    .split(/\n{2,}/g)
    .map((p) => p.trim())
    .filter((p) => p.length > 0)
}

export function SeasonBody({ lede, body, pull }: SeasonBodyProps) {
  const paragraphs = body ? splitParagraphs(body) : []
  return (
    <section
      className="season-body"
      data-testid="season-body"
      aria-label="season write-up"
    >
      <p className="season-lede" data-testid="season-lede">
        {lede}
      </p>
      {paragraphs.map((p, i) => (
        <p key={i}>{p}</p>
      ))}
      {pull ? (
        <blockquote className="season-pull" data-testid="season-pull">
          {pull}
        </blockquote>
      ) : null}
    </section>
  )
}
