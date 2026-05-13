import Link from 'next/link'

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-2xl flex-col items-start gap-4 px-6 py-24">
      <h1 className="font-serif text-3xl text-ink-0">Not found.</h1>
      <p className="text-ink-2">
        The page you&rsquo;re looking for hasn&rsquo;t been built yet, or never existed.
      </p>
      <Link
        href="/"
        className="text-primary-base underline-offset-4 hover:underline"
      >
        Back to pantheon
      </Link>
    </section>
  )
}
