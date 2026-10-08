import { addDays, toDateString } from './lib/food'
import type { FoodItem, Recipe } from './types'

export function createSampleItems(today = new Date()): FoodItem[] {
  const added = toDateString(addDays(today, -4))
  return [
    { id: 'sample-1', name: '시금치', emoji: '🥬', category: 'fridge', quantity: 1, unit: '봉', expiryDate: toDateString(addDays(today, 1)), addedAt: added, status: 'active' },
    { id: 'sample-2', name: '두부', emoji: '⬜', category: 'fridge', quantity: 1, unit: '모', expiryDate: toDateString(addDays(today, 2)), addedAt: added, status: 'active' },
    { id: 'sample-3', name: '우유', emoji: '🥛', category: 'fridge', quantity: 1, unit: '팩', expiryDate: toDateString(addDays(today, 4)), addedAt: added, status: 'active' },
    { id: 'sample-4', name: '달걀', emoji: '🥚', category: 'fridge', quantity: 6, unit: '개', expiryDate: toDateString(addDays(today, 8)), addedAt: added, status: 'active' },
    { id: 'sample-5', name: '대파', emoji: '🌿', category: 'fridge', quantity: 2, unit: '대', expiryDate: toDateString(addDays(today, 5)), addedAt: added, status: 'active' },
    { id: 'sample-6', name: '냉동 만두', emoji: '🥟', category: 'freezer', quantity: 1, unit: '봉', expiryDate: toDateString(addDays(today, 45)), addedAt: added, status: 'active' },
    { id: 'sample-7', name: '고등어', emoji: '🐟', category: 'freezer', quantity: 2, unit: '토막', expiryDate: toDateString(addDays(today, 20)), addedAt: added, status: 'active' },
    { id: 'sample-8', name: '감자', emoji: '🥔', category: 'room', quantity: 4, unit: '개', expiryDate: toDateString(addDays(today, 12)), addedAt: added, status: 'active' },
    { id: 'sample-9', name: '양파', emoji: '🧅', category: 'room', quantity: 3, unit: '개', expiryDate: toDateString(addDays(today, 16)), addedAt: added, status: 'active' },
    { id: 'sample-10', name: '버섯', emoji: '🍄', category: 'fridge', quantity: 1, unit: '팩', expiryDate: toDateString(addDays(today, -2)), addedAt: added, status: 'used', completedAt: toDateString(addDays(today, -1)) },
    { id: 'sample-11', name: '바나나', emoji: '🍌', category: 'room', quantity: 2, unit: '개', expiryDate: toDateString(addDays(today, -5)), addedAt: added, status: 'discarded', completedAt: toDateString(addDays(today, -3)) },
    { id: 'sample-12', name: '닭가슴살', emoji: '🍗', category: 'freezer', quantity: 2, unit: '팩', expiryDate: toDateString(addDays(today, 10)), addedAt: added, status: 'used', completedAt: toDateString(addDays(today, -2)) },
  ]
}

export const recipes: Recipe[] = [
  { id: 'r1', name: '시금치 두부 된장국', emoji: '🍲', description: '따뜻하고 든든한 한 그릇', minutes: 20, ingredients: ['시금치', '두부', '대파'], tip: '시금치는 마지막에 넣어야 색이 예뻐요.' },
  { id: 'r2', name: '감자 달걀 볶음', emoji: '🍳', description: '냉장고 털이에 딱 좋은 반찬', minutes: 15, ingredients: ['감자', '달걀', '대파'], tip: '감자는 얇게 썰면 더 빨리 익어요.' },
  { id: 'r3', name: '고등어 양파 조림', emoji: '🐟', description: '밥 한 공기가 뚝딱', minutes: 30, ingredients: ['고등어', '양파', '대파'], tip: '무가 있다면 바닥에 깔아도 좋아요.' },
  { id: 'r4', name: '바삭 만두 달걀전', emoji: '🥟', description: '간단하지만 근사한 한 끼', minutes: 12, ingredients: ['냉동 만두', '달걀', '대파'], tip: '약불에서 뚜껑을 덮어 속까지 익혀요.' },
  { id: 'r5', name: '양파 감자 수프', emoji: '🥣', description: '부드럽고 포근한 수프', minutes: 25, ingredients: ['양파', '감자', '우유'], tip: '우유는 끓기 직전에 불을 줄여 주세요.' },
]
