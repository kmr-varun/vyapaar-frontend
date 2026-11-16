import { mockUnits, mockFloors, mockRacks, mockBins, mockStockBalances } from '../mock-data'
import type { Unit, Floor, Rack, Bin } from '../types'
import { delay, generateId } from './_mock'

export async function getUnits(): Promise<Unit[]> {
  await delay()
  return [...mockUnits]
}

export async function createUnit(data: Omit<Unit, 'id'>): Promise<Unit> {
  await delay(400)
  const unit: Unit = { id: generateId(), ...data }
  mockUnits.push(unit)
  return unit
}

export async function updateUnit(id: string, data: Partial<Omit<Unit, 'id'>>): Promise<Unit> {
  await delay(300)
  const idx = mockUnits.findIndex(u => u.id === id)
  if (idx === -1) throw new Error('Unit not found.')
  mockUnits[idx] = { ...mockUnits[idx], ...data }
  return mockUnits[idx]
}

export async function getFloors(unitId?: string): Promise<Floor[]> {
  await delay()
  return mockFloors.filter(f => unitId === undefined || f.unitId === unitId)
}

export async function createFloor(data: Omit<Floor, 'id'>): Promise<Floor> {
  await delay(400)
  const floor: Floor = { id: generateId(), ...data }
  mockFloors.push(floor)
  return floor
}

export async function updateFloor(id: string, data: Partial<Omit<Floor, 'id'>>): Promise<Floor> {
  await delay(300)
  const idx = mockFloors.findIndex(f => f.id === id)
  if (idx === -1) throw new Error('Floor not found.')
  mockFloors[idx] = { ...mockFloors[idx], ...data }
  return mockFloors[idx]
}

export async function getRacks(floorId?: string): Promise<Rack[]> {
  await delay()
  return mockRacks.filter(r => floorId === undefined || r.floorId === floorId)
}

export async function createRacks(floorId: string, count: number, binsPerRack: number): Promise<Rack[]> {
  await delay(600)
  const floor = mockFloors.find(f => f.id === floorId)
  if (!floor) throw new Error('Floor not found.')
  const startNum = mockRacks.filter(r => r.floorId === floorId).length + 1
  const newRacks: Rack[] = []
  for (let i = startNum; i < startNum + count; i++) {
    const rackNum = String(i).padStart(2, '0')
    const rack: Rack = { id: generateId(), floorId, name: `Rack ${i}`, code: `${floor.code}-R${rackNum}`, active: true }
    mockRacks.push(rack)
    newRacks.push(rack)
    for (let j = 1; j <= binsPerRack; j++) {
      const binNum = String(j).padStart(2, '0')
      mockBins.push({ id: generateId(), rackId: rack.id, name: `Bin ${j}`, code: `${rack.code}-B${binNum}`, active: true })
    }
  }
  return newRacks
}

export async function getBins(rackId?: string): Promise<Bin[]> {
  await delay()
  return mockBins.filter(b => rackId === undefined || b.rackId === rackId)
}

export async function updateBin(id: string, data: Partial<Omit<Bin, 'id'>>): Promise<Bin> {
  await delay(300)
  const idx = mockBins.findIndex(b => b.id === id)
  if (idx === -1) throw new Error('Bin not found.')
  if (data.active === false) {
    const hasStock = mockStockBalances.some(sb => sb.binId === id && (sb.sealedPacks + sb.loosePacks) > 0)
    if (hasStock) throw new Error('Cannot deactivate a bin that contains stock.')
  }
  mockBins[idx] = { ...mockBins[idx], ...data }
  return mockBins[idx]
}

export async function getAllBins(): Promise<Bin[]> {
  await delay()
  return [...mockBins]
}
