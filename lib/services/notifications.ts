import { mockNotifications } from '../mock-data'
import type { Notification } from '../types'
import { delay, generateId, nowISO } from './_mock'

export async function getNotifications(userId: string): Promise<Notification[]> {
  await delay()
  return mockNotifications
    .filter(n => n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function getUnreadCount(userId: string): Promise<number> {
  await delay(100)
  return mockNotifications.filter(n => n.userId === userId && !n.read).length
}

export async function markRead(id: string): Promise<void> {
  await delay(100)
  const n = mockNotifications.find(n => n.id === id)
  if (n) n.read = true
}

export async function markAllRead(userId: string): Promise<void> {
  await delay(200)
  mockNotifications.filter(n => n.userId === userId).forEach(n => { n.read = true })
}

export async function pushNotification(data: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification> {
  const notification: Notification = { id: generateId(), read: false, createdAt: nowISO(), ...data }
  mockNotifications.push(notification)
  return notification
}
