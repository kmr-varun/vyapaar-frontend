import { mockBrands } from '../mock-data'
import type { Brand } from '../types'
import { delay, generateId, nowISO } from './_mock'

export async function getBrands(includeInactive = false): Promise<Brand[]> {
  await delay()
  return mockBrands.filter(b => includeInactive || b.active)
}

export async function getBrand(id: string): Promise<Brand> {
  await delay()
  const b = mockBrands.find(b => b.id === id)
  if (!b) throw new Error('Brand not found.')
  return b
}

export async function createBrand(data: { name: string; logoUrl?: string }): Promise<Brand> {
  await delay(400)
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const brand: Brand = { id: generateId(), slug, active: true, createdAt: nowISO(), ...data }
  mockBrands.push(brand)
  return brand
}

export async function updateBrand(id: string, data: Partial<Pick<Brand, 'name' | 'logoUrl' | 'active'>>): Promise<Brand> {
  await delay(300)
  const idx = mockBrands.findIndex(b => b.id === id)
  if (idx === -1) throw new Error('Brand not found.')
  mockBrands[idx] = { ...mockBrands[idx], ...data }
  return mockBrands[idx]
}
