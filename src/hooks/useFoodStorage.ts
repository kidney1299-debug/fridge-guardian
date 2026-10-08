import { useEffect, useState } from 'react'
import { createSampleItems } from '../data'
import { itemIdentity } from '../lib/share'
import type { FoodItem } from '../types'

const STORAGE_KEY = 'fridge-guardian-items-v1'

function initialItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return JSON.parse(saved) as FoodItem[]
  } catch {
    // 손상된 브라우저 데이터는 안전한 샘플로 복구합니다.
  }
  return createSampleItems()
}

export function useFoodStorage() {
  const [items, setItems] = useState<FoodItem[]>(initialItems)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<FoodItem, 'id' | 'addedAt' | 'status'>) => {
    setItems((current) => [
      ...current,
      {
        ...item,
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`,
        addedAt: new Date().toISOString().slice(0, 10),
        status: 'active',
      },
    ])
  }

  const finishItem = (id: string, status: 'used' | 'discarded') => {
    setItems((current) =>
      current.map((item) =>
        item.id === id
          ? { ...item, status, completedAt: new Date().toISOString().slice(0, 10) }
          : item,
      ),
    )
  }

  const mergeItems = (incoming: FoodItem[]) => {
    const ids = new Set(items.map((item) => item.id))
    const identities = new Set(items.filter((item) => item.status === 'active').map(itemIdentity))
    const additions = incoming.filter((item) => {
      if (ids.has(item.id) || identities.has(itemIdentity(item))) return false
      ids.add(item.id)
      identities.add(itemIdentity(item))
      return true
    })
    if (additions.length) setItems((current) => [...current, ...additions])
    return { added: additions.length, skipped: incoming.length - additions.length }
  }

  const resetSamples = () => setItems(createSampleItems())

  return { items, addItem, finishItem, mergeItems, resetSamples }
}
