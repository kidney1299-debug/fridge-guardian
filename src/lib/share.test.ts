import { describe, expect, it } from 'vitest'
import { createSampleItems } from '../data'
import { createShareUrl, decodeShareData, encodeShareData, readItemsFromHash } from './share'

describe('가족 공유 링크', () => {
  const items = createSampleItems(new Date(2026, 9, 8))

  it('보관 중인 식재료만 압축하고 다시 복원한다', () => {
    const decoded = decodeShareData(encodeShareData(items))

    expect(decoded).toHaveLength(9)
    expect(decoded.every((item) => item.status === 'active')).toBe(true)
    expect(decoded[0]).toMatchObject({ name: '시금치', category: 'fridge', quantity: 1 })
  })

  it('서버로 전송되지 않는 URL 해시에 공유 데이터를 넣는다', () => {
    const url = createShareUrl(items, 'https://example.com/fridge?old=value')
    const parsed = new URL(url)

    expect(parsed.origin + parsed.pathname).toBe('https://example.com/fridge')
    expect(parsed.search).toBe('')
    expect(parsed.hash).toMatch(/^#share=/)
    expect(readItemsFromHash(parsed.hash)).toHaveLength(9)
  })

  it('손상된 공유 데이터는 거부한다', () => {
    expect(() => decodeShareData('broken-link')).toThrow('공유 링크를 읽을 수 없어요')
  })
})
