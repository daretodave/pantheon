// scripts/lib/triage-labels.mjs
//
// The 13 canonical labels the /triage skill expects to exist
// on the repo. Source of truth for both create-triage-labels.mjs
// (creates / updates them) and check-triage-labels.mjs
// (verifies the set is present).
//
// Categories:
// - status (4) — applied to every triaged issue (mutually
//   exclusive within an issue).
// - category (8) — paired with `triage:loop-queued`.
// - P0 (1) — spoiler. Always reserved. Per bearings §Spoiler
//   ambiguity ("when in doubt, redact").

export const CANONICAL_LABELS = [
  // Status
  {
    name: 'triage:loop-queued',
    description: 'Triaged: the loop will address',
    color: 'bfd4f2',
  },
  {
    name: 'triage:needs-user',
    description: 'Triaged: actionable but requires user judgment',
    color: 'd4c5f9',
  },
  {
    name: 'triage:closed',
    description: 'Triaged: won\'t fix / duplicate / spam',
    color: 'e6e6e6',
  },
  {
    name: 'triage:reviewed',
    description: 'Triaged: seen but no action this pass',
    color: 'f0f0f0',
  },

  // Category
  { name: 'bug', description: 'Something is broken', color: 'd73a4a' },
  { name: 'enhancement', description: 'New feature or request', color: 'a2eeef' },
  { name: 'content', description: 'Editorial / blurb / canon content', color: 'fef2c0' },
  { name: 'data', description: 'Show or season data correction', color: '5319e7' },
  { name: 'docs', description: 'Documentation', color: '0075ca' },
  { name: 'seo', description: 'SEO', color: 'c5def5' },
  { name: 'a11y', description: 'Accessibility', color: '7057ff' },
  { name: 'perf', description: 'Performance', color: 'fbca04' },

  // P0
  {
    name: 'spoiler',
    description: 'Spoiler reported - P0, hide pending fix',
    color: 'b60205',
  },
]

export function canonicalNames() {
  return CANONICAL_LABELS.map((l) => l.name)
}

export function diffLabels(actualNames) {
  const expected = new Set(canonicalNames())
  const actual = new Set(actualNames)
  const missing = [...expected].filter((n) => !actual.has(n)).sort()
  const extra = [...actual].filter((n) => !expected.has(n)).sort()
  return { missing, extra }
}
