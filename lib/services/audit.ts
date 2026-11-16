import { mockAuditLogs } from '../mock-data'
import type { AuditLog } from '../types'
import { delay, generateId, nowISO } from './_mock'

export async function getAuditLogs(filters?: {
  userId?: string
  entity?: string
  action?: AuditLog['action']
  from?: string
  to?: string
}): Promise<AuditLog[]> {
  await delay()
  return mockAuditLogs
    .filter(log => {
      if (filters?.userId && log.userId !== filters.userId) return false
      if (filters?.entity && log.entity !== filters.entity) return false
      if (filters?.action && log.action !== filters.action) return false
      if (filters?.from && log.createdAt < filters.from) return false
      if (filters?.to && log.createdAt > filters.to) return false
      return true
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function logAction(data: Omit<AuditLog, 'id' | 'createdAt'>): Promise<AuditLog> {
  const log: AuditLog = { id: generateId(), createdAt: nowISO(), ...data }
  mockAuditLogs.push(log)
  return log
}
