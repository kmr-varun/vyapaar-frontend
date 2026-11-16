import { mockOrders, mockClients } from '../mock-data'
import type { Order, OrderLine, CallLog, OrderStatus, CheckoutFormData } from '../types'
import { delay, generateId, nowISO } from './_mock'

function orderNumber(): string {
  const d = new Date()
  const yymm = `${String(d.getFullYear()).slice(2)}${String(d.getMonth() + 1).padStart(2, '0')}`
  const seq = String(mockOrders.length + 1).padStart(5, '0')
  return `ORD-${yymm}-${seq}`
}

export async function getOrders(statusFilter?: OrderStatus[]): Promise<Order[]> {
  await delay()
  return mockOrders.filter(o => !statusFilter || statusFilter.includes(o.status))
}

export async function getOrder(id: string): Promise<Order> {
  await delay()
  const o = mockOrders.find(o => o.id === id)
  if (!o) throw new Error('Order not found.')
  return o
}

export async function createOrderFromCatalog(form: CheckoutFormData, lines: OrderLine[]): Promise<Order> {
  await delay(600)
  let client = mockClients.find(c => c.mobile === form.mobile)
  if (!client) {
    client = {
      id: generateId(),
      businessName: form.businessName ?? form.contactName,
      contactName: form.contactName,
      mobile: form.mobile,
      gstin: form.gstin,
      billingAddress: form.deliveryAddress,
      creditLimit: 0,
      creditDays: 0,
      active: true,
      createdAt: nowISO(),
      source: 'catalog',
    }
    mockClients.push(client)
  }
  const slaDeadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  const order: Order = {
    id: generateId(),
    number: orderNumber(),
    clientId: client.id,
    status: 'new',
    source: 'catalog',
    deliveryAddress: form.deliveryAddress,
    preferredDeliveryDate: form.preferredDeliveryDate,
    notes: form.notes,
    lines: lines.map(l => ({ ...l, id: generateId(), orderId: '' })),
    callLogs: [],
    createdAt: nowISO(),
    slaDeadline,
  }
  order.lines.forEach(l => { l.orderId = order.id })
  mockOrders.push(order)
  return order
}

export async function createOrderManual(clientId: string, lines: Array<{ variantId: string; qtyCartons: number; qtyPacks: number }>): Promise<Order> {
  await delay(500)
  const slaDeadline = new Date(Date.now() + 24 * 3600 * 1000).toISOString()
  const order: Order = {
    id: generateId(),
    number: orderNumber(),
    clientId,
    status: 'new',
    source: 'manual',
    lines: lines.map(l => ({ id: generateId(), orderId: '', variantId: l.variantId, qtyCartons: l.qtyCartons, qtyPacks: l.qtyPacks })),
    callLogs: [],
    createdAt: nowISO(),
    slaDeadline,
  }
  order.lines.forEach(l => { l.orderId = order.id })
  mockOrders.push(order)
  return order
}

export async function logCall(orderId: string, log: Omit<CallLog, 'id' | 'orderId' | 'createdAt'>): Promise<Order> {
  await delay(400)
  const order = mockOrders.find(o => o.id === orderId)
  if (!order) throw new Error('Order not found.')
  const callLog: CallLog = { id: generateId(), orderId, createdAt: nowISO(), ...log }
  order.callLogs.push(callLog)
  if (log.outcome === 'confirmed') {
    order.status = 'confirmed'
    order.confirmedAt = nowISO()
  } else if (log.outcome === 'cancelled') {
    order.status = 'cancelled'
  } else if (log.outcome === 'changes-requested') {
    order.status = 'changes-requested'
  }
  return order
}

export async function updateOrderLines(orderId: string, lines: Array<{ variantId: string; qtyCartons: number; qtyPacks: number }>): Promise<Order> {
  await delay(400)
  const order = mockOrders.find(o => o.id === orderId)
  if (!order) throw new Error('Order not found.')
  order.lines = lines.map((l, i) => ({
    id: order.lines[i]?.id ?? generateId(),
    orderId,
    variantId: l.variantId,
    qtyCartons: l.qtyCartons,
    qtyPacks: l.qtyPacks,
  }))
  return order
}

export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
  await delay(300)
  const order = mockOrders.find(o => o.id === orderId)
  if (!order) throw new Error('Order not found.')
  order.status = status
  return order
}
