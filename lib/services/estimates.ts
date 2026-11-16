import { mockEstimates, mockOrders } from '../mock-data'
import type { Estimate, EstimateLine, EstimateStatus, PaymentMode } from '../types'
import { delay, generateId, nowISO } from './_mock'

function estimateNumber(version: number): string {
  const d = new Date()
  const yymm = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`
  const seq = String(mockEstimates.length + 1).padStart(5, '0')
  const base = `EST-${yymm}-${seq}`
  return version > 1 ? `${base}/v${version}` : base
}

function randomToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return 'tk_' + Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function getEstimates(orderId?: string): Promise<Estimate[]> {
  await delay()
  return mockEstimates.filter(e => orderId === undefined || e.orderId === orderId)
}

export async function getEstimate(id: string): Promise<Estimate> {
  await delay()
  const e = mockEstimates.find(e => e.id === id)
  if (!e) throw new Error('Estimate not found.')
  return e
}

export async function getEstimateByToken(token: string): Promise<Estimate> {
  await delay()
  const e = mockEstimates.find(e => e.token === token)
  if (!e) throw new Error('Estimate not found or link has expired.')
  return e
}

export async function createEstimate(orderId: string, lines: Omit<EstimateLine, 'id' | 'estimateId'>[], paymentMode: PaymentMode, taxInclusive: boolean, validityDays: number): Promise<Estimate> {
  await delay(500)
  const totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0)
  const totalGst = lines.reduce((s, l) => s + l.gstAmount, 0)
  const estimate: Estimate = {
    id: generateId(),
    orderId,
    number: estimateNumber(1),
    version: 1,
    status: 'draft',
    paymentMode,
    taxInclusive,
    token: randomToken(),
    validUntil: new Date(Date.now() + validityDays * 86400 * 1000).toISOString(),
    lines: lines.map(l => ({ ...l, id: generateId(), estimateId: '' })),
    totalAmount,
    totalGst,
    createdBy: 'u1',
    createdAt: nowISO(),
  }
  estimate.lines.forEach(l => { l.estimateId = estimate.id })
  mockEstimates.push(estimate)
  return estimate
}

export async function updateEstimateLines(id: string, lines: Omit<EstimateLine, 'id' | 'estimateId'>[]): Promise<Estimate> {
  await delay(400)
  const idx = mockEstimates.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Estimate not found.')
  const e = mockEstimates[idx]
  e.lines = lines.map(l => ({ ...l, id: generateId(), estimateId: e.id }))
  e.totalAmount = lines.reduce((s, l) => s + l.lineTotal, 0)
  e.totalGst = lines.reduce((s, l) => s + l.gstAmount, 0)
  const allPriced = lines.every(l => l.pricePerPack !== undefined && l.pricePerPack > 0)
  e.status = allPriced ? 'priced' : 'draft'
  return e
}

export async function sendEstimate(id: string): Promise<Estimate> {
  await delay(600)
  const idx = mockEstimates.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Estimate not found.')
  const e = mockEstimates[idx]
  if (e.status !== 'priced') throw new Error('Estimate must be fully priced before sending.')
  e.status = 'sent'
  const order = mockOrders.find(o => o.id === e.orderId)
  if (order) order.status = 'estimate-sent'
  return e
}

export async function reviseEstimate(id: string): Promise<Estimate> {
  await delay(500)
  const original = mockEstimates.find(e => e.id === id)
  if (!original) throw new Error('Estimate not found.')
  original.status = 'replaced'
  const revised: Estimate = {
    ...original,
    id: generateId(),
    version: original.version + 1,
    number: estimateNumber(original.version + 1),
    status: 'draft',
    token: randomToken(),
    validUntil: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
    createdAt: nowISO(),
    lines: original.lines.map(l => ({ ...l, id: generateId() })),
  }
  mockEstimates.push(revised)
  return revised
}

export async function refreshExpiredEstimate(id: string): Promise<Estimate> {
  await delay(400)
  const idx = mockEstimates.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Estimate not found.')
  mockEstimates[idx].status = 'draft'
  mockEstimates[idx].validUntil = new Date(Date.now() + 7 * 86400 * 1000).toISOString()
  return mockEstimates[idx]
}
