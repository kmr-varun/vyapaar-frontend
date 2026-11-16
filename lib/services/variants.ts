import { mockVariants } from '../mock-data'
import type { Variant } from '../types'
import { delay, generateId, nowISO } from './_mock'

export async function getVariants(productId?: string, includeInactive = false): Promise<Variant[]> {
  await delay()
  return mockVariants.filter(v =>
    (includeInactive || v.active) &&
    (productId === undefined || v.productId === productId)
  )
}

export async function getVariant(id: string): Promise<Variant> {
  await delay()
  const v = mockVariants.find(v => v.id === id)
  if (!v) throw new Error('Variant not found.')
  return v
}

export async function createVariant(data: {
  productId: string
  flavour: string
  packSize: number
  packUnit: Variant['packUnit']
  mrp: number
  skuCode?: string
  unitsPerCarton: number
  imageUrl?: string
}): Promise<Variant> {
  await delay(400)
  const skuCode = data.skuCode || `SKU-${Date.now()}`
  const variant: Variant = { id: generateId(), active: true, createdAt: nowISO(), skuCode, ...data }
  mockVariants.push(variant)
  return variant
}

export async function updateVariant(id: string, data: Partial<Omit<Variant, 'id' | 'productId' | 'createdAt'>>): Promise<Variant> {
  await delay(300)
  const idx = mockVariants.findIndex(v => v.id === id)
  if (idx === -1) throw new Error('Variant not found.')
  mockVariants[idx] = { ...mockVariants[idx], ...data }
  return mockVariants[idx]
}
