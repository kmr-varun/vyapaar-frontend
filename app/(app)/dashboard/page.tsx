'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { getOrders } from '@/lib/services/orders'
import { getPayments } from '@/lib/services/payments'
import { getAdjustments } from '@/lib/services/inventory'
import { getCartonOpenRequests } from '@/lib/services/picking'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts'
import {
  TrendingUp, ShoppingCart, FileText, CreditCard, AlertTriangle,
  Clock, Package, ArrowRight, IndianRupee,
} from 'lucide-react'
import type { Order, StockAdjustment, CartonOpenRequest } from '@/lib/types'
import { formatDistanceToNow, isPast } from 'date-fns'

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

const salesData = [
  { day: 'Mon', sales: 42000 },
  { day: 'Tue', sales: 65000 },
  { day: 'Wed', sales: 38000 },
  { day: 'Thu', sales: 92000 },
  { day: 'Fri', sales: 55000 },
  { day: 'Sat', sales: 71000 },
  { day: 'Sun', sales: 45000 },
]

const monthlyRevenue = [
  { month: 'Jun', revenue: 820000 },
  { month: 'Jul', revenue: 950000 },
  { month: 'Aug', revenue: 1100000 },
  { month: 'Sep', revenue: 870000 },
  { month: 'Oct', revenue: 1230000 },
  { month: 'Nov', revenue: 1150000 },
]

const ordersByStatus = [
  { name: 'Delivered', value: 142 },
  { name: 'Dispatched', value: 28 },
  { name: 'Confirmed', value: 15 },
  { name: 'New', value: 8 },
  { name: 'Cancelled', value: 7 },
]

const topProducts = [
  { sku: 'ON GSW DRC 2LB', sales: 320000 },
  { sku: 'MB BPW CC 2KG', sales: 285000 },
  { sku: 'AV ISO STR 5LB', sales: 245000 },
  { sku: 'ON GSW DRC 5LB', sales: 198000 },
  { sku: 'MB BPW RC 1KG', sales: 165000 },
]

const lowStockItems = [
  { name: 'ON GSW DRC 2LB', available: 8, threshold: 12 },
  { name: 'MB BPW CC 2KG', available: 5, threshold: 12 },
  { name: 'AV ISO STR 5LB', available: 4, threshold: 6 },
]

const expiringSoon = [
  { name: 'MB BPW RC 1KG', batch: 'B2026-MB-01', expiry: '2027-05-31' },
  { name: 'ON GSW DRC 2LB', batch: 'B2026-ON-03', expiry: '2027-04-30' },
]

function KpiCard({ title, value, icon: Icon, color }: {
  title: string; value: string; icon: React.ElementType; color: string
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
            <Icon className="w-4 h-4" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function RoleWelcome() {
  const { user } = useAuth()
  const links: Record<string, { label: string; href: string }[]> = {
    'sub-admin': [
      { label: 'Order Queue', href: '/orders' },
      { label: 'Estimates', href: '/estimates' },
      { label: 'Picking', href: '/picking' },
      { label: 'Dispatch', href: '/dispatch' },
    ],
    'floor-manager': [
      { label: 'Stock View', href: '/inventory' },
      { label: 'Picking & Packing', href: '/picking' },
      { label: 'Purchases & GRN', href: '/inventory/purchases' },
    ],
    'delivery-manager': [
      { label: 'Dispatch & Delivery', href: '/dispatch' },
    ],
    'delivery-team': [
      { label: 'My Deliveries', href: '/dispatch' },
    ],
    accountant: [
      { label: 'Payments', href: '/payments' },
      { label: 'Sales Report', href: '/reports/sales' },
      { label: 'Accountant View', href: '/reports/accountant' },
    ],
  }

  const myLinks = links[user?.role ?? ''] ?? []

  return (
    <div className="p-6">
      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle className="text-lg">Welcome, {user?.name}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground capitalize">
            Role: <span className="font-medium text-foreground">{user?.role.replace('-', ' ')}</span>
          </p>
          {myLinks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Quick links</p>
              <div className="flex flex-wrap gap-2">
                {myLinks.map(l => (
                  <Link key={l.href} href={l.href}>
                    <Badge variant="secondary" className="cursor-pointer hover:bg-primary/10">
                      {l.label} <ArrowRight className="w-3 h-3 ml-1" />
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [pendingPayments, setPendingPayments] = useState(0)
  const [pendingAdjustments, setPendingAdjustments] = useState(0)
  const [openCartonReqs, setOpenCartonReqs] = useState(0)
  const [loading, setLoading] = useState(true)
  const [colors, setColors] = useState(['oklch(0.696 0.17 162)', 'oklch(0.623 0.214 259)', 'oklch(0.769 0.188 70)', 'oklch(0.645 0.246 16)', 'oklch(0.606 0.25 293)'])

  useEffect(() => {
    const style = getComputedStyle(document.documentElement)
    const resolved = [1, 2, 3, 4, 5].map(i => style.getPropertyValue(`--chart-${i}`).trim()).filter(Boolean)
    if (resolved.length === 5) setColors(resolved)
  }, [])

  useEffect(() => {
    if (user?.role !== 'admin') { setLoading(false); return }
    Promise.all([
      getOrders(),
      getPayments(undefined, 'submitted'),
      getAdjustments(),
      getCartonOpenRequests(),
    ]).then(([ords, pays, adjs, creqs]) => {
      setOrders(ords)
      setPendingPayments(pays.length)
      setPendingAdjustments((adjs as StockAdjustment[]).filter(a => a.status === 'pending').length)
      setOpenCartonReqs((creqs as CartonOpenRequest[]).filter(r => r.status === 'pending').length)
    }).finally(() => setLoading(false))
  }, [user])

  if (user?.role !== 'admin') return <RoleWelcome />

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  const newOrders = orders.filter(o => o.status === 'new')
  const confirmedNoEstimate = orders.filter(o => o.status === 'confirmed')
  const slaBreached = orders.filter(o => o.status === 'new' && isPast(new Date(o.slaDeadline)))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Royal Nutrition — Overview</p>
      </div>

      {/* Sales KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard title="Sales Today" value={inr(45000)} icon={TrendingUp} color="bg-emerald-500/10 text-emerald-500" />
        <KpiCard title="Sales This Week" value={inr(280000)} icon={TrendingUp} color="bg-blue-500/10 text-blue-500" />
        <KpiCard title="Sales This Month" value={inr(1150000)} icon={IndianRupee} color="bg-purple-500/10 text-purple-500" />
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/orders?status=new">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-3">
              <ShoppingCart className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{newOrders.length}</p>
              <p className="text-xs text-muted-foreground">Pending Confirmations</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/estimates">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-3">
              <FileText className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{confirmedNoEstimate.length}</p>
              <p className="text-xs text-muted-foreground">Estimates to Price</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/payments">
          <Card className="hover:border-primary/50 transition-colors cursor-pointer">
            <CardContent className="pt-4 pb-3">
              <CreditCard className="w-5 h-5 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold">{pendingPayments}</p>
              <p className="text-xs text-muted-foreground">Payments to Verify</p>
            </CardContent>
          </Card>
        </Link>
        <Card>
          <CardContent className="pt-4 pb-3">
            <IndianRupee className="w-5 h-5 text-muted-foreground mb-2" />
            <p className="text-2xl font-bold">{inr(251800)}</p>
            <p className="text-xs text-muted-foreground">Credit Outstanding</p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {slaBreached.length > 0 && (
          <Card className="border-destructive/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-4 h-4" /> SLA Breached ({slaBreached.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {slaBreached.map(o => (
                <Link key={o.id} href={`/orders`} className="block">
                  <div className="flex items-center justify-between text-xs py-1 hover:text-primary">
                    <span className="font-medium">{o.number}</span>
                    <span className="text-muted-foreground">
                      {formatDistanceToNow(new Date(o.slaDeadline), { addSuffix: true })}
                    </span>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {pendingAdjustments > 0 && (
          <Card className="border-amber-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
                <Package className="w-4 h-4" /> Stock Adjustments Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingAdjustments}</p>
              <Link href="/inventory/adjustments">
                <Button variant="link" className="p-0 h-auto text-xs">Review adjustments →</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {openCartonReqs > 0 && (
          <Card className="border-amber-500/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
                <Clock className="w-4 h-4" /> Open Carton Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{openCartonReqs}</p>
              <Link href="/picking">
                <Button variant="link" className="p-0 h-auto text-xs">Review requests →</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Row 1 — Sales 7 days + Orders by Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Sales — Last 7 Days</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={salesData} margin={{ top: 0, right: 0, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => [typeof v === 'number' ? inr(v) : '0', 'Sales']} />
                <Bar dataKey="sales" fill={colors[0]} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Orders by Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={ordersByStatus}
                  cx="50%"
                  cy="45%"
                  innerRadius={50}
                  outerRadius={72}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {ordersByStatus.map((_, i) => (
                    <Cell key={i} fill={colors[i % colors.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, name) => [v, name]} />
                <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 — Monthly Revenue + Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Revenue — Last 6 Months</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyRevenue} margin={{ top: 4, right: 8, bottom: 0, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v / 100000).toFixed(1)}L`} />
                <Tooltip formatter={(v) => [typeof v === 'number' ? inr(v) : '0', 'Revenue']} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke={colors[1]}
                  strokeWidth={2}
                  dot={{ r: 3, fill: colors[1] }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top 5 SKUs by Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topProducts} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                <YAxis type="category" dataKey="sku" tick={{ fontSize: 10 }} width={90} />
                <Tooltip formatter={(v) => [typeof v === 'number' ? inr(v) : '0', 'Sales']} />
                <Bar dataKey="sales" fill={colors[2]} radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock & Expiring */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-500 flex items-center gap-2">
              <Package className="w-4 h-4" /> Low Stock
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left pb-2">Variant</th>
                  <th className="text-right pb-2">Available</th>
                  <th className="text-right pb-2">Threshold</th>
                </tr>
              </thead>
              <tbody>
                {lowStockItems.map(item => (
                  <tr key={item.name} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5">{item.name}</td>
                    <td className="text-right text-destructive font-medium">{item.available}</td>
                    <td className="text-right text-muted-foreground">{item.threshold}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-amber-500 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <table className="w-full text-xs">
              <thead>
                <tr className="text-muted-foreground border-b border-border">
                  <th className="text-left pb-2">Variant</th>
                  <th className="text-left pb-2">Batch</th>
                  <th className="text-right pb-2">Expiry</th>
                </tr>
              </thead>
              <tbody>
                {expiringSoon.map(item => (
                  <tr key={item.batch} className="border-b border-border/50 last:border-0">
                    <td className="py-1.5">{item.name}</td>
                    <td className="text-muted-foreground">{item.batch}</td>
                    <td className="text-right text-amber-500">{item.expiry}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
