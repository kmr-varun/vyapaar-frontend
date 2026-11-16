'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getClient } from '@/lib/services/clients'
import { getOrders } from '@/lib/services/orders'
import type { Client, Order } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronRight, Share2 } from 'lucide-react'
import { format } from 'date-fns'

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

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export default function ClientDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [c, allOrders] = await Promise.all([getClient(id), getOrders()])
      setClient(c)
      setOrders(allOrders.filter(o => o.clientId === id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load.')
    }
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  )

  if (error || !client) return (
    <div className="p-6">
      <p className="text-destructive text-sm">{error || 'Client not found.'}</p>
      <Link href="/master/clients" className="text-primary text-sm underline mt-2 inline-block">Back to Clients</Link>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/master/clients" className="hover:text-foreground transition-colors">Clients</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{client.businessName}</span>
      </nav>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{client.businessName}</h1>
            <Badge variant={client.active ? 'default' : 'secondary'} className="text-xs">
              {client.active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant="outline" className="text-xs capitalize">{client.source}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {client.contactName} ·{' '}
            <a href={`tel:${client.mobile}`} className="text-primary hover:underline">{client.mobile}</a>
          </p>
        </div>
        <Link href={`/master/clients/${id}/send-link`}>
          <Button size="sm" variant="outline" className="gap-1.5">
            <Share2 className="w-3.5 h-3.5" /> Send Catalog Link
          </Button>
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Order history */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="font-semibold text-sm">Order History</h2>
          <div className="rounded-lg border border-border overflow-x-auto">
            {orders.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p className="text-sm">No orders yet for this client.</p>
                <Link href="/orders/new" className="mt-3">
                  <Button size="sm" variant="outline">Create Order</Button>
                </Link>
              </div>
            ) : (
              <table className="w-full text-sm min-w-[480px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Items</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(o => (
                    <tr key={o.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <Link href={`/orders/${o.id}`} className="font-mono text-xs text-primary hover:underline">
                          {o.number}
                        </Link>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[o.status] ?? ''}`}>
                          {o.status.replace(/-/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="text-[10px] capitalize">{o.source}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {format(new Date(o.createdAt), 'dd MMM yyyy')}
                      </td>
                      <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                        {o.lines.length} line{o.lines.length !== 1 ? 's' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Client info */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-3 text-sm">
            <h2 className="font-semibold text-sm">Details</h2>
            <div className="space-y-2">
              {client.gstin && (
                <div>
                  <p className="text-xs text-muted-foreground">GSTIN</p>
                  <p className="font-mono text-xs">{client.gstin}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-muted-foreground">Billing Address</p>
                <p className="text-sm">{client.billingAddress || '—'}</p>
              </div>
              {client.shippingAddress && (
                <div>
                  <p className="text-xs text-muted-foreground">Shipping Address</p>
                  <p className="text-sm">{client.shippingAddress}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="text-xs text-muted-foreground">Credit Limit</p>
                  <p className="font-semibold">{inrFmt.format(client.creditLimit)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Credit Days</p>
                  <p className="font-semibold">{client.creditDays} days</p>
                </div>
              </div>
              {client.notes && (
                <div className="pt-1">
                  <p className="text-xs text-muted-foreground">Notes</p>
                  <p className="text-sm text-muted-foreground">{client.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
