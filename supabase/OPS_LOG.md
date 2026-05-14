# Supabase ops log

> Append-only record of schema operations applied to the
> production Supabase project (`dvdzfugmmivjxzvmpiiq`). Local
> dev runs `supabase db reset` against the embedded Postgres
> from `migrations/` directly, so no log entry needed there.
>
> Format: one ISO date heading, then a list of migrations
> applied (or other ops), then a one-line outcome.

## 2026-05-14 — Initial substrate push (phase 11–13 backfill)

The production Supabase project had no schema at all — empty
`public`, no `supabase_migrations.schema_migrations` table, no
RPCs. Phase 11 / 12 / 13 had been shipping migration files to
the repo without anyone pushing them to prod. The visible
symptom was issue #23 (`/api/vote` returning `rpc_failed —
public.cast_vote missing in schema cache`); the actual scope
was the entire data layer.

Applied (in order), each in a single transaction via
`psql -1`:

- `20260513000001_sessions.sql`
- `20260513000002_claim_anon_session.sql`
- `20260513000003_users.sql`
- `20260513000004_votes.sql`
- `20260513000005_cast_vote_rpc.sql`
- `20260513000006_claim_anon_session_v2.sql`
- `20260513000007_comments.sql`
- `20260513000008_flags.sql`
- `20260513000009_ai_decisions.sql`
- `20260513000010_post_comment_rpc.sql`
- `20260513000011_flag_comment_rpc.sql`
- `20260513000012_users_is_mod.sql`
- `20260513000013_mod_actions.sql`
- `20260513000014_mod_action_rpc.sql`

Followed by `NOTIFY pgrst, 'reload schema'`.

Outcome: `cast_vote` returns `{value, weight, count, persisted}`
end-to-end. `curl -X POST https://pantheon-coral.vercel.app/api/vote`
with a guest cookie returns `{"ok":true,"value":1,"weight":0.1,…}`
— the path the reader hits when they click the vote pair on a
season page. Closes #23.

## Connection notes

- The pooler host for this project is
  `aws-1-us-west-2.pooler.supabase.com` (session mode 5432,
  transaction mode 6543). The runner-default
  `DATABASE_URL` / `DIRECT_URL` env vars currently point at
  `aws-0-us-west-2.pooler.supabase.com`, which returns
  `FATAL: Tenant or user not found`. Code paths that use
  `NEXT_PUBLIC_SUPABASE_URL` + service-role key (the entire
  app, including `/api/vote`) are unaffected — those go via the
  REST API. Only direct-psql tooling needs the corrected host.
- Direct DB host (`db.dvdzfugmmivjxzvmpiiq.supabase.co`)
  resolves to IPv6 only; runners without v6 must use the
  pooler.
