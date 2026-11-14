import { describe, expect, it } from 'vitest'

import { ALL_HANDLES, filterHandles } from './handles'

describe('filterHandles', () => {
  it('keeps valid handles in the given order', () => {
    expect(filterHandles(['br', 'tl'])).toEqual(['br', 'tl'])
    expect(filterHandles(ALL_HANDLES)).toEqual([...ALL_HANDLES])
  })

  it('drops unknown values and duplicates', () => {
    expect(filterHandles(['tl', '', 'xx', 'tl', 3, null])).toEqual(['tl'])
  })

  it('tolerates missing input', () => {
    expect(filterHandles(undefined)).toEqual([])
    expect(filterHandles(null)).toEqual([])
  })
})
