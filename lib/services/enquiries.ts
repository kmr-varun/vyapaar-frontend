import { mockEnquiries, mockUsers } from '../mock-data'
import type { Enquiry, EnquiryLine, EnquiryCallLog, EnquiryStatus, EnquiryPaymentType } from '../types'
import { logAction } from './audit'
import { pushNotification } from './notifications'

const store: Enquiry[] = [...mockEnquiries]

function nextNumber(): string {
  const existing = store.map(e => parseInt(e.number.split('-')[2] ?? '0')).filter(Boolean)
  const next = existing.length > 0 ? Math.max(...existing) + 1 : 1
  const yymm = new Date().toISOString().slice(2, 4) + new Date().toISOString().slice(5, 7)
  return `ENQ-${yymm}-${String(next).padStart(5, '0')}`
}

export async function getEnquiries(status?: EnquiryStatus): Promise<Enquiry[]> {
  const all = [...store].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  return status ? all.filter(e => e.status === status) : all
}

export async function getEnquiry(id: string): Promise<Enquiry | null> {
  return store.find(e => e.id === id) ?? null
}

export async function createEnquiry(data: {
  catalogLinkId?: string
  contactName: string
  mobile: string
  email?: string
  businessName?: string
  deliveryAddress?: string
  preferredDate?: string
  notes?: string
  lines: EnquiryLine[]
}): Promise<Enquiry> {
  const enq: Enquiry = {
    id: `enq${Date.now()}`,
    number: nextNumber(),
    ...data,
    status: 'new',
    callLogs: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  store.unshift(enq)
  const actor = mockUsers.find(u => u.id === 'u1')!
  void logAction({ userId: actor.id, userName: actor.name, userRole: actor.role, action: 'create', entity: 'Enquiry', entityId: enq.id, ip: '0.0.0.0' })
  // Notify all admin and sub-admin users
  const admins = mockUsers.filter(u => (u.role === 'admin' || u.role === 'sub-admin') && u.status === 'active')
  admins.forEach(u => {
    void pushNotification({ userId: u.id, title: 'New enquiry received', body: `${data.contactName} (${data.mobile}) placed an enquiry from the catalog.`, linkType: 'enquiry', linkId: enq.id })
  })
  return enq
}

export async function addCallLog(
  id: string,
  log: Omit<EnquiryCallLog, 'at'>,
): Promise<Enquiry> {
  const enq = store.find(e => e.id === id)
  if (!enq) throw new Error('Enquiry not found')
  enq.callLogs.push({ ...log, at: new Date().toISOString() })
  enq.updatedAt = new Date().toISOString()
  if (log.outcome === 'confirmed') enq.status = 'called'
  return enq
}

export async function updateEnquiryLines(id: string, lines: EnquiryLine[]): Promise<Enquiry> {
  const enq = store.find(e => e.id === id)
  if (!enq) throw new Error('Enquiry not found')
  enq.lines = lines
  enq.updatedAt = new Date().toISOString()
  return enq
}

export async function updateEnquiryStatus(
  id: string,
  status: EnquiryStatus,
  paymentType?: EnquiryPaymentType,
): Promise<Enquiry> {
  const enq = store.find(e => e.id === id)
  if (!enq) throw new Error('Enquiry not found')
  enq.status = status
  if (paymentType) enq.paymentType = paymentType
  enq.updatedAt = new Date().toISOString()
  if (status === 'cancelled') {
    const actor = mockUsers.find(u => u.id === 'u1')!
    void logAction({ userId: actor.id, userName: actor.name, userRole: actor.role, action: 'status-change', entity: 'Enquiry', entityId: id, ip: '0.0.0.0', after: { status: 'cancelled' } })
  }
  return enq
}

export async function convertToOrder(id: string, orderId: string): Promise<Enquiry> {
  const enq = store.find(e => e.id === id)
  if (!enq) throw new Error('Enquiry not found')
  enq.orderId = orderId
  enq.status = 'confirmed'
  enq.updatedAt = new Date().toISOString()
  const actor = mockUsers.find(u => u.id === 'u1')!
  void logAction({ userId: actor.id, userName: actor.name, userRole: actor.role, action: 'status-change', entity: 'Enquiry', entityId: id, ip: '0.0.0.0', after: { status: 'confirmed', orderId } })
  return enq
}
