'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getUnreadCount } from '@/lib/services/notifications'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Package, Warehouse, BarChart3,
  ShoppingCart, FileText, CreditCard, Truck,
  ClipboardList, Users, Settings, Bell, LogOut,
  ChevronDown, ChevronRight, Package2, Map,
  PackageCheck, Boxes, ArrowLeftRight, ClipboardCheck,
  BookOpen, Shield,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { UserRole } from '@/lib/types'

interface NavItem {
  label: string
  href?: string
  icon: React.ComponentType<{ className?: string }>
  roles?: UserRole[]
  children?: NavItem[]
  badge?: number
}

function NavLink({ item, depth = 0 }: { item: NavItem; depth?: number }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { hasRole } = useAuth()

  if (item.roles && !hasRole(...item.roles)) return null

  const isActive = item.href ? pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) : false
  const hasChildren = item.children && item.children.length > 0

  if (hasChildren) {
    const anyChildActive = item.children!.some(c => c.href && (pathname === c.href || pathname.startsWith(c.href)))
    return (
      <div>
        <button
          onClick={() => setOpen(o => !o)}
          className={cn(
            'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
            depth === 0 ? 'font-medium' : 'font-normal',
            anyChildActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <item.icon className="w-4 h-4 shrink-0" />
          <span className="flex-1 text-left truncate">{item.label}</span>
          {open || anyChildActive ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
        {(open || anyChildActive) && (
          <div className="ml-4 mt-0.5 space-y-0.5 border-l border-border pl-3">
            {item.children!.map(child => (
              <NavLink key={child.label} item={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={item.href!}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors',
        depth === 0 ? 'font-medium' : 'font-normal',
        isActive
          ? 'bg-primary/10 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
      )}
    >
      <item.icon className="w-4 h-4 shrink-0" />
      <span className="flex-1 truncate">{item.label}</span>
      {item.badge ? (
        <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">{item.badge}</Badge>
      ) : null}
    </Link>
  )
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Master Data',
    icon: BookOpen,
    roles: ['admin', 'sub-admin', 'accountant'],
    children: [
      { label: 'Brands', href: '/master/brands', icon: Package2 },
      { label: 'Products', href: '/master/products', icon: Package },
      { label: 'Variants / SKUs', href: '/master/variants', icon: Boxes },
      { label: 'Vendors', href: '/master/vendors', icon: Truck },
      { label: 'Clients', href: '/master/clients', icon: Users },
    ],
  },
  {
    label: 'Warehouse',
    href: '/warehouse',
    icon: Map,
    roles: ['admin', 'sub-admin', 'floor-manager'],
  },
  {
    label: 'Inventory',
    icon: Warehouse,
    roles: ['admin', 'sub-admin', 'floor-manager', 'accountant'],
    children: [
      { label: 'Stock View', href: '/inventory', icon: Boxes, roles: ['admin', 'sub-admin', 'floor-manager', 'accountant'] },
      { label: 'Purchases & GRN', href: '/inventory/purchases', icon: PackageCheck, roles: ['admin', 'sub-admin', 'floor-manager'] },
      { label: 'Transfers', href: '/inventory/transfers', icon: ArrowLeftRight, roles: ['admin', 'sub-admin', 'floor-manager'] },
      { label: 'Adjustments', href: '/inventory/adjustments', icon: ClipboardCheck, roles: ['admin', 'sub-admin', 'floor-manager'] },
    ],
  },
  {
    label: 'Orders',
    href: '/orders',
    icon: ShoppingCart,
    roles: ['admin', 'sub-admin', 'accountant'],
  },
  {
    label: 'Estimates',
    href: '/estimates',
    icon: FileText,
    roles: ['admin', 'sub-admin'],
  },
  {
    label: 'Payments',
    href: '/payments',
    icon: CreditCard,
    roles: ['admin', 'sub-admin', 'accountant'],
  },
  {
    label: 'Picking & Packing',
    href: '/picking',
    icon: ClipboardList,
    roles: ['admin', 'sub-admin', 'floor-manager'],
  },
  {
    label: 'Dispatch & Delivery',
    href: '/dispatch',
    icon: Truck,
    roles: ['admin', 'sub-admin', 'delivery-manager', 'delivery-team'],
  },
  {
    label: 'Reports',
    icon: BarChart3,
    roles: ['admin', 'sub-admin', 'accountant'],
    children: [
      { label: 'Sales', href: '/reports/sales', icon: BarChart3, roles: ['admin', 'sub-admin', 'accountant'] },
      { label: 'Stock', href: '/reports/stock', icon: Boxes, roles: ['admin', 'sub-admin', 'accountant'] },
      { label: 'Margins', href: '/reports/margins', icon: BarChart3, roles: ['admin'] },
      { label: 'Accountant View', href: '/reports/accountant', icon: BookOpen, roles: ['admin', 'accountant'] },
    ],
  },
  {
    label: 'Users',
    href: '/users',
    icon: Users,
    roles: ['admin', 'sub-admin'],
  },
  {
    label: 'Audit Log',
    href: '/audit',
    icon: Shield,
    roles: ['admin', 'sub-admin'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [unreadCount, setUnreadCount] = useState(0)
  const pathname = usePathname()

  useEffect(() => {
    if (user) {
      getUnreadCount(user.id).then(setUnreadCount).catch(() => {})
    }
  }, [user, pathname])

  function handleLogout() {
    logout()
    router.push('/login')
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col h-full border-r border-border bg-background">
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Package2 className="w-4 h-4 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold truncate">Royal Nutrition</p>
          <p className="text-[10px] text-muted-foreground truncate capitalize">{user?.role.replace('-', ' ')}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
        {navItems.map(item => (
          <NavLink key={item.label} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 py-3 border-t border-border space-y-0.5">
        <Link
          href="/notifications"
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <Bell className="w-4 h-4 shrink-0" />
          <span className="flex-1">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-4 min-w-4 px-1 text-[10px]">{unreadCount}</Badge>
          )}
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          <span>Sign out</span>
        </button>
        <div className="px-3 pt-2">
          <p className="text-[10px] text-muted-foreground truncate">{user?.name}</p>
          <p className="text-[10px] text-muted-foreground truncate">{user?.userCode}</p>
        </div>
      </div>
    </aside>
  )
}
