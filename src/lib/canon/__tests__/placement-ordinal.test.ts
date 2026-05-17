import { describe, expect, it } from 'vitest'
import {
  extractPlacementOrdinal,
  numberToPlacementOrdinal,
} from '../placement-ordinal'

describe('numberToPlacementOrdinal', () => {
  it('renders ones, teens, tens, and compounds', () => {
    expect(numberToPlacementOrdinal(1)).toBe('first')
    expect(numberToPlacementOrdinal(2)).toBe('second')
    expect(numberToPlacementOrdinal(3)).toBe('third')
    expect(numberToPlacementOrdinal(5)).toBe('fifth')
    expect(numberToPlacementOrdinal(9)).toBe('ninth')
    expect(numberToPlacementOrdinal(12)).toBe('twelfth')
    expect(numberToPlacementOrdinal(19)).toBe('nineteenth')
    expect(numberToPlacementOrdinal(20)).toBe('twentieth')
    expect(numberToPlacementOrdinal(21)).toBe('twenty-first')
    expect(numberToPlacementOrdinal(30)).toBe('thirtieth')
    expect(numberToPlacementOrdinal(38)).toBe('thirty-eighth')
    expect(numberToPlacementOrdinal(40)).toBe('fortieth')
    expect(numberToPlacementOrdinal(47)).toBe('forty-seventh')
  })

  it('returns null out of range', () => {
    expect(numberToPlacementOrdinal(0)).toBeNull()
    expect(numberToPlacementOrdinal(60)).toBeNull()
    expect(numberToPlacementOrdinal(1.5)).toBeNull()
  })
})

describe('extractPlacementOrdinal', () => {
  it('reads the "canon places it <ordinal>" marker', () => {
    expect(
      extractPlacementOrdinal('The canon places it twelfth because the show.'),
    ).toBe(12)
  })

  it('reads a named-subject placement across a line wrap', () => {
    expect(
      extractPlacementOrdinal(
        'detail. The canon places China\nthirteenth because the season earns its rank.',
      ),
    ).toBe(13)
  })

  it('reads the "earns the <ordinal> slot" form', () => {
    expect(
      extractPlacementOrdinal('Borneo earns the third slot as the document.'),
    ).toBe(3)
  })

  it('reads compound ordinals', () => {
    expect(
      extractPlacementOrdinal('The canon places Samoa twenty-fifth because.'),
    ).toBe(25)
  })

  it('reads the tiered.tv places marker', () => {
    expect(
      extractPlacementOrdinal('tiered.tv places it ninth because the relaunch.'),
    ).toBe(9)
  })

  it('ignores season-number ordinals before the placement marker', () => {
    // "the nineteenth season" is a season ref, not the placement.
    expect(
      extractPlacementOrdinal(
        'The nineteenth season camps on Upolu. The canon places Samoa twenty-fifth because the footprint is real.',
      ),
    ).toBe(25)
  })

  it('reads the definitive sentence, not an earlier non-numeric one', () => {
    // The Amazing Race pattern: opens "places it where the concept
    // lands", states the slot later. Stray "first-ever" must not win.
    expect(
      extractPlacementOrdinal(
        'Season 28 stocked its field, and the canon places it where the concept lands. The route had first-ever stops in Colombia. The canon places it twenty-fifth because the concept is a casting tweak.',
      ),
    ).toBe(25)
  })

  it('returns null for a non-numeric placement ("last", "mid-canon")', () => {
    expect(
      extractPlacementOrdinal(
        'Season six is the detour, and the canon places it last for editorial reasons rather than punitive ones.',
      ),
    ).toBeNull()
    expect(
      extractPlacementOrdinal(
        'tiered.tv places the season mid-canon because the casting energy is real but the format choices are familiar.',
      ),
    ).toBeNull()
  })

  it('does not match an ordinal embedded in a larger word', () => {
    expect(
      extractPlacementOrdinal('The canon ranks it thirdly, oddly phrased.'),
    ).toBeNull()
  })

  it('returns null when no placement sentence exists', () => {
    expect(
      extractPlacementOrdinal('A season the canon weighs honestly.'),
    ).toBeNull()
  })
})
