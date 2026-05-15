import type { CanonFile } from '@/content'

type CanonMethodologyProps = {
  canon: CanonFile | null
}

type Cell = {
  num: string
  heading: string | undefined | null
  body: string | undefined | null
}

const DEFAULTS: Cell[] = [
  {
    num: '01 · WHO',
    heading: 'One editor, named.',
    body:
      'Each show gets a single canon editor. The canon is one opinion, defended in public — we will tell you who, and we will not hide behind plural pronouns.',
  },
  {
    num: '02 · HOW',
    heading: 'Position, not score.',
    body:
      'Seasons are placed against each other, one slot at a time. If two seasons argue for the same slot, we write the argument and choose. There are no ties.',
  },
  {
    num: '03 · WHEN',
    heading: 'Revised quarterly.',
    body:
      'The canon moves slowly — quarterly revisions, with public diff notes. The community rank, on the other tab, updates as votes land. That is where the noise lives.',
  },
]

export function CanonMethodology({ canon }: CanonMethodologyProps) {
  const cells: Cell[] = [
    {
      num: '01 · WHO',
      heading: canon?.meth_who_h ?? DEFAULTS[0]!.heading,
      body: canon?.meth_who_p ?? DEFAULTS[0]!.body,
    },
    {
      num: '02 · HOW',
      heading: canon?.meth_how_h ?? DEFAULTS[1]!.heading,
      body: canon?.meth_how_p ?? DEFAULTS[1]!.body,
    },
    {
      num: '03 · WHEN',
      heading: canon?.meth_when_h ?? DEFAULTS[2]!.heading,
      body: canon?.meth_when_p ?? DEFAULTS[2]!.body,
    },
  ]
  return (
    <section
      className="cp-methodology"
      data-testid="canon-methodology"
      aria-label="How the canon works"
    >
      {cells.map((cell) => (
        <div className="cp-meth-cell" data-testid="canon-meth-cell" key={cell.num}>
          <div className="cp-meth-num">{cell.num}</div>
          {cell.heading ? <h3>{cell.heading}</h3> : null}
          {cell.body ? <p>{cell.body}</p> : null}
        </div>
      ))}
    </section>
  )
}
