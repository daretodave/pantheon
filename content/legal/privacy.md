---
slug: privacy
title: Privacy Policy
description: What we collect, why, and what we don't.
updated: 2026-05-13
---

# Privacy Policy

**Plain version: we collect what we need to run the site, no
more. We don't sell your data. We use first-party analytics
(no cookies, no PII).**

## What we collect

If you visit Pantheon **without signing in**:

- A short-lived HttpOnly cookie holds an anonymous session
  ID so your votes can be counted (rate-limited per IP).
- Your IP address is hashed (SHA-256 with a monthly salt)
  and stored for 30 days. We use this for abuse detection.
  We don't store the raw IP.
- Vercel Web Analytics counts page views aggregated to the
  page level. No cookies, no cross-site tracking, no PII.
  See [Vercel's privacy
  documentation](https://vercel.com/docs/analytics/privacy-policy)
  for details.

If you **sign in**:

- Your email address (used by Auth0 to send you the
  magic-link sign-in email).
- A handle you choose (public).
- The votes you cast and comments you write (linked to your
  account).
- Standard Auth0 metadata for sign-in (timestamps, IP at
  sign-in, browser fingerprint).

## What we don't collect

- We don't ask for your name, address, phone number, or
  payment info.
- We don't use third-party advertising trackers.
- We don't sell or share your data with anyone.
- We don't run third-party analytics beyond Vercel's
  first-party.
- We don't track you across sites.

## How we use it

- **Sign-in email + handle:** to identify your account
  across sessions and credit votes/comments.
- **Hashed IP:** abuse detection (vote brigading,
  rate-limiting). Auto-purged after 30 days.
- **Anonymous session cookie:** counts your votes if you
  haven't signed in. Linked to your account if you sign in
  later (your guest votes follow you).
- **Comments + votes:** displayed on the site, attributed
  to your handle. Public.
- **Page-view analytics:** aggregate insights into which
  pages are slow, which routes 404, which content is
  popular. Aggregate only.

## Where it lives

- Sign-in: [Auth0](https://auth0.com)
- Database (votes, comments, sessions): [Supabase](https://supabase.com)
  (Postgres in `us-west-2`)
- Hosting + analytics: [Vercel](https://vercel.com)
- Comment-content pre-filtering: a third-party processor.
  Submissions are processed server-side at submit time only;
  we don't retain processor conversations beyond the verdict.

We rely on each provider's own data-protection practices. If
you're in the EU/UK and want to know more about a specific
provider, link directly to their privacy policy from the
list above.

## Cookies

- One HttpOnly session cookie (`__pantheon_session`) for
  anonymous voting. 30-day rolling expiry.
- One `__session` cookie set by Auth0 if you sign in.
  Standard authentication cookie.
- No analytics cookies. No advertising cookies.

## Your choices

- **Don't sign in:** read everything, vote anonymously
  (rate-limited), no account exists. To clear your guest
  session, delete cookies for `pantheon-coral.vercel.app`
  in your browser.
- **Delete your account / export your data:** contact paths
  will be added before any public launch. Until then, the
  site is in pre-launch testing.

## Children

Pantheon isn't directed at children under 13. If you believe
we've inadvertently collected data from a child under 13,
contact paths will be added before any public launch.

## Changes

We may change this policy. Material changes will be
date-stamped at the top of this page.

Last updated: 2026-05-13.
