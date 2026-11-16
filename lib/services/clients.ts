import { mockClients } from '../mock-data'
import type { Client } from '../types'
import { delay, generateId, nowISO } from './_mock'

export async function getClients(includeInactive = false): Promise<Client[]> {
  await delay()
  return mockClients.filter(c => includeInactive || c.active)
}

export async function getClient(id: string): Promise<Client> {
  await delay()
  const c = mockClients.find(c => c.id === id)
  if (!c) throw new Error('Client not found.')
  return c
}

export async function findClientByMobile(mobile: string): Promise<Client | undefined> {
  await delay()
  return mockClients.find(c => c.mobile === mobile)
}

export async function createClient(data: Omit<Client, 'id' | 'active' | 'createdAt'>): Promise<Client> {
  await delay(400)
  const existing = mockClients.find(c => c.mobile === data.mobile)
  if (existing) throw new Error('A client with this mobile number already exists.')
  const client: Client = { id: generateId(), active: true, createdAt: nowISO(), ...data }
  mockClients.push(client)
  return client
}

export async function updateClient(id: string, data: Partial<Omit<Client, 'id' | 'createdAt'>>): Promise<Client> {
  await delay(300)
  const idx = mockClients.findIndex(c => c.id === id)
  if (idx === -1) throw new Error('Client not found.')
  mockClients[idx] = { ...mockClients[idx], ...data }
  return mockClients[idx]
}
