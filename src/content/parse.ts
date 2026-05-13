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
  const merged = {
    ...data,
    tagline: (data as { tagline?: unknown }).tagline ?? (body.length > 0 ? body : undefined),
    body_md: body,
  }
  return validate(showSchema, merged, file, 'show')
}

export function parseSeasonFile(raw: string, file: string): Season {
  const { data, content } = readFrontmatter(raw)
  const body = content.trim()
  const merged = { ...data, blurb_md: body }
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

  const entries: CanonEntry[] = buckets.map((b, idx) => ({
    rank: idx + 1,
    season: b.season,
    title: b.title,
    rationale: b.lines.join('\n').trim(),
  }))

  return validate(
    canonFileSchema,
    { ...data, entries },
    file,
    'canon',
  )
}
