// Phase 18 — visually-hidden skip link. Mounts at the top of
// <body> so screen-reader + keyboard users hit it before the
// header nav. Becomes visible on focus.
//
// The target #main is set on <main> in src/app/layout.tsx.

export function SkipToMain() {
  return (
    <a
      href="#main"
      className="skip-to-main"
      data-testid="skip-to-main"
    >
      Skip to main content
    </a>
  )
}
