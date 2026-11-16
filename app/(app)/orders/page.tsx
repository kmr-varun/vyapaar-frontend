'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { getOrders, logCall } from '@/lib/services/orders'
import { getClients } from '@/lib/services/clients'
import { getVariants } from '@/lib/services/variants'
import { getProducts } from '@/lib/services/products'
import type { Order, Client, Variant, Product, OrderStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Phone, ChevronRight, AlertCircle, Clock, Package } from 'lucide-react'
import { format, formatDistanceToNow, isPast } from 'date-fns'

const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

function timeAgo(iso: string) {
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
}

function hoursOld(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 3600000
}

function slaColor(order: Order): string {
  const h = hoursOld(order.createdAt)
  if (isPast(new Date(order.slaDeadline))) return 'bg-red-950/40'
  if (h > 20) return 'bg-amber-950/40'
  return ''
}

const STATUS_COLORS: Record<string, string> = {
  'new': 'bg-muted text-muted-foreground',
  'confirmed': 'bg-blue-500/20 text-blue-400',
  'changes-requested': 'bg-orange-500/20 text-orange-400',
  'estimate-sent': 'bg-purple-500/20 text-purple-400',
  'payment-pending': 'bg-yellow-500/20 text-yellow-400',
  'payment-verified': 'bg-emerald-500/20 text-emerald-400',
  'in-warehouse': 'bg-cyan-500/20 text-cyan-400',
  'picking': 'bg-blue-500/20 text-blue-400',
  'partially-packed': 'bg-orange-500/20 text-orange-400',
  'packed': 'bg-teal-500/20 text-teal-400',
  'ready-for-dispatch': 'bg-indigo-500/20 text-indigo-400',
  'dispatched': 'bg-violet-500/20 text-violet-400',
  'out-for-delivery': 'bg-sky-500/20 text-sky-400',
  'delivered': 'bg-green-500/20 text-green-400',
  'failed-delivery': 'bg-red-500/20 text-red-400',
  'on-hold': 'bg-amber-500/20 text-amber-400',
  'cancelled': 'bg-red-500/20 text-red-400',
  'closed': 'bg-muted text-muted-foreground',
}

export default function OrdersPage() {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const load = useCallback(async () => {
    setLoading(true)
    const [os, cs, vs, ps] = await Promise.all([
      getOrders(),
      getClients(),
      getVariants(),
      getProducts(),
    ])
    setOrders(os)
    setClients(cs)
    setVariants(vs)
    setProducts(ps)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function clientName(clientId: string) {
    const c = clients.find(c => c.id === clientId)
    return c ? `${c.businessName} (${c.contactName})` : clientId
  }

  function variantLabel(variantId: string) {
    const v = variants.find(v => v.id === variantId)
    if (!v) return variantId
    const p = products.find(p => p.id === v.productId)
    return `${p?.name ?? ''} — ${v.flavour} ${v.packSize}${v.packUnit}`
  }

  const pendingOrders = orders
    .filter(o => o.status === 'new' || o.status === 'changes-requested')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())

  const filteredOrders = statusFilter === 'all'
    ? orders
    : orders.filter(o => o.status === statusFilter)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">{pendingOrders.length} pending confirmation</p>
        </div>
        <Link href="/orders/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" /> Create Order
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Confirmation
            {pendingOrders.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-4 min-w-4 px-1 text-[10px]">{pendingOrders.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-4">
          {pendingOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Package className="w-10 h-10 mb-3 opacity-30" />
              <p>No orders pending confirmation</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Age</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">SLA</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map(order => (
                    <tr key={order.id} className={`border-t border-border hover:bg-muted/20 ${slaColor(order)}`}>
                      <td className="px-4 py-3 font-mono text-xs">
                        <Link href={`/orders/${order.id}`} className="hover:underline">{order.number}</Link>
                      </td>
                      <td className="px-4 py-3 font-medium">{clientName(order.clientId)}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] capitalize">{order.source}</Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{order.lines.length} item{order.lines.length !== 1 ? 's' : ''}</td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}</td>
                      <td className="px-4 py-3 text-xs">
                        <span className={hoursOld(order.createdAt) > 24 ? 'text-red-400 font-medium' : hoursOld(order.createdAt) > 20 ? 'text-amber-400 font-medium' : 'text-muted-foreground'}>
                          {timeAgo(order.createdAt)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {isPast(new Date(order.slaDeadline)) ? (
                          <span className="flex items-center gap-1 text-xs text-red-400"><AlertCircle className="w-3 h-3" /> Breached</span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="w-3 h-3" /> {formatDistanceToNow(new Date(order.slaDeadline), { addSuffix: true })}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/orders/${order.id}`}>
                          <Button size="sm" variant="outline">
                            <Phone className="w-3 h-3 mr-1.5" /> Log Call
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="all" className="mt-4">
          <div className="flex items-center gap-3 mb-4">
            <Select value={statusFilter} onValueChange={(v) => v && setStatusFilter(v)}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {(['new','confirmed','estimate-sent','payment-verified','in-warehouse','picking','packed','ready-for-dispatch','dispatched','out-for-delivery','delivered','failed-delivery','on-hold','cancelled','closed'] as OrderStatus[]).map(s => (
                  <SelectItem key={s} value={s} className="capitalize">{s.replace(/-/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="border border-border rounded-lg overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{order.number}</td>
                    <td className="px-4 py-3 font-medium">{clientName(order.clientId)}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] capitalize">{order.source}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{order.lines.length}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_COLORS[order.status] ?? ''}`}>
                        {order.status.replace(/-/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{format(new Date(order.createdAt), 'dd MMM yyyy')}</td>
                    <td className="px-4 py-3">
                      <Link href={`/orders/${order.id}`}>
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

    </div>
  )
}
