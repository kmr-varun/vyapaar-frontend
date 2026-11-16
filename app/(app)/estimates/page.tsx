'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { getEstimates, sendEstimate, reviseEstimate, refreshExpiredEstimate } from '@/lib/services/estimates'
import { getOrders } from '@/lib/services/orders'
import type { Estimate, Order } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, RefreshCw, Send, FilePen, ChevronRight } from 'lucide-react'

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft:    { label: 'Draft',    className: 'bg-muted text-muted-foreground' },
  priced:   { label: 'Priced',   className: 'bg-blue-500/15 text-blue-500' },
  sent:     { label: 'Sent',     className: 'bg-green-500/15 text-green-500' },
  expired:  { label: 'Expired',  className: 'bg-amber-500/15 text-amber-600' },
  replaced: { label: 'Replaced', className: 'bg-muted/60 text-muted-foreground line-through' },
}

const modeConfig: Record<string, { label: string; className: string }> = {
  upi:    { label: 'UPI',    className: 'bg-purple-500/15 text-purple-500' },
  bank:   { label: 'Bank',   className: 'bg-blue-500/15 text-blue-400' },
  cash:   { label: 'Cash',   className: 'bg-green-500/15 text-green-500' },
  credit: { label: 'Credit', className: 'bg-orange-500/15 text-orange-500' },
}

export default function EstimatesPage() {
  const { can } = useAuth()
  const router = useRouter()
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [ests, ords] = await Promise.all([
      getEstimates(),
      getOrders(['confirmed']),
    ])
    setEstimates(ests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setOrders(ords)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const isExpired = (e: Estimate) => e.status === 'sent' && new Date(e.validUntil) < new Date()

  async function handleSend(id: string, ev: React.MouseEvent) {
    ev.stopPropagation()
    setActionLoading(id)
    try {
      await sendEstimate(id)
      await load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRevise(id: string, ev: React.MouseEvent) {
    ev.stopPropagation()
    setActionLoading(id + '-revise')
    try {
      await reviseEstimate(id)
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRefresh(id: string, ev: React.MouseEvent) {
    ev.stopPropagation()
    setActionLoading(id + '-refresh')
    try {
      await refreshExpiredEstimate(id)
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading estimates…</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Estimates</h1>
          <p className="text-sm text-muted-foreground">{estimates.length} total</p>
        </div>
        {can('create-estimate') && (
          <Link href="/estimates/new">
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1.5" /> Create Estimate
            </Button>
          </Link>
        )}
      </div>

      {estimates.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No estimates yet.</CardContent></Card>
      ) : (
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Number</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mode</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Valid Until</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {estimates.map(e => (
                <tr
                  key={e.id}
                  className="border-t border-border cursor-pointer hover:bg-muted/40"
                  onClick={() => router.push(`/estimates/${e.id}`)}
                >
                  <td className="px-4 py-3 font-mono">{e.number}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {orders.find(o => o.id === e.orderId)?.number ?? e.orderId.slice(0, 8)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig[isExpired(e) ? 'expired' : e.status]?.className}`}>
                      {statusConfig[isExpired(e) ? 'expired' : e.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${modeConfig[e.paymentMode]?.className}`}>
                      {modeConfig[e.paymentMode]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{inr(e.totalAmount)}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(e.validUntil), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(e.createdAt), 'dd MMM yyyy')}</td>
                  <td className="px-4 py-3" onClick={ev => ev.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {e.status === 'priced' && (
                        <Button size="sm" variant="default" className="h-7 text-xs"
                          disabled={actionLoading === e.id}
                          onClick={ev => handleSend(e.id, ev)}>
                          <Send className="w-3 h-3 mr-1" /> Send
                        </Button>
                      )}
                      {e.status === 'sent' && !isExpired(e) && can('send-estimate') && (
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          disabled={actionLoading === e.id + '-revise'}
                          onClick={ev => handleRevise(e.id, ev)}>
                          <FilePen className="w-3 h-3 mr-1" /> Revise
                        </Button>
                      )}
                      {isExpired(e) && (
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          disabled={actionLoading === e.id + '-refresh'}
                          onClick={ev => handleRefresh(e.id, ev)}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                        </Button>
                      )}
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-1" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
