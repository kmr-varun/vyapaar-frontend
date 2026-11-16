import { mockPickLists, mockCartonOpenRequests, mockRemainingDeclarations, mockPackages } from '../mock-data'
import type { PickList, PickLine, CartonOpenRequest, RemainingDeclaration, Package } from '../types'
import { delay, generateId, nowISO } from './_mock'

export async function getPickLists(floorId?: string, orderId?: string): Promise<PickList[]> {
  await delay()
  return mockPickLists.filter(pl =>
    (floorId === undefined || pl.floorId === floorId) &&
    (orderId === undefined || pl.orderId === orderId)
  )
}

export async function getPickList(id: string): Promise<PickList> {
  await delay()
  const pl = mockPickLists.find(pl => pl.id === id)
  if (!pl) throw new Error('Pick list not found.')
  return pl
}

export async function confirmPickLine(pickListId: string, lineId: string, data: { pickedCartons: number; pickedPacks: number; shortReason?: string }): Promise<PickLine> {
  await delay(400)
  const pl = mockPickLists.find(p => p.id === pickListId)
  if (!pl) throw new Error('Pick list not found.')
  const lineIdx = pl.lines.findIndex(l => l.id === lineId)
  if (lineIdx === -1) throw new Error('Pick line not found.')
  pl.lines[lineIdx] = { ...pl.lines[lineIdx], ...data, status: data.shortReason ? 'short' : 'picked' }
  const allDone = pl.lines.every(l => l.status !== 'pending')
  if (allDone) pl.status = 'picked'
  return pl.lines[lineIdx]
}

export async function createCartonOpenRequest(data: Omit<CartonOpenRequest, 'id' | 'createdAt' | 'status'>): Promise<CartonOpenRequest> {
  await delay(400)
  const req: CartonOpenRequest = { id: generateId(), status: 'pending', createdAt: nowISO(), ...data }
  mockCartonOpenRequests.push(req)
  return req
}

export async function getCartonOpenRequests(orderId?: string): Promise<CartonOpenRequest[]> {
  await delay()
  return mockCartonOpenRequests.filter(r => orderId === undefined || r.orderId === orderId)
}

export async function approveCartonOpenRequest(id: string, approverId: string): Promise<CartonOpenRequest> {
  await delay(400)
  const idx = mockCartonOpenRequests.findIndex(r => r.id === id)
  if (idx === -1) throw new Error('Request not found.')
  mockCartonOpenRequests[idx].status = 'approved'
  mockCartonOpenRequests[idx].approvedBy = approverId
  return mockCartonOpenRequests[idx]
}

export async function rejectCartonOpenRequest(id: string): Promise<CartonOpenRequest> {
  await delay(300)
  const idx = mockCartonOpenRequests.findIndex(r => r.id === id)
  if (idx === -1) throw new Error('Request not found.')
  mockCartonOpenRequests[idx].status = 'rejected'
  return mockCartonOpenRequests[idx]
}

export async function createRemainingDeclaration(data: Omit<RemainingDeclaration, 'id' | 'createdAt' | 'status'>): Promise<RemainingDeclaration> {
  await delay(400)
  const decl: RemainingDeclaration = { id: generateId(), status: 'pending', createdAt: nowISO(), ...data }
  mockRemainingDeclarations.push(decl)
  return decl
}

export async function getRemainingDeclarations(): Promise<RemainingDeclaration[]> {
  await delay()
  return [...mockRemainingDeclarations]
}

export async function confirmRemainingDeclaration(id: string, confirmerId: string): Promise<RemainingDeclaration> {
  await delay(400)
  const idx = mockRemainingDeclarations.findIndex(d => d.id === id)
  if (idx === -1) throw new Error('Declaration not found.')
  mockRemainingDeclarations[idx].status = 'confirmed'
  mockRemainingDeclarations[idx].confirmedBy = confirmerId
  return mockRemainingDeclarations[idx]
}

export async function createPackage(data: Omit<Package, 'id' | 'status'>): Promise<Package> {
  await delay(400)
  const pkg: Package = { id: generateId(), status: 'packing', ...data }
  mockPackages.push(pkg)
  return pkg
}

export async function markPackagePacked(id: string): Promise<Package> {
  await delay(300)
  const idx = mockPackages.findIndex(p => p.id === id)
  if (idx === -1) throw new Error('Package not found.')
  mockPackages[idx].status = 'packed'
  mockPackages[idx].packedAt = nowISO()
  return mockPackages[idx]
}

export async function getPackages(orderId?: string): Promise<Package[]> {
  await delay()
  return mockPackages.filter(p => orderId === undefined || p.orderId === orderId)
}
