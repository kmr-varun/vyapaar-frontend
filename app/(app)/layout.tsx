'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AppSidebar } from '@/components/app-sidebar'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login')
    } else if (!loading && user?.mustChangePassword) {
      router.replace('/change-password')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
