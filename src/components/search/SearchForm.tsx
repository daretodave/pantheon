type SearchFormProps = {
  initialQuery?: string
}

export function SearchForm({ initialQuery = '' }: SearchFormProps) {
  return (
    <form action="/search" method="get" className="flex flex-col gap-2" data-testid="search-form">
      <label htmlFor="search-q" className="text-sm text-ink-2">
        Search Pantheon
      </label>
      <div className="flex gap-2">
        <input
          id="search-q"
          name="q"
          type="search"
          defaultValue={initialQuery}
          placeholder="Type a show, season, or theme"
          className="flex-1 rounded border border-line-soft bg-paper-1 px-3 py-2 text-ink-0 placeholder:text-ink-3"
          autoComplete="off"
          data-testid="search-input"
        />
        <button
          type="submit"
          className="rounded border border-line-soft bg-paper-2 px-4 py-2 text-ink-0 hover:opacity-80"
          data-testid="search-submit"
        >
          Search
        </button>
      </div>
    </form>
  )
}
