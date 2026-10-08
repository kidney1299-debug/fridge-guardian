import { strFromU8, strToU8, unzlibSync, zlibSync } from 'fflate'
import type { FoodItem, StorageCategory } from '../types'

const SHARE_KEY = 'share'
const MAX_SHARED_ITEMS = 200
const categories: StorageCategory[] = ['fridge', 'freezer', 'room']

type CompactItem = [string, string, string, StorageCategory, number, string, string, string]
type SharePayload = { v: 1; i: CompactItem[] }

function toBase64Url(bytes: Uint8Array) {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '')
}

function fromBase64Url(value: string) {
  const base64 = value.replaceAll('-', '+').replaceAll('_', '/')
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
  const binary = atob(padded)
  return Uint8Array.from(binary, (character) => character.charCodeAt(0))
}

function isSafeText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= max
}

function isDate(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
}

function isCompactItem(value: unknown): value is CompactItem {
  if (!Array.isArray(value) || value.length !== 8) return false
  const [id, name, emoji, category, quantity, unit, expiryDate, addedAt] = value
  return (
    isSafeText(id, 100) &&
    isSafeText(name, 80) &&
    isSafeText(emoji, 20) &&
    categories.includes(category as StorageCategory) &&
    typeof quantity === 'number' &&
    Number.isFinite(quantity) &&
    quantity > 0 &&
    quantity <= 100_000 &&
    isSafeText(unit, 20) &&
    isDate(expiryDate) &&
    isDate(addedAt)
  )
}

export function encodeShareData(items: FoodItem[]) {
  const active = items.filter((item) => item.status === 'active').slice(0, MAX_SHARED_ITEMS)
  const payload: SharePayload = {
    v: 1,
    i: active.map((item) => [item.id, item.name, item.emoji, item.category, item.quantity, item.unit, item.expiryDate, item.addedAt]),
  }
  return toBase64Url(zlibSync(strToU8(JSON.stringify(payload)), { level: 9 }))
}

export function decodeShareData(encoded: string): FoodItem[] {
  if (!encoded || encoded.length > 50_000) throw new Error('올바르지 않은 공유 링크예요.')
  try {
    const payload = JSON.parse(strFromU8(unzlibSync(fromBase64Url(encoded)))) as Partial<SharePayload>
    if (payload.v !== 1 || !Array.isArray(payload.i) || payload.i.length === 0 || payload.i.length > MAX_SHARED_ITEMS || !payload.i.every(isCompactItem)) {
      throw new Error('invalid payload')
    }
    return payload.i.map(([id, name, emoji, category, quantity, unit, expiryDate, addedAt]) => ({
      id,
      name,
      emoji,
      category,
      quantity,
      unit,
      expiryDate,
      addedAt,
      status: 'active',
    }))
  } catch {
    throw new Error('공유 링크를 읽을 수 없어요. 링크가 잘리지 않았는지 확인해 주세요.')
  }
}

export function createShareUrl(items: FoodItem[], currentUrl = window.location.href) {
  const url = new URL(currentUrl)
  url.search = ''
  url.hash = `${SHARE_KEY}=${encodeShareData(items)}`
  return url.toString()
}

export function readItemsFromHash(hash = window.location.hash) {
  const encoded = new URLSearchParams(hash.replace(/^#/, '')).get(SHARE_KEY)
  return encoded ? decodeShareData(encoded) : null
}

export function clearShareHash() {
  if (!window.location.hash.startsWith(`#${SHARE_KEY}=`)) return
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`)
}

export function itemIdentity(item: FoodItem) {
  return `${item.name.trim().toLocaleLowerCase('ko-KR')}|${item.category}|${item.expiryDate}`
}
