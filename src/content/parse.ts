import matter from 'gray-matter'
import { z, ZodError } from 'zod'
import { ContentValidationError } from './errors'

function toIsoDate(d: Date): string {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0')
  const dd = String(d.getUTCDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function coerceDates(value: unknown): unknown {
  if (value instanceof Date) {
    return toIsoDate(value)
  }
  if (Array.isArray(value)) {
    return value.map(coerceDates)
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = coerceDates(v)
    }
    return out
  }
  return value
}

function readFrontmatter(raw: string): { data: Record<string, unknown>; content: string } {
  const parsed = matter(raw)
  return {
    data: coerceDates(parsed.data) as Record<string, unknown>,
    content: parsed.content,
  }
}
import {
  canonFileSchema,
  legalDocSchema,
  seasonSchema,
  showSchema,
  themeSchema,
  type CanonEntry,
  type CanonFile,
  type CommunityRankHint,
  type LegalDoc,
  type Season,
  type Show,
  type Theme,
} from './schemas'

function flattenZod(err: ZodError): Array<{ path: string; message: string }> {
  return err.issues.map((i) => ({
    path: i.path.join('.') || '(root)',
    message: i.message,
  }))
}

function validate<T extends z.ZodType>(
  schema: T,
  data: unknown,
  file: string,
  label: string,
): z.infer<T> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    const issues = flattenZod(parsed.error)
    const summary = issues
      .map((i) => `  ${i.path}: ${i.message}`)
      .join('\n')
    throw new ContentValidationError(
      `${label} validation failed at ${file}:\n${summary}`,
      file,
      issues,
    )
  }
  return parsed.data
}

export function parseShowFile(raw: string, file: string): Show {
  const { data, content } = readFrontmatter(raw)
  const body = content.trim()
  const merged = body.length > 0 ? { ...data, body_md: body } : { ...data }
  return validate(showSchema, merged, file, 'show')
}

export function parseSeasonFile(
  raw: string,
  file: string,
  derivedSlug?: string,
): Season {
  const { data, content } = readFrontmatter(raw)
  const body = content.trim()
  // 31a: pre-fill `slug` from the filename so the loader's
  // `NN-<slug>.md` convention drives the canonical URL. A
  // frontmatter `slug:` value spreads after and wins as the
  // optional override.
  const merged = derivedSlug
    ? { slug: derivedSlug, ...data, blurb_md: body }
    : { ...data, blurb_md: body }
  return validate(seasonSchema, merged, file, 'season')
}

export function parseThemeFile(raw: string, file: string): Theme {
  const { data, content } = readFrontmatter(raw)
  const merged = { ...data, body_md: content.trim() }
  return validate(themeSchema, merged, file, 'theme')
}

export function parseLegalFile(raw: string, file: string): LegalDoc {
  const { data, content } = readFrontmatter(raw)
  const body = content.trim()
  const merged = { ...data, body_md: body }
  return validate(legalDocSchema, merged, file, 'legal doc')
}

const CANON_HEADING_RE = /^##\s+(\d+)\.\s+(.+?)\s*$/
// 31b: per-entry editorial metadata reads as leading "key: value"
// lines between the heading and the rationale. Recognized keys
// are `tag`, `slot_argument`, and `community_rank_hint`. Anything
// else terminates the metadata block and starts the rationale.
const ENTRY_META_RE = /^(tag|slot_argument|community_rank_hint):\s*(.+)$/

function parseCommunityRankHint(value: string): CommunityRankHint | undefined {
  // Expects space-separated key=value pairs, e.g.
  // "rank=2 delta=+1 sentiment=up".
  const parts = value.split(/\s+/).filter(Boolean)
  const map: Record<string, string> = {}
  for (const part of parts) {
    const eq = part.indexOf('=')
    if (eq <= 0) return undefined
    map[part.slice(0, eq)] = part.slice(eq + 1)
  }
  const rank = Number.parseInt(map.rank ?? '', 10)
  const delta = Number.parseInt(map.delta ?? '', 10)
  const sentiment = map.sentiment
  if (Number.isNaN(rank) || Number.isNaN(delta) || !sentiment) return undefined
  if (sentiment !== 'up' && sentiment !== 'down' && sentiment !== 'hold') {
    return undefined
  }
  return { rank, delta, sentiment }
}

export function parseCanonFile(raw: string, file: string): CanonFile {
  const { data, content } = readFrontmatter(raw)
  const lines = content.split(/\r?\n/)
  type Bucket = { season: number; title: string; lines: string[] }
  const buckets: Bucket[] = []
  let current: Bucket | null = null

  for (const line of lines) {
    const m = line.match(CANON_HEADING_RE)
    if (m) {
      if (current) buckets.push(current)
      const season = Number.parseInt(m[1] ?? '', 10)
      const title = (m[2] ?? '').trim()
      current = { season, title, lines: [] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) buckets.push(current)

  const entries: CanonEntry[] = buckets.map((b, idx) => {
    let i = 0
    let tag: string | undefined
    let slot_argument: string | undefined
    let community_rank_hint: CommunityRankHint | undefined
    while (i < b.lines.length) {
      const trimmed = (b.lines[i] ?? '').trim()
      if (trimmed === '') {
        i += 1
        continue
      }
      const m = trimmed.match(ENTRY_META_RE)
      if (!m) break
      const key = m[1]
      const val = (m[2] ?? '').trim()
      if (key === 'tag') tag = val
      else if (key === 'slot_argument') slot_argument = val
      else if (key === 'community_rank_hint') {
        community_rank_hint = parseCommunityRankHint(val)
      }
      i += 1
    }
    const rationale = b.lines.slice(i).join('\n').trim()
    const entry: CanonEntry = {
      rank: idx + 1,
      season: b.season,
      title: b.title,
      rationale,
    }
    if (tag != null) entry.tag = tag
    if (slot_argument != null) entry.slot_argument = slot_argument
    if (community_rank_hint != null) entry.community_rank_hint = community_rank_hint
    return entry
  })

  return validate(
    canonFileSchema,
    { ...data, entries },
    file,
    'canon',
  )
}
