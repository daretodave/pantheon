import { execSync } from 'node:child_process'
import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_URL = `http://127.0.0.1:${PORT}`

// Chain: supabase start → supabase db reset → mint cookie → next start.
// All steps run from the repo root (cwd '../..'). Each step is
// tolerant of absent prerequisites — authed-example self-skips when
// the cookie cache is empty; vote-backend specs need Supabase + the
// phase-11 migrations applied (which `supabase db reset --no-seed`
// handles).
//
// supabase start is idempotent (no-op if already running). On a fresh
// box it can take 60–90s to pull images; the 300s overall timeout
// covers that.
const chain = [
  'supabase start',
  'supabase db reset --no-seed',
  'node scripts/mint-e2e-cookie.mjs',
  'pnpm start',
]

const startCommand =
  process.platform === 'win32'
    ? `cmd /c "${chain.map((c) => `(${c} || echo step failed)`).join(' & ')}"`
    : `sh -c "${chain.map((c) => `(${c} || echo step failed)`).join('; ')}"`

// Read the local-Supabase env from the CLI so we never commit the
// service-role key to the repo. `supabase status -o env` emits
// shell-quoted KEY="value" lines; we parse and lift the secret +
// the URL into webServer.env so the Next.js server talks to the
// local stack (where phase-11 migrations live) rather than the
// remote project URL baked into .env / NEXT_PUBLIC_SUPABASE_URL.
function readLocalSupabaseEnv(): { url: string; key: string } | null {
  try {
    const out = execSync('supabase status -o env', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    const lines = out.split(/\r?\n/)
    const map: Record<string, string> = {}
    for (const line of lines) {
      const m = line.match(/^([A-Z0-9_]+)="(.*)"$/)
      if (m) map[m[1] as string] = m[2] as string
    }
    const url = map['API_URL']
    // Prefer the modern sb_secret_* secret key; fall back to the
    // legacy JWT-style SERVICE_ROLE_KEY if the CLI version still
    // emits that form.
    const key = map['SECRET_KEY'] ?? map['SERVICE_ROLE_KEY']
    if (!url || !key) return null
    return { url, key }
  } catch {
    return null
  }
}

const localSupabase = readLocalSupabaseEnv()

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: 'list',
  timeout: 30_000,
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: startCommand,
    cwd: '../..',
    port: PORT,
    reuseExistingServer: !process.env['CI'],
    timeout: 300_000,
    env: {
      DISABLE_ANALYTICS: '1',
      PLAYWRIGHT_BASE_URL: BASE_URL,
      INTERNAL_DEMOS: '1',
      // Phase 12 — short-circuit the OpenAI pre-filter to its
      // deterministic stub so the e2e leg never makes a network
      // call. Stub rules live in src/lib/openai/preFilter.ts.
      OPENAI_FAKE: '1',
      // SUPABASE_URL (not NEXT_PUBLIC_SUPABASE_URL — that's inlined
      // at build) is the runtime-overridable form. Server-side
      // helper in src/lib/supabase/server.ts prefers SUPABASE_URL
      // when set.
      ...(localSupabase
        ? {
            SUPABASE_URL: localSupabase.url,
            SUPABASE_SERVICE_ROLE_KEY: localSupabase.key,
          }
        : {}),
    },
  },
})
