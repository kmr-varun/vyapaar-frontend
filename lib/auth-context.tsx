'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import type { User, UserRole } from './types'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (user: User, token: string) => void
  logout: () => void
  hasRole: (...roles: UserRole[]) => boolean
  can: (permission: Permission) => boolean
}

export type Permission =
  | 'manage-users'
  | 'edit-master-data'
  | 'view-cost-prices'
  | 'edit-warehouse'
  | 'view-warehouse'
  | 'create-grn'
  | 'approve-grn-variance'
  | 'view-stock'
  | 'request-adjustment'
  | 'approve-adjustment'
  | 'view-orders'
  | 'confirm-orders'
  | 'create-estimate'
  | 'price-estimate'
  | 'revise-price'
  | 'send-estimate'
  | 'verify-payment'
  | 'approve-credit'
  | 'view-pick-lists'
  | 'confirm-picks'
  | 'request-carton-open'
  | 'approve-carton-open'
  | 'manage-dispatch'
  | 'deliver-orders'
  | 'view-founder-dashboard'
  | 'view-reports'
  | 'view-margin-report'
  | 'view-accountant'
  | 'view-audit-log'
  | 'edit-settings'

const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    'manage-users', 'edit-master-data', 'view-cost-prices', 'edit-warehouse', 'view-warehouse',
    'create-grn', 'approve-grn-variance', 'view-stock', 'request-adjustment', 'approve-adjustment',
    'view-orders', 'confirm-orders', 'create-estimate', 'price-estimate', 'revise-price',
    'send-estimate', 'verify-payment', 'approve-credit', 'view-pick-lists', 'confirm-picks',
    'request-carton-open', 'approve-carton-open', 'manage-dispatch', 'view-founder-dashboard',
    'view-reports', 'view-margin-report', 'view-accountant', 'view-audit-log', 'edit-settings',
  ],
  'sub-admin': [
    'edit-master-data', 'edit-warehouse', 'view-warehouse',
    'create-grn', 'view-stock', 'request-adjustment',
    'view-orders', 'confirm-orders', 'create-estimate', 'send-estimate',
    'verify-payment', 'view-pick-lists', 'approve-carton-open',
    'manage-dispatch', 'view-reports', 'view-audit-log',
  ],
  'floor-manager': [
    'view-warehouse', 'create-grn', 'view-stock',
    'request-adjustment', 'view-pick-lists', 'confirm-picks',
    'request-carton-open',
  ],
  'delivery-manager': [
    'manage-dispatch',
    'deliver-orders',
  ],
  'delivery-team': [
    'deliver-orders',
  ],
  accountant: [
    'edit-master-data', 'view-stock', 'verify-payment',
    'view-reports', 'view-accountant',
  ],
}

const AuthContext = createContext<AuthContextValue | null>(null)

const SESSION_KEY = 'vyapaar_session'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY)
      if (raw) {
        const { user: savedUser } = JSON.parse(raw)
        setUser(savedUser)
      }
    } catch {}
    setLoading(false)
  }, [])

  const login = useCallback((user: User, token: string) => {
    setUser(user)
    localStorage.setItem(SESSION_KEY, JSON.stringify({ user, token, loginAt: Date.now() }))
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(SESSION_KEY)
  }, [])

  const hasRole = useCallback((...roles: UserRole[]) => {
    return user ? roles.includes(user.role) : false
  }, [user])

  const can = useCallback((permission: Permission): boolean => {
    if (!user) return false
    const perms = rolePermissions[user.role]
    if (!perms) return false
    if (permission === 'revise-price' && user.role === 'sub-admin') {
      return user.revisePricePermission === true
    }
    return perms.includes(permission)
  }, [user])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, hasRole, can }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
