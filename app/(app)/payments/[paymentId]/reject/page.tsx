'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getPayments, rejectPayment } from '@/lib/services/payments'
import { getOrders } from '@/lib/services/orders'
import { getClients } from '@/lib/services/clients'
import type { Payment, Order, Client } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronRight, XCircle } from 'lucide-react'

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function RejectPaymentPage() {
  const { paymentId } = useParams<{ paymentId: string }>()
  const router = useRouter()

  const [payment, setPayment] = useState<Payment | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getPayments(), getOrders(), getClients()]).then(([pays, orders, clients]) => {
      const p = pays.find(p => p.id === paymentId) ?? null
      setPayment(p)
      if (p) {
        const o = orders.find(o => o.id === p.orderId) ?? null
        setOrder(o)
        if (o) setClient(clients.find(c => c.id === o.clientId) ?? null)
      }
      setLoading(false)
    })
  }, [paymentId])

  async function handleReject() {
    if (!payment || !reason.trim()) return
    setSaving(true)
    setError('')
    try {
      await rejectPayment(payment.id, reason)
      router.push('/payments')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to reject payment.')
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  )

  if (!payment) return (
    <div className="p-6">
      <p className="text-muted-foreground">Payment not found.</p>
      <Link href="/payments" className="text-primary text-sm underline mt-2 inline-block">Back to Payments</Link>
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/payments" className="hover:text-foreground transition-colors">Payments</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Reject Payment</span>
      </nav>

      <div className="flex items-center gap-2">
        <XCircle className="w-5 h-5 text-destructive" />
        <h1 className="text-xl font-semibold">Reject Payment</h1>
      </div>

      <div className="bg-muted/40 rounded-lg p-4 text-sm space-y-2">
        {client && <p className="font-medium">{client.businessName}</p>}
        {order && <p className="text-muted-foreground text-xs font-mono">{order.number}</p>}
        <div className="flex items-center gap-3">
          <span className="font-semibold text-base">{inr(payment.amount)}</span>
          <span className="text-xs uppercase text-muted-foreground">{payment.mode}</span>
          {payment.utrReference && (
            <span className="text-xs font-mono text-muted-foreground">{payment.utrReference}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2 md:col-span-2">
          <Label>Reason for rejection</Label>
          <Textarea
            rows={4}
            placeholder="Describe the issue (UTR mismatch, incorrect amount, etc.)"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push('/payments')}>Cancel</Button>
        <Button
          variant="destructive"
          disabled={!reason.trim() || saving}
          onClick={handleReject}
          className="flex-1"
        >
          {saving ? 'Rejecting…' : 'Reject Payment'}
        </Button>
      </div>
    </div>
  )
}
