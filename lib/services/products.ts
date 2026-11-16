import { mockProducts } from '../mock-data'
import type { Product, ProductCategory } from '../types'
import { delay, generateId, nowISO } from './_mock'

export async function getProducts(brandId?: string, includeInactive = false): Promise<Product[]> {
  await delay()
  return mockProducts.filter(p =>
    (includeInactive || p.active) &&
    (brandId === undefined || p.brandId === brandId)
  )
}

export async function getProduct(id: string): Promise<Product> {
  await delay()
  const p = mockProducts.find(p => p.id === id)
  if (!p) throw new Error('Product not found.')
  return p
}

export async function createProduct(data: {
  brandId: string
  name: string
  category: ProductCategory
  description?: string
  hsnCode: string
  gstRate: number
  imageUrl?: string
}): Promise<Product> {
  await delay(400)
  const slug = data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const product: Product = { id: generateId(), slug, active: true, createdAt: nowISO(), ...data }
  mockProducts.push(product)
  return product
}

export async function updateProduct(id: string, data: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<Product> {
  await delay(300)
  const idx = mockProducts.findIndex(p => p.id === id)
  if (idx === -1) throw new Error('Product not found.')
  mockProducts[idx] = { ...mockProducts[idx], ...data }
  return mockProducts[idx]
}
