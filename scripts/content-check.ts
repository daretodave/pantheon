#!/usr/bin/env node
import { existsSync } from 'node:fs'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  getAllShows,
  getAllSeasons,
  getCanon,
  getAllThemes,
  getLegalDoc,
  loadAllContent,
} from '../src/content/loaders'
import { ContentValidationError } from '../src/content/errors'
import {
  validateEraBandCoverage,
  yearOfSeason,
} from '../src/lib/canon/era-bands'
import { extractPlacementOrdinal } from '../src/lib/canon/placement-ordinal'

export type Failure = { file: string; message: string }

function fmtFailure(f: Failure): string {
  return `  ${f.file}\n    ${f.message.replace(/\n/g, '\n    ')}`
}

// Exported so the vitest suite can exercise the assertion set
// directly against a temp content tree without spawning a child
// process. The flag mirrors the script-level `STRICT` constant —
// 31b's final tick changes the default to `true`.
export function collectFailures(strict = false): Failure[] {
  const failures: Failure[] = []

  for (const show of getAllShows()) {
    const canon = getCanon(show.slug)
    const seasons = getAllSeasons(show.slug)
    const seasonNumbers = new Set(seasons.map((s) => s.number))
    const seasonBySlug = new Map<string, string>()

    for (const season of seasons) {
      const prior = seasonBySlug.get(season.slug)
      if (prior) {
        failures.push({
          file: `content/shows/${show.slug}/seasons/`,
          message: `duplicate season slug "${season.slug}" — appears on seasons ${prior} and ${season.number}`,
        })
      } else {
        seasonBySlug.set(season.slug, String(season.number))
      }
    }

    if (canon) {
      const canonRankBySeason = new Map<number, number>()
      for (const entry of canon.entries) {
        if (!seasonNumbers.has(entry.season)) {
          failures.push({
            file: `content/shows/${show.slug}/canon.md`,
            message: `canon entry rank ${entry.rank} references season ${entry.season} but no matching season file exists`,
          })
        }
        canonRankBySeason.set(entry.season, entry.rank)

        // The rationale's spoken placement ("the canon places it
        // twelfth", "earns the third slot") must equal the slot.
        // Drift here is a reader-visible correctness bug on the
        // flagship page (#63). Absence of a placement sentence is
        // tolerated — only a stated-but-wrong ordinal fails.
        const spoken = extractPlacementOrdinal(entry.rationale)
        if (spoken != null && spoken !== entry.rank) {
          failures.push({
            file: `content/shows/${show.slug}/canon.md`,
            message: `canon entry #${entry.rank} ("${entry.title}") prose states placement ${spoken}, not ${entry.rank} — rebase the placement ordinal to the slot`,
          })
        }
      }
      for (const season of seasons) {
        if (season.canonical_position == null) continue
        const expected = canonRankBySeason.get(season.number)
        if (expected != null && expected !== season.canonical_position) {
          failures.push({
            file: `content/shows/${show.slug}/seasons/`,
            message: `season ${season.number} declares canonical_position ${season.canonical_position} but canon ranks it #${expected}`,
          })
        }
      }
    }

    // Phase 34: era-band coverage. A present `canon.era_bands[]`
    // must always be structurally sound (gap-free, overlap-free,
    // covering the aired span) — that fails in lax mode too, the
    // same way a mismatched canon rank does. Absence is only a
    // failure under strict, and only for a canon'd show with a
    // substantial aired span (>= 8 seeded seasons) — newly-seeded
    // shows get bands when their canon is first authored.
    if (canon) {
      const eraBands = canon.era_bands ?? []
      const airedYears = seasons
        .map((s) => yearOfSeason(s))
        .filter((y): y is number => y != null)
      if (eraBands.length > 0) {
        for (const problem of validateEraBandCoverage(eraBands, airedYears)) {
          failures.push({
            file: `content/shows/${show.slug}/canon.md`,
            message: problem,
          })
        }
      } else if (strict && seasons.length >= 8) {
        failures.push({
          file: `content/shows/${show.slug}/canon.md`,
          message: `era_bands required (strict mode) — canon'd show has ${seasons.length} seeded seasons`,
        })
      }
    }

    if (strict && seasons.length > 0) {
      if (!canon) {
        failures.push({
          file: `content/shows/${show.slug}/canon.md`,
          message: 'canon.md required (strict mode) — show has seeded seasons',
        })
      } else {
        const canonSeasons = new Set(canon.entries.map((e) => e.season))
        for (const season of seasons) {
          if (!canonSeasons.has(season.number)) {
            failures.push({
              file: `content/shows/${show.slug}/canon.md`,
              message: `season ${season.number} ("${season.title}") is missing from canon (strict mode)`,
            })
          }
          if (season.canonical_position == null) {
            failures.push({
              file: `content/shows/${show.slug}/seasons/`,
              message: `season ${season.number} ("${season.title}") missing canonical_position (strict mode)`,
            })
          }
        }
      }
    }
  }
  return failures
}

function main(): number {
  const failures: Failure[] = []

  let summary: ReturnType<typeof loadAllContent>
  try {
    summary = loadAllContent()
  } catch (err) {
    if (err instanceof ContentValidationError) {
      failures.push({ file: err.file, message: err.message })
    } else {
      failures.push({
        file: '(load)',
        message: err instanceof Error ? err.message : String(err),
      })
    }
    console.error('content-check: load failed')
    for (const f of failures) console.error(fmtFailure(f))
    return 1
  }

  // 31a: lax-mode canon invariants. The script fails on conflict
  // (mismatched canon ranks vs season frontmatter; dangling canon
  // refs; duplicate slugs within a show), but still passes when a
  // show simply has no canon yet — that's the "always-working"
  // rule's tolerance window for newly-seeded shows. 31b's final
  // tick flips STRICT to true, at which point every show with
  // seasons must carry a canon and every season must have
  // canonical_position set.
  //
  // Toggling STRICT is intentionally a one-line change so the
  // 31b drain ticks can flip it without re-arguing the contract.
  const STRICT = true
  failures.push(...collectFailures(STRICT))

  const showSlugs = new Set(getAllShows().map((s) => s.slug))
  for (const theme of getAllThemes()) {
    for (const entry of theme.entries) {
      if (!showSlugs.has(entry.show)) {
        failures.push({
          file: `content/themes/${theme.slug}.md`,
          message: `theme entry rank ${entry.rank} references unknown show "${entry.show}"`,
        })
        continue
      }
      const seasons = getAllSeasons(entry.show)
      if (!seasons.some((s) => s.number === entry.season)) {
        failures.push({
          file: `content/themes/${theme.slug}.md`,
          message: `theme entry rank ${entry.rank} references show "${entry.show}" season ${entry.season} but that season file is missing`,
        })
      }
    }
  }

  for (const slug of ['about', 'terms', 'privacy'] as const) {
    if (!getLegalDoc(slug)) {
      failures.push({
        file: `content/legal/${slug}.md`,
        message: 'required legal doc missing',
      })
    }
  }

  if (!existsSync('content')) {
    failures.push({
      file: 'content',
      message: 'content directory missing',
    })
  }

  if (failures.length > 0) {
    console.error('content-check: validation failed')
    for (const f of failures) console.error(fmtFailure(f))
    return 1
  }

  console.log(
    `content-check: ok — ${summary.shows} show${summary.shows === 1 ? '' : 's'}, ${summary.seasons} season${summary.seasons === 1 ? '' : 's'}, ${summary.canons} canon${summary.canons === 1 ? '' : 's'}, ${summary.themes} theme${summary.themes === 1 ? '' : 's'}, ${summary.legal} legal docs`,
  )
  return 0
}

// Only execute when invoked as a script — keeps the module
// safely importable from vitest suites.
const isDirect =
  typeof process.argv[1] === 'string' &&
  process.argv[1] === fileURLToPath(import.meta.url)
if (isDirect) {
  process.exit(main())
}

export { main }
