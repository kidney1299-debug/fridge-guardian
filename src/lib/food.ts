import type { FoodItem, FoodStatus, Recipe, StorageCategory } from '../types'

export const categoryLabels: Record<StorageCategory, string> = {
  fridge: '냉장',
  freezer: '냉동',
  room: '실온',
}

export const categoryEmoji: Record<StorageCategory, string> = {
  fridge: '❄️',
  freezer: '🧊',
  room: '🧺',
}

export const statusLabels: Record<FoodStatus, string> = {
  active: '보관 중',
  used: '사용 완료',
  discarded: '폐기',
}

export function toDateString(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setHours(12, 0, 0, 0)
  next.setDate(next.getDate() + days)
  return next
}

export function daysUntil(dateString: string, today = new Date()) {
  const [year, month, day] = dateString.split('-').map(Number)
  const target = new Date(year, month - 1, day)
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.round((target.getTime() - start.getTime()) / 86_400_000)
}

export function expiryLabel(dateString: string, today = new Date()) {
  const days = daysUntil(dateString, today)
  if (days < 0) return `${Math.abs(days)}일 지남`
  if (days === 0) return '오늘까지'
  if (days === 1) return '내일까지'
  return `${days}일 남음`
}

export function expiryTone(dateString: string, today = new Date()) {
  const days = daysUntil(dateString, today)
  if (days < 0) return 'expired'
  if (days <= 2) return 'urgent'
  if (days <= 7) return 'soon'
  return 'fresh'
}

export function sortByExpiry(items: FoodItem[]) {
  return [...items].sort((a, b) => {
    if (a.status !== b.status) return a.status === 'active' ? -1 : b.status === 'active' ? 1 : 0
    if (a.status !== 'active') return (b.completedAt ?? '').localeCompare(a.completedAt ?? '')
    return a.expiryDate.localeCompare(b.expiryDate)
  })
}

export function filterItems(
  items: FoodItem[],
  search: string,
  category: StorageCategory | 'all',
  status: FoodStatus | 'all',
) {
  const query = search.trim().toLocaleLowerCase('ko-KR')
  return sortByExpiry(
    items.filter(
      (item) =>
        (!query || item.name.toLocaleLowerCase('ko-KR').includes(query)) &&
        (category === 'all' || item.category === category) &&
        (status === 'all' || item.status === status),
    ),
  )
}

export function recommendRecipes(items: FoodItem[], recipes: Recipe[]) {
  const available = items
    .filter((item) => item.status === 'active')
    .map((item) => item.name.replace(/\s/g, '').toLocaleLowerCase('ko-KR'))

  return recipes
    .map((recipe) => {
      const matched = recipe.ingredients.filter((ingredient) =>
        available.some((name) => name.includes(ingredient.replace(/\s/g, '').toLocaleLowerCase('ko-KR'))),
      )
      const missing = recipe.ingredients.filter((ingredient) => !matched.includes(ingredient))
      return { ...recipe, matched, missing, score: matched.length / recipe.ingredients.length }
    })
    .filter((recipe) => recipe.matched.length > 0)
    .sort((a, b) => b.score - a.score || b.matched.length - a.matched.length)
}

export function getWasteStats(items: FoodItem[]) {
  const finished = items.filter((item) => item.status !== 'active')
  const used = finished.filter((item) => item.status === 'used').length
  const discarded = finished.filter((item) => item.status === 'discarded').length
  const total = finished.length
  return {
    used,
    discarded,
    total,
    saveRate: total ? Math.round((used / total) * 100) : 0,
    wasteRate: total ? Math.round((discarded / total) * 100) : 0,
  }
}
