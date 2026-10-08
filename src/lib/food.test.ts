import { describe, expect, it } from 'vitest'
import { createSampleItems, recipes } from '../data'
import { daysUntil, filterItems, getWasteStats, recommendRecipes } from './food'

const today = new Date(2026, 9, 8)

describe('식재료 도메인 로직', () => {
  it('유통기한까지 남은 날짜를 달력 기준으로 계산한다', () => {
    expect(daysUntil('2026-10-08', today)).toBe(0)
    expect(daysUntil('2026-10-10', today)).toBe(2)
    expect(daysUntil('2026-10-07', today)).toBe(-1)
  })

  it('검색과 분류 필터를 적용하고 기한 임박 순으로 정렬한다', () => {
    const items = createSampleItems(today)
    const result = filterItems(items, '', 'fridge', 'active')

    expect(result.every((item) => item.category === 'fridge' && item.status === 'active')).toBe(true)
    expect(result.map((item) => item.name).slice(0, 2)).toEqual(['시금치', '두부'])
    expect(filterItems(items, '우유', 'all', 'active')).toHaveLength(1)
  })

  it('보유 재료가 많이 겹치는 요리를 우선 추천한다', () => {
    const result = recommendRecipes(createSampleItems(today), recipes)

    expect(result[0].score).toBe(1)
    expect(result[0].matched).toHaveLength(result[0].ingredients.length)
  })

  it('사용 및 폐기 비율을 계산한다', () => {
    const stats = getWasteStats(createSampleItems(today))
    expect(stats).toMatchObject({ used: 2, discarded: 1, total: 3, saveRate: 67, wasteRate: 33 })
  })
})
