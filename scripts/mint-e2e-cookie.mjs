#!/usr/bin/env node
// scripts/mint-e2e-cookie.mjs
//
// Mints OIDC tokens for the `e2e@pantheon.app` Auth0 user via the
// password-realm grant flow, builds the @auth0/nextjs-auth0 v4
// encrypted-session cookie, and caches both at
// `.cache/e2e-cookie.json`. Also upserts CRITIQUE_SESSION_COOKIE
// into `.env` so /critique can read it directly.
//
// Cache shape:
//   {
//     mintedAt, expiresAt,
//     tokens: { accessToken, idToken, refreshToken, expiresIn, ... },
//     user:   { sub, email, ... },
//     cookieName, cookieValue,
//   }
//
// The first three fields are the OIDC tokens themselves; the last
// two are the v4 SDK's encrypted-session cookie shape that
// `apps/e2e/src/auth.ts` reads when it builds Playwright's
// storageState.
//
// Required env (.env):
//   AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET,
//   AUTH0_AUDIENCE, AUTH0_SECRET, E2E_USER_EMAIL, E2E_USER_PASSWORD
//
// One-time dashboard step: enable the "Resource Owner Password"
// grant on the application (Settings -> Advanced -> Grant Types).
// If the mint returns 403 (`unauthorized_client`), that's the
// missing piece. See setup/04_auth0.md Section M.

import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Buffer } from 'node:buffer'
import * as jose from 'jose'
import { hkdf } from '@panva/hkdf'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = resolve(__dirname, '..')

// Best-effort .env loader. Mirrors the pattern in deploy-check.mjs
// so a bare `node scripts/mint-e2e-cookie.mjs` works without a
// wrapper.
function loadDotenv(path = resolve(REPO_ROOT, '.env')) {
  if (!existsSync(path)) return
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/)
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}
loadDotenv()

const CACHE_PATH =
  process.env.E2E_COOKIE_CACHE_PATH ?? resolve(REPO_ROOT, '.cache/e2e-cookie.json')
const ENV_PATH = resolve(REPO_ROOT, '.env')
const ENV_VAR_NAME = 'CRITIQUE_SESSION_COOKIE'
const REFRESH_WINDOW_MS = 5 * 60_000 // re-mint when <= 5 min from expiry

// Auth0 v4 SDK cookie defaults — keep aligned with
// node_modules/@auth0/nextjs-auth0/dist/server/cookies.js + the
// stateless session store. Matters because Playwright's storageState
// must reproduce the cookie *exactly*.
const SDK_COOKIE_NAME = '__session'
const SDK_DIGEST = 'sha256'
const SDK_INFO = 'JWE CEK'
const SDK_BYTE_LENGTH = 32
const SDK_ENC = 'A256GCM'
const SDK_ALG = 'dir'

export function readCache(path = CACHE_PATH) {
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf8'))
  } catch {
    return null
  }
}

export function writeCache(payload, path = CACHE_PATH) {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(payload, null, 2), 'utf8')
}

/**
 * Upsert a single `KEY=VALUE` line in a dotenv file. Replaces the
 * existing line if the key is already present; otherwise appends a
 * marked block at EOF. Used to keep `.env`'s
 * `CRITIQUE_SESSION_COOKIE` in lockstep with the cache so /critique
 * never has to think about cookie freshness.
 */
export function upsertEnvLine(envPath, name, value) {
  const line = `${name}=${value}`
  let content = existsSync(envPath) ? readFileSync(envPath, 'utf8') : ''
  const re = new RegExp(`^${name}=.*$`, 'm')
  if (re.test(content)) {
    content = content.replace(re, line)
  } else {
    if (content && !content.endsWith('\n')) content += '\n'
    content +=
      `\n# managed by scripts/mint-e2e-cookie.mjs — auto-refreshed on each run; do not hand-edit\n${line}\n`
  }
  mkdirSync(dirname(envPath), { recursive: true })
  writeFileSync(envPath, content, 'utf8')
}

export function isFresh(cached, now = Date.now()) {
  if (!cached || !cached.expiresAt || !cached.cookieName || !cached.cookieValue) {
    return false
  }
  const exp = Date.parse(cached.expiresAt)
  if (Number.isNaN(exp)) return false
  return exp - now > REFRESH_WINDOW_MS
}

export async function passwordGrant({
  domain,
  clientId,
  clientSecret,
  audience,
  username,
  password,
  fetchFn = fetch,
} = {}) {
  for (const [k, v] of Object.entries({
    domain,
    clientId,
    clientSecret,
    audience,
    username,
    password,
  })) {
    if (!v) throw new Error(`mint-e2e-cookie: missing ${k}`)
  }
  const res = await fetchFn(`https://${domain}/oauth/token`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      // password-realm grant is the realm-aware variant: works
      // without setting a tenant-level default connection. Requires
      // "Password" grant enabled on the application.
      grant_type: 'http://auth0.com/oauth/grant-type/password-realm',
      username,
      password,
      audience,
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'openid profile email offline_access',
      realm: 'Username-Password-Authentication',
    }),
  })
  const text = await res.text()
  if (!res.ok) {
    let message = text
    try {
      message = JSON.stringify(JSON.parse(text))
    } catch {
      /* leave as-is */
    }
    throw new Error(
      `Auth0 password grant failed (${res.status}): ${message}`,
    )
  }
  const payload = JSON.parse(text)
  return {
    accessToken: payload.access_token,
    idToken: payload.id_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in,
    tokenType: payload.token_type,
    scope: payload.scope,
  }
}

/**
 * Decode an id_token (JWT) without verifying the signature. We only
 * need the user-claim payload to populate the SDK's session.user
 * shape; signature verification is the SDK's job at session-load
 * time, and our session payload is re-encrypted with AUTH0_SECRET.
 */
function decodeJwtPayload(jwt) {
  const parts = jwt.split('.')
  if (parts.length < 2) throw new Error('decodeJwtPayload: malformed JWT')
  const json = Buffer.from(parts[1], 'base64url').toString('utf8')
  return JSON.parse(json)
}

/**
 * Encrypt a SessionData payload with the Auth0 v4 SDK's exact
 * algorithm. Mirrors `cookies.js#encrypt` in
 * node_modules/@auth0/nextjs-auth0/dist/server/cookies.js — keep
 * aligned if the SDK rotates the constants.
 */
export async function encryptSessionCookie(session, secret, expiresAtSec) {
  if (!secret) throw new Error('encryptSessionCookie: missing AUTH0_SECRET')
  const key = await hkdf(SDK_DIGEST, secret, '', SDK_INFO, SDK_BYTE_LENGTH)
  const jwt = await new jose.EncryptJWT(session)
    .setProtectedHeader({ enc: SDK_ENC, alg: SDK_ALG })
    .setExpirationTime(expiresAtSec)
    .encrypt(key)
  return jwt.toString()
}

/**
 * Build the Auth0-v4 SessionData shape from raw OIDC tokens. The
 * shape is documented in @auth0/nextjs-auth0/dist/types/index.d.ts
 * -> SessionData.
 */
export function buildSessionPayload({ tokens, nowSec }) {
  const claims = decodeJwtPayload(tokens.idToken)
  const expiresAtSec = nowSec + tokens.expiresIn
  return {
    user: claims,
    tokenSet: {
      accessToken: tokens.accessToken,
      ...(tokens.idToken ? { idToken: tokens.idToken } : {}),
      ...(tokens.refreshToken ? { refreshToken: tokens.refreshToken } : {}),
      ...(tokens.scope ? { scope: tokens.scope } : {}),
      expiresAt: expiresAtSec,
      ...(tokens.tokenType ? { token_type: tokens.tokenType } : {}),
    },
    internal: {
      sid: claims.sid ?? `e2e-${nowSec}`,
      createdAt: nowSec,
    },
  }
}

export async function mint({
  envOverride = {},
  fetchFn = fetch,
  cachePath = CACHE_PATH,
  now = Date.now(),
} = {}) {
  const cached = readCache(cachePath)
  if (isFresh(cached, now)) {
    return { status: 'cache-hit', payload: cached }
  }

  const env = { ...process.env, ...envOverride }
  const tokens = await passwordGrant({
    domain: env.AUTH0_DOMAIN,
    clientId: env.AUTH0_CLIENT_ID,
    clientSecret: env.AUTH0_CLIENT_SECRET,
    audience: env.AUTH0_AUDIENCE,
    username: env.E2E_USER_EMAIL,
    password: env.E2E_USER_PASSWORD,
    fetchFn,
  })

  const nowSec = Math.floor(now / 1000)
  const session = buildSessionPayload({ tokens, nowSec })
  const expiresAtSec = nowSec + tokens.expiresIn
  const cookieValue = await encryptSessionCookie(session, env.AUTH0_SECRET, expiresAtSec)

  const expiresAt = new Date(now + tokens.expiresIn * 1000).toISOString()
  const payload = {
    runId: 'shared',
    mintedAt: new Date(now).toISOString(),
    expiresAt,
    tokens,
    user: { sub: session.user.sub, email: env.E2E_USER_EMAIL },
    cookieName: SDK_COOKIE_NAME,
    cookieValue,
  }
  writeCache(payload, cachePath)
  return { status: 'minted', payload }
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(__filename)) {
  try {
    const result = await mint()
    const cookieHeader = `${result.payload.cookieName}=${result.payload.cookieValue}`
    upsertEnvLine(ENV_PATH, ENV_VAR_NAME, cookieHeader)
    if (result.status === 'cache-hit') {
      console.log(
        `e2e cookie cache hit (expires ${result.payload.expiresAt}); .env ${ENV_VAR_NAME} synced.`,
      )
    } else {
      console.log(
        `Minted e2e session cookie for ${result.payload.user.email}; cached to ${CACHE_PATH} + .env ${ENV_VAR_NAME} synced.`,
      )
    }
    process.exit(0)
  } catch (err) {
    console.error(err.message ?? err)
    process.exit(1)
  }
}
