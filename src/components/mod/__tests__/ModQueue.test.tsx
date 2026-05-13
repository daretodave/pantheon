import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ModQueueItem } from '@/lib/supabase/mod'
import { ModQueue } from '../ModQueue'

const sampleItem: ModQueueItem = {
  id: '00000000-0000-0000-0000-000000000001',
  parentId: null,
  targetType: 'season',
  targetId: 'survivor:1',
  body: 'Sample comment body for testing.',
  status: 'pending',
  createdAt: '2026-05-13T00:00:00.000Z',
  flagCount: 0,
}

describe('<ModQueue>', () => {
  it('renders an empty-state hint when there are no items', () => {
    render(<ModQueue items={[]} />)
    expect(screen.getByTestId('mod-queue-empty')).toBeTruthy()
  })

  it('renders one item per comment with status + body', () => {
    render(<ModQueue items={[sampleItem]} />)
    const items = screen.getAllByTestId('mod-queue-item')
    expect(items.length).toBe(1)
    expect(items[0]?.dataset['commentId']).toBe(sampleItem.id)
    expect(items[0]?.dataset['status']).toBe('pending')
    expect(screen.getByTestId('mod-queue-body').textContent).toContain('Sample comment body')
  })

  it('shows flag count badge when flagCount > 0', () => {
    render(<ModQueue items={[{ ...sampleItem, flagCount: 3 }]} />)
    const item = screen.getAllByTestId('mod-queue-item')[0]
    expect(item?.dataset['flagCount']).toBe('3')
    expect(item?.textContent).toContain('3 flags')
  })

  it('singular flag noun for flagCount=1', () => {
    render(<ModQueue items={[{ ...sampleItem, flagCount: 1 }]} />)
    const item = screen.getAllByTestId('mod-queue-item')[0]
    expect(item?.textContent).toContain('1 flag')
    expect(item?.textContent).not.toContain('1 flags')
  })
})
