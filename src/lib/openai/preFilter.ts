import OpenAI from 'openai'
import { z } from 'zod'

// Comment moderation pre-filter. Wraps a structured-output call
// against the pinned gpt-5-mini model. Server-only — never import
// from client code; OPENAI_API_KEY is server-side.
//
// The shape matches setup/06_openai.md §E. Categories use the
// fixed enum so the mod page can group by reason.

const MODEL = 'gpt-5-mini-2025-08-07'

export const VERDICTS = ['allow', 'flag', 'block'] as const
export type Verdict = (typeof VERDICTS)[number]

export const CATEGORIES = [
  'spoiler_winner',
  'spoiler_elimination',
  'spoiler_plot',
  'spoiler_death',
  'spoiler_twist',
  'spoiler_finale',
  'abuse_slur',
  'abuse_harassment',
  'abuse_threat',
  'spam',
  'off_topic',
] as const

export const verdictSchema = z.object({
  verdict: z.enum(VERDICTS),
  categories: z.array(z.enum(CATEGORIES)),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1).max(500),
  redacted_phrase: z.string().nullable(),
})

export type ModerationVerdict = z.infer<typeof verdictSchema>

// Locked system prompt — see setup/06_openai.md §F.
const SYSTEM_PROMPT = `You are Pantheon's comment moderator. Pantheon is a spoiler-free TV-season ranking site.

For each user comment, return a moderation verdict.

SPOILERS in Pantheon are defined STRICTLY:
- Winners of any season or competition
- Eliminations, deaths, departures, breakups
- Plot beats, finale outcomes, twist reveals
- Relationship outcomes
- Anything a first-time viewer wouldn't want to know

The following are NOT spoilers:
- Format changes ("they shortened the season")
- Casting commentary ("the cast had great chemistry")
- Tonal observations ("darker than usual")
- Location ("filmed in Fiji")
- Host changes

ABUSE includes:
- Slurs (any protected class)
- Direct harassment of named individuals
- Threats
- Coordinated brigading language

NOT abuse:
- Strong opinions about a season
- Disagreement, even rude disagreement
- Sarcasm

If unsure between allow and flag: flag (human will review).
If unsure between flag and block: flag (block is reserved for clear violations).`

// Deterministic stub. OPENAI_FAKE=1 short-circuits the network
// call, so unit + e2e never hit OpenAI. Rules:
//   - "WINNER" (case-insensitive) → block / spoiler_winner
//   - "SPOILER" → flag / spoiler_plot
//   - otherwise → allow
function fakeVerdict(body: string): ModerationVerdict {
  const upper = body.toUpperCase()
  if (upper.includes('WINNER')) {
    return {
      verdict: 'block',
      categories: ['spoiler_winner'],
      confidence: 1,
      reason: 'fake stub',
      redacted_phrase: null,
    }
  }
  if (upper.includes('SPOILER')) {
    return {
      verdict: 'flag',
      categories: ['spoiler_plot'],
      confidence: 1,
      reason: 'fake stub',
      redacted_phrase: null,
    }
  }
  return {
    verdict: 'allow',
    categories: [],
    confidence: 1,
    reason: 'fake stub',
    redacted_phrase: null,
  }
}

// Lazy singleton so we don't construct the client at import time.
let cached: OpenAI | null = null

function client(): OpenAI {
  if (cached) return cached
  const apiKey = process.env['OPENAI_API_KEY']
  if (!apiKey) throw new Error('OPENAI_API_KEY missing')
  cached = new OpenAI({ apiKey, timeout: 5_000, maxRetries: 1 })
  return cached
}

const responseFormat = {
  type: 'json_schema' as const,
  json_schema: {
    name: 'moderation_verdict',
    strict: true,
    schema: {
      type: 'object',
      additionalProperties: false,
      properties: {
        verdict: { type: 'string', enum: VERDICTS },
        categories: {
          type: 'array',
          items: { type: 'string', enum: CATEGORIES },
        },
        confidence: { type: 'number', minimum: 0, maximum: 1 },
        reason: { type: 'string' },
        redacted_phrase: { type: ['string', 'null'] },
      },
      required: ['verdict', 'categories', 'confidence', 'reason', 'redacted_phrase'],
    },
  },
}

// Hard-fallback when the API errors out: return verdict='flag' so
// the comment lands in the mod queue. Better slow than insecure
// (setup/06_openai.md §J).
function fallbackVerdict(reason: string): ModerationVerdict {
  return {
    verdict: 'flag',
    categories: [],
    confidence: 0,
    reason: `fallback: ${reason}`,
    redacted_phrase: null,
  }
}

export async function moderateComment(body: string): Promise<ModerationVerdict> {
  if (process.env['OPENAI_FAKE'] === '1') {
    return fakeVerdict(body)
  }
  let raw: string | null = null
  try {
    const resp = await client().chat.completions.create({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: body },
      ],
      response_format: responseFormat,
    })
    raw = resp.choices[0]?.message?.content ?? null
  } catch (err) {
    return fallbackVerdict(err instanceof Error ? err.message : 'api error')
  }
  if (!raw) return fallbackVerdict('empty response')
  try {
    const parsed = verdictSchema.parse(JSON.parse(raw))
    return parsed
  } catch (err) {
    return fallbackVerdict(err instanceof Error ? err.message : 'parse error')
  }
}
