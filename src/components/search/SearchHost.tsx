'use client'

import { useCallback, useEffect, useState } from 'react'
import { SearchOverlay } from './SearchOverlay'
import { SEARCH_OPEN_EVENT } from './events'
import type { SearchIndexItem } from '@/lib/searchIndex'

type SearchHostProps = {
  items: readonly SearchIndexItem[]
}

// Mounted once per layout. Owns the overlay open/close state; the
// header trigger and the cmd+K listener both flow through here.
export function SearchHost({ items }: SearchHostProps) {
  const [open, setOpen] = useState(false)

  const close = useCallback(() => setOpen(false), [])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(SEARCH_OPEN_EVENT, onOpen as EventListener)
    return () => {
      window.removeEventListener(SEARCH_OPEN_EVENT, onOpen as EventListener)
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isModK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k'
      if (!isModK) return
      e.preventDefault()
      setOpen((prev) => !prev)
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return <SearchOverlay items={items} open={open} onClose={close} />
}
