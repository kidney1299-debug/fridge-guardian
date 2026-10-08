export type StorageCategory = 'fridge' | 'freezer' | 'room'
export type FoodStatus = 'active' | 'used' | 'discarded'

export interface FoodItem {
  id: string
  name: string
  emoji: string
  category: StorageCategory
  quantity: number
  unit: string
  expiryDate: string
  addedAt: string
  status: FoodStatus
  completedAt?: string
}

export interface Recipe {
  id: string
  name: string
  emoji: string
  description: string
  minutes: number
  ingredients: string[]
  tip: string
}

export type AppTab = 'home' | 'inventory' | 'recipes' | 'stats'
