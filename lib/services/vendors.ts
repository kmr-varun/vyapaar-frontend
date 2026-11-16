import { mockVendors, mockVendorPriceRules } from '../mock-data'
import type { Vendor, VendorPriceRule } from '../types'
import { delay, generateId, nowISO } from './_mock'

export async function getVendors(includeInactive = false): Promise<Vendor[]> {
  await delay()
  return mockVendors.filter(v => includeInactive || v.active)
}

export async function getVendor(id: string): Promise<Vendor> {
  await delay()
  const v = mockVendors.find(v => v.id === id)
  if (!v) throw new Error('Vendor not found.')
  return v
}

export async function createVendor(data: Omit<Vendor, 'id' | 'active' | 'createdAt'>): Promise<Vendor> {
  await delay(400)
  const vendor: Vendor = { id: generateId(), active: true, createdAt: nowISO(), ...data }
  mockVendors.push(vendor)
  return vendor
}

export async function updateVendor(id: string, data: Partial<Omit<Vendor, 'id' | 'createdAt'>>): Promise<Vendor> {
  await delay(300)
  const idx = mockVendors.findIndex(v => v.id === id)
  if (idx === -1) throw new Error('Vendor not found.')
  mockVendors[idx] = { ...mockVendors[idx], ...data }
  return mockVendors[idx]
}

export async function getVendorPriceRules(variantId?: string): Promise<VendorPriceRule[]> {
  await delay()
  return mockVendorPriceRules.filter(r => variantId === undefined || r.variantId === variantId)
}

export async function createVendorPriceRule(data: Omit<VendorPriceRule, 'id'>): Promise<VendorPriceRule> {
  await delay(400)
  const rule: VendorPriceRule = { id: generateId(), ...data }
  mockVendorPriceRules.push(rule)
  return rule
}

export async function updateVendorPriceRule(id: string, data: Partial<VendorPriceRule>): Promise<VendorPriceRule> {
  await delay(300)
  const idx = mockVendorPriceRules.findIndex(r => r.id === id)
  if (idx === -1) throw new Error('Price rule not found.')
  mockVendorPriceRules[idx] = { ...mockVendorPriceRules[idx], ...data }
  return mockVendorPriceRules[idx]
}
