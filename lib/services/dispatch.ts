import { mockDeliveries, mockOrders, mockUsers } from '../mock-data'
import type { Delivery, DeliveryMode } from '../types'
import { delay, generateId, nowISO } from './_mock'
import { logAction } from './audit'

function generateOTP(): string {
  return String(Math.floor(1000 + Math.random() * 9000))
}

export async function getDeliveries(orderId?: string): Promise<Delivery[]> {
  await delay()
  return mockDeliveries.filter(d => orderId === undefined || d.orderId === orderId)
}

export async function createDelivery(orderId: string, mode: DeliveryMode, riderId?: string): Promise<Delivery> {
  await delay(400)
  const delivery: Delivery = {
    id: generateId(),
    orderId,
    mode,
    riderId,
    status: 'assigned',
    createdAt: nowISO(),
  }
  mockDeliveries.push(delivery)
  const order = mockOrders.find(o => o.id === orderId)
  if (order) order.status = 'dispatched'
  const actor = mockUsers.find(u => u.id === 'u1')!
  void logAction({ userId: actor.id, userName: actor.name, userRole: actor.role, action: 'create', entity: 'Delivery', entityId: delivery.id, ip: '0.0.0.0', after: { orderId, mode, riderId } })
  return delivery
}

export async function markOutForDelivery(id: string): Promise<Delivery> {
  await delay(400)
  const idx = mockDeliveries.findIndex(d => d.id === id)
  if (idx === -1) throw new Error('Delivery not found.')
  const otp = generateOTP()
  mockDeliveries[idx].status = 'out-for-delivery'
  mockDeliveries[idx].otp = otp
  const order = mockOrders.find(o => o.id === mockDeliveries[idx].orderId)
  if (order) order.status = 'out-for-delivery'
  const actor = mockUsers.find(u => u.id === 'u1')!
  void logAction({ userId: actor.id, userName: actor.name, userRole: actor.role, action: 'status-change', entity: 'Delivery', entityId: id, ip: '0.0.0.0', after: { status: 'out-for-delivery' } })
  return mockDeliveries[idx]
}

export async function confirmDelivery(id: string, data: {
  proofType: 'otp' | 'photo'
  otp?: string
  proofUrl?: string
  receiverName?: string
}): Promise<Delivery> {
  await delay(500)
  const idx = mockDeliveries.findIndex(d => d.id === id)
  if (idx === -1) throw new Error('Delivery not found.')
  const delivery = mockDeliveries[idx]
  if (data.proofType === 'otp' && data.otp !== delivery.otp) {
    throw new Error('Incorrect OTP. Please verify with the customer.')
  }
  delivery.status = 'delivered'
  delivery.proofType = data.proofType
  delivery.proofUrl = data.proofUrl
  delivery.receiverName = data.receiverName
  delivery.deliveredAt = nowISO()
  const order = mockOrders.find(o => o.id === delivery.orderId)
  if (order) order.status = 'delivered'
  const actor = mockUsers.find(u => u.id === 'u1')!
  void logAction({ userId: actor.id, userName: actor.name, userRole: actor.role, action: 'status-change', entity: 'Delivery', entityId: id, ip: '0.0.0.0', after: { status: 'delivered', receiverName: data.receiverName } })
  return delivery
}

export async function failDelivery(id: string, reason: string): Promise<Delivery> {
  await delay(400)
  const idx = mockDeliveries.findIndex(d => d.id === id)
  if (idx === -1) throw new Error('Delivery not found.')
  mockDeliveries[idx].status = 'failed'
  mockDeliveries[idx].failureReason = reason
  const order = mockOrders.find(o => o.id === mockDeliveries[idx].orderId)
  if (order) order.status = 'failed-delivery'
  const actor = mockUsers.find(u => u.id === 'u1')!
  void logAction({ userId: actor.id, userName: actor.name, userRole: actor.role, action: 'status-change', entity: 'Delivery', entityId: id, ip: '0.0.0.0', after: { status: 'failed', reason } })
  return mockDeliveries[idx]
}
