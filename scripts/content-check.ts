#!/usr/bin/env node
import { existsSync } from 'node:fs'
import process from 'node:process'
import {
  getAllShows,
  getAllSeasons,
  getCanon,
  getAllThemes,
  getLegalDoc,
  loadAllContent,
} from '../src/content/loaders'
import { ContentValidationError } from '../src/content/errors'

type Failure = { file: string; message: string }

function fmtFailure(f: Failure): string {
  return `  ${f.file}\n    ${f.message.replace(/\n/g, '\n    ')}`
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

  for (const show of getAllShows()) {
    const canon = getCanon(show.slug)
    const seasons = getAllSeasons(show.slug)
    const seasonNumbers = new Set(seasons.map((s) => s.number))
    if (canon) {
      for (const entry of canon.entries) {
        if (!seasonNumbers.has(entry.season)) {
          failures.push({
            file: `content/shows/${show.slug}/canon.md`,
            message: `canon entry rank ${entry.rank} references season ${entry.season} but no matching season file exists`,
          })
        }
      }
    }
  }

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

process.exit(main())
