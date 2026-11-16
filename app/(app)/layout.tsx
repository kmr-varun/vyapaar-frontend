'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { AppSidebar } from '@/components/app-sidebar'
import { Menu, Package2 } from 'lucide-react'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

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
    <div className="flex flex-col md:flex-row h-screen bg-background overflow-hidden">
      {/* Mobile top bar */}
      <div className="flex md:hidden items-center gap-3 px-4 h-14 shrink-0 border-b border-border bg-background">
        <button
          onClick={() => setMobileNavOpen(true)}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center">
            <Package2 className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="font-semibold text-sm">Royal Nutrition</span>
        </div>
      </div>

      {/* Sidebar */}
      <AppSidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}
