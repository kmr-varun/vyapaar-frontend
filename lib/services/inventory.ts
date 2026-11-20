import {
  mockStockBalances, mockStockLedger, mockLots, mockOpenedCartons,
  mockPurchases, mockGRNs, mockTransfers, mockAdjustments,
  mockVariants, mockProducts, mockBrands, mockBins, mockRacks,
  mockFloors, mockUnits, mockEstimates, mockSettings,
} from '../mock-data'
import type {
  StockDisplay, StockBalance, Lot, OpenedCarton,
  Purchase, PurchaseLine, GRN, GRNLine,
  StockTransfer, StockAdjustment, StockLedger,
} from '../types'
import { delay, generateId, nowISO } from './_mock'

export async function getStockDisplay(filters?: { unitId?: string; floorId?: string; variantId?: string; brandId?: string }): Promise<StockDisplay[]> {
  await delay()
  return mockStockBalances
    .filter(sb => {
      if (filters?.variantId && sb.variantId !== filters.variantId) return false
      if (filters?.unitId || filters?.floorId) {
        const bin = mockBins.find(b => b.id === sb.binId)
        const rack = bin ? mockRacks.find(r => r.id === bin.rackId) : undefined
        const floor = rack ? mockFloors.find(f => f.id === rack.floorId) : undefined
        if (filters.floorId && floor?.id !== filters.floorId) return false
        if (filters.unitId && floor?.unitId !== filters.unitId) return false
      }
      return true
    })
    .map(sb => {
      const variant = mockVariants.find(v => v.id === sb.variantId)
      const product = variant ? mockProducts.find(p => p.id === variant.productId) : undefined
      const brand = product ? mockBrands.find(b => b.id === product.brandId) : undefined
      const bin = mockBins.find(b => b.id === sb.binId)
      const rack = bin ? mockRacks.find(r => r.id === bin.rackId) : undefined
      const floor = rack ? mockFloors.find(f => f.id === rack.floorId) : undefined
      const unit = floor ? mockUnits.find(u => u.id === floor.unitId) : undefined
      const lot = mockLots.find(l => l.id === sb.lotId)
      const availablePacks = sb.sealedPacks + sb.loosePacks - sb.reservedPacks
      const unitsPerCarton = variant?.unitsPerCarton ?? 1
      return {
        variantId: sb.variantId,
        skuCode: variant?.skuCode ?? '',
        variantLabel: variant ? `${variant.flavour} ${variant.packSize}${variant.packUnit}` : '',
        productName: product?.name ?? '',
        brandName: brand?.name ?? '',
        binCode: bin?.code ?? '',
        binName: bin ? `${rack?.name ?? '—'} · ${bin.name}` : '',
        rackName: rack?.name ?? '',
        binId: sb.binId,
        unitId: unit?.id ?? '',
        unitName: unit?.name ?? '—',
        sealedCartons: Math.floor(sb.sealedPacks / unitsPerCarton),
        loosePacks: sb.loosePacks,
        reservedPacks: sb.reservedPacks,
        availablePacks,
        unitsPerCarton,
        nearestExpiry: lot?.expiry,
      }
    })
    .filter(s => filters?.brandId === undefined || mockProducts.find(p => p.name === s.productName)?.brandId === filters.brandId)
}

export async function getStockBalance(variantId: string): Promise<StockBalance[]> {
  await delay()
  return mockStockBalances.filter(sb => sb.variantId === variantId)
}

export async function getLots(variantId?: string): Promise<Lot[]> {
  await delay()
  return mockLots.filter(l => variantId === undefined || l.variantId === variantId)
}

export async function getOpenedCartons(floorId?: string): Promise<OpenedCarton[]> {
  await delay()
  return mockOpenedCartons.filter(oc => oc.status === 'open')
}

export async function getStockLedger(variantId?: string, binId?: string): Promise<StockLedger[]> {
  await delay()
  return mockStockLedger.filter(sl =>
    (variantId === undefined || sl.variantId === variantId) &&
    (binId === undefined || sl.binId === binId)
  )
}

export async function getPurchases(): Promise<Purchase[]> {
  await delay()
  return [...mockPurchases]
}

export async function getPurchase(id: string): Promise<Purchase> {
  await delay()
  const p = mockPurchases.find(p => p.id === id)
  if (!p) throw new Error('Purchase not found.')
  return p
}

export async function createPurchase(data: Omit<Purchase, 'id' | 'createdAt' | 'status'>): Promise<Purchase> {
  await delay(500)
  const purchase: Purchase = { id: generateId(), status: 'grn-pending', createdAt: nowISO(), ...data }
  mockPurchases.push(purchase)
  return purchase
}

export async function getGRNs(purchaseId?: string): Promise<GRN[]> {
  await delay()
  return mockGRNs.filter(g => purchaseId === undefined || g.purchaseId === purchaseId)
}

export async function createGRN(data: Omit<GRN, 'id' | 'createdAt'>): Promise<GRN> {
  await delay(500)
  const grn: GRN = { id: generateId(), createdAt: nowISO(), ...data }
  mockGRNs.push(grn)
  const pur = mockPurchases.find(p => p.id === data.purchaseId)
  if (pur) pur.status = 'grn-done'
  return grn
}

export async function getTransfers(): Promise<StockTransfer[]> {
  await delay()
  return [...mockTransfers]
}

export async function createTransfer(data: Omit<StockTransfer, 'id' | 'createdAt'>): Promise<StockTransfer> {
  await delay(400)
  const transfer: StockTransfer = { id: generateId(), createdAt: nowISO(), ...data }
  mockTransfers.push(transfer)
  return transfer
}

export async function receiveTransfer(id: string): Promise<StockTransfer> {
  await delay(400)
  const idx = mockTransfers.findIndex(t => t.id === id)
  if (idx === -1) throw new Error('Transfer not found.')
  mockTransfers[idx].status = 'received'
  mockTransfers[idx].receivedAt = nowISO()
  return mockTransfers[idx]
}

export async function getAdjustments(): Promise<StockAdjustment[]> {
  await delay()
  return [...mockAdjustments]
}

export async function createAdjustment(data: Omit<StockAdjustment, 'id' | 'createdAt' | 'status'>): Promise<StockAdjustment> {
  await delay(400)
  const adj: StockAdjustment = { id: generateId(), status: 'pending', createdAt: nowISO(), ...data }
  mockAdjustments.push(adj)
  return adj
}

export async function approveAdjustment(id: string, approverId: string): Promise<StockAdjustment> {
  await delay(400)
  const idx = mockAdjustments.findIndex(a => a.id === id)
  if (idx === -1) throw new Error('Adjustment not found.')
  mockAdjustments[idx].status = 'approved'
  mockAdjustments[idx].approvedBy = approverId
  return mockAdjustments[idx]
}

export async function rejectAdjustment(id: string): Promise<StockAdjustment> {
  await delay(300)
  const idx = mockAdjustments.findIndex(a => a.id === id)
  if (idx === -1) throw new Error('Adjustment not found.')
  mockAdjustments[idx].status = 'rejected'
  return mockAdjustments[idx]
}

export function releaseExpiredStockLocks(): void {
  const now = new Date().toISOString()
  for (const sb of mockStockBalances) {
    if (sb.reservedUntil && sb.reservedUntil < now) {
      sb.reservedPacks = 0
      sb.reservedUntil = undefined
      sb.reservedForEstimateId = undefined
    }
  }
}

export async function reserveStockForEstimate(estimateId: string): Promise<void> {
  await delay(100)
  releaseExpiredStockLocks()
  const estimate = mockEstimates.find(e => e.id === estimateId)
  if (!estimate) return
  const lockHours = mockSettings.stockLockHours ?? 10
  const reservedUntil = new Date(Date.now() + lockHours * 3600 * 1000).toISOString()
  for (const line of estimate.lines) {
    let remaining = line.qtyPacks
    for (const sb of mockStockBalances) {
      if (remaining <= 0) break
      if (sb.variantId !== line.variantId) continue
      const available = sb.sealedPacks + sb.loosePacks - sb.reservedPacks
      if (available <= 0) continue
      const toReserve = Math.min(remaining, available)
      sb.reservedPacks += toReserve
      sb.reservedUntil = reservedUntil
      sb.reservedForEstimateId = estimateId
      remaining -= toReserve
    }
  }
}

export async function releaseStockForEstimate(estimateId: string): Promise<void> {
  await delay(100)
  for (const sb of mockStockBalances) {
    if (sb.reservedForEstimateId === estimateId) {
      sb.reservedPacks = 0
      sb.reservedUntil = undefined
      sb.reservedForEstimateId = undefined
    }
  }
}
