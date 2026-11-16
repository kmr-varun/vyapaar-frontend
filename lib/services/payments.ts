import { mockPayments, mockOrders, mockClients } from '../mock-data'
import type { Payment, CreditApproval, ClientLedgerEntry, PaymentMode, PaymentStatus } from '../types'
import { delay, generateId, nowISO } from './_mock'

const mockCreditApprovals: CreditApproval[] = []
const mockLedgerEntries: ClientLedgerEntry[] = []

export async function getPayments(orderId?: string, status?: PaymentStatus): Promise<Payment[]> {
  await delay()
  return mockPayments.filter(p =>
    (orderId === undefined || p.orderId === orderId) &&
    (status === undefined || p.status === status)
  )
}

export async function submitPayment(data: {
  orderId: string
  estimateId: string
  amount: number
  mode: PaymentMode
  utrReference?: string
  proofFileUrl?: string
}): Promise<Payment> {
  await delay(500)
  const dupe = mockPayments.find(p => p.utrReference && p.utrReference === data.utrReference && p.status !== 'rejected')
  if (dupe) throw new Error(`UTR ${data.utrReference} already exists on another payment.`)
  const payment: Payment = { id: generateId(), status: 'submitted', submittedAt: nowISO(), ...data }
  mockPayments.push(payment)
  return payment
}

export async function verifyPayment(id: string, verifiedBy: string): Promise<Payment> {
  await delay(400)
  const idx = mockPayments.findIndex(p => p.id === id)
  if (idx === -1) throw new Error('Payment not found.')
  mockPayments[idx].status = 'verified'
  mockPayments[idx].verifiedAt = nowISO()
  mockPayments[idx].verifiedBy = verifiedBy
  _checkOrderRelease(mockPayments[idx].orderId)
  return mockPayments[idx]
}

export async function rejectPayment(id: string, reason: string): Promise<Payment> {
  await delay(400)
  const idx = mockPayments.findIndex(p => p.id === id)
  if (idx === -1) throw new Error('Payment not found.')
  mockPayments[idx].status = 'rejected'
  mockPayments[idx].rejectionReason = reason
  return mockPayments[idx]
}

export async function approveCreditOrder(data: Omit<CreditApproval, 'id' | 'approvedAt'>): Promise<CreditApproval> {
  await delay(500)
  const approval: CreditApproval = { id: generateId(), approvedAt: nowISO(), ...data }
  mockCreditApprovals.push(approval)
  _checkOrderRelease(data.orderId)
  return approval
}

function _checkOrderRelease(orderId: string) {
  const order = mockOrders.find(o => o.id === orderId)
  if (!order) return
  const verifiedTotal = mockPayments
    .filter(p => p.orderId === orderId && p.status === 'verified')
    .reduce((s, p) => s + p.amount, 0)
  const creditApproved = mockCreditApprovals
    .filter(c => c.orderId === orderId)
    .reduce((s, c) => s + c.amount, 0)
  const estimate = /* will be linked by orderId */ 85800 // simplified: in real impl, sum from estimate
  if (verifiedTotal + creditApproved >= 0) {
    order.status = 'payment-verified'
  }
}

export async function getClientLedger(clientId: string): Promise<ClientLedgerEntry[]> {
  await delay()
  return mockLedgerEntries.filter(e => e.clientId === clientId)
}

export async function getClientOutstanding(): Promise<Array<{ client: typeof mockClients[0]; outstanding: number; overdueDays: number }>> {
  await delay()
  return mockClients.slice(0, 3).map((c, i) => ({
    client: c,
    outstanding: [45000, 85800, 120000][i],
    overdueDays: [0, 5, 15][i],
  }))
}
