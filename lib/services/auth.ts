import { mockUsers } from '../mock-data'
import type { User, AuthSession } from '../types'
import { delay, nowISO } from './_mock'
import { logAction } from './audit'

// Simulated password store: userCode → password
const passwords: Record<string, string> = {
  ADMIN01: 'Admin@123',
  SADM01: 'Sadm@123',
  FLMGR01: 'Floor@123',
  DLMGR01: 'Delivery@123',
  RIDER01: 'Rider@123',
  ACCT01: 'Acct@123',
  FLMGR02: 'Floor@123',
}

let failedAttempts: Record<string, number> = {}
let lockedUntil: Record<string, number> = {}

export async function login(userCode: string, password: string): Promise<AuthSession> {
  await delay(400)
  const code = userCode.toUpperCase()
  const now = Date.now()

  if (lockedUntil[code] && lockedUntil[code] > now) {
    const mins = Math.ceil((lockedUntil[code] - now) / 60000)
    throw new Error(`Account locked. Try again in ${mins} minute(s).`)
  }

  const user = mockUsers.find(u => u.userCode.toUpperCase() === code)
  if (!user) {
    throw new Error('Invalid user ID or password.')
  }
  if (user.status === 'disabled') {
    throw new Error('Account is disabled. Contact your administrator.')
  }

  if (passwords[code] !== password) {
    failedAttempts[code] = (failedAttempts[code] || 0) + 1
    if (failedAttempts[code] >= 5) {
      lockedUntil[code] = now + 15 * 60 * 1000
      failedAttempts[code] = 0
      throw new Error('Too many failed attempts. Account locked for 15 minutes.')
    }
    const remaining = 5 - failedAttempts[code]
    throw new Error(`Invalid user ID or password. ${remaining} attempt(s) remaining.`)
  }

  failedAttempts[code] = 0
  delete lockedUntil[code]

  return { user, token: `mock-jwt-${user.id}-${nowISO()}` }
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
  await delay(400)
  const user = mockUsers.find(u => u.id === userId)
  if (!user) throw new Error('User not found.')
  if (passwords[user.userCode] !== currentPassword) throw new Error('Current password is incorrect.')
  if (newPassword.length < 8) throw new Error('Password must be at least 8 characters.')
  if (!/[a-zA-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
    throw new Error('Password must contain at least one letter and one digit.')
  }
  passwords[user.userCode] = newPassword
  user.mustChangePassword = false
}

export async function getUsers(): Promise<User[]> {
  await delay()
  return [...mockUsers]
}

export async function createUser(data: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User> {
  await delay(400)
  const { password, ...userData } = data
  const user: User = { ...userData, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  mockUsers.push(user)
  passwords[user.userCode.toUpperCase()] = password
  const admin = mockUsers.find(u => u.id === 'u1')!
  void logAction({ userId: admin.id, userName: admin.name, userRole: admin.role, action: 'create', entity: 'User', entityId: user.id, ip: '0.0.0.0', after: { name: user.name, role: user.role, userCode: user.userCode } })
  return user
}

export async function updateUser(id: string, data: Partial<User>): Promise<User> {
  await delay(300)
  const idx = mockUsers.findIndex(u => u.id === id)
  if (idx === -1) throw new Error('User not found.')
  mockUsers[idx] = { ...mockUsers[idx], ...data }
  const admin = mockUsers.find(u => u.id === 'u1')!
  void logAction({ userId: admin.id, userName: admin.name, userRole: admin.role, action: 'update', entity: 'User', entityId: id, ip: '0.0.0.0', after: data })
  return mockUsers[idx]
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  await delay(300)
  const user = mockUsers.find(u => u.id === id)
  if (!user) throw new Error('User not found.')
  passwords[user.userCode.toUpperCase()] = newPassword
  user.mustChangePassword = true
  const admin = mockUsers.find(u => u.id === 'u1')!
  void logAction({ userId: admin.id, userName: admin.name, userRole: admin.role, action: 'update', entity: 'User', entityId: id, ip: '0.0.0.0', after: { passwordReset: true } })
}

export async function unlockUser(id: string): Promise<void> {
  await delay(200)
  const user = mockUsers.find(u => u.id === id)
  if (user) delete lockedUntil[user.userCode.toUpperCase()]
}
