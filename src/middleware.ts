import { NextResponse, type NextRequest } from 'next/server'
import { auth0 } from '@/lib/auth0'
import {
  ANON_COOKIE_MAX_AGE_SEC,
  ANON_COOKIE_NAME,
  generateAnonId,
  isValidAnonId,
} from '@/lib/anonSession'

// Middleware composes two behaviors:
//  1. Auth0 SDK middleware — mounts /auth/login, /auth/logout,
//     /auth/callback, /auth/profile, /auth/access-token. Reads
//     the __session cookie and refreshes the access token if
//     needed. Returns a response that either redirects (auth
//     route) or passes through (everything else).
//  2. Anon-guest cookie issuance — for any pass-through response,
//     if the request lacks a valid `tiered_anon_id` cookie, mint
//     one and set it on the response. HttpOnly + SameSite=Lax.
//
// The Supabase `sessions` row is NOT created here — the middleware
// only stamps the cookie. Lazy row creation happens at first vote /
// first comment, when we have an RPC + service-role context to
// insert without RLS friction (see migration 20260513000001_sessions).

export async function middleware(request: NextRequest): Promise<NextResponse> {
  // Phase 29 — /search retired in favor of the cmd+K overlay.
  // Permanent redirect so external links land somewhere sensible.
  if (request.nextUrl.pathname === '/search') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    url.search = ''
    return NextResponse.redirect(url, 308)
  }

  const auth0Response = await auth0.middleware(request)

  // Auth-route paths return a redirect / 200 directly — don't stamp
  // an anon cookie on those (the SDK is mid-handshake).
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return auth0Response
  }

  const existing = request.cookies.get(ANON_COOKIE_NAME)?.value
  if (isValidAnonId(existing)) {
    return auth0Response
  }

  const id = generateAnonId()
  auth0Response.cookies.set({
    name: ANON_COOKIE_NAME,
    value: id,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env['NODE_ENV'] === 'production',
    path: '/',
    maxAge: ANON_COOKIE_MAX_AGE_SEC,
  })
  return auth0Response
}

export const config = {
  // Skip Next internals + static assets. Everything else (pages,
  // API routes, auth routes) flows through.
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.svg$|.*\\.png$|.*\\.ico$|.*\\.json$|.*\\.txt$).*)',
  ],
}
