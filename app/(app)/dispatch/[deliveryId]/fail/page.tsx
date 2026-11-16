'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getDeliveries, failDelivery } from '@/lib/services/dispatch'
import { getOrders } from '@/lib/services/orders'
import type { Delivery, Order } from '@/lib/types'
import { mockClients } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, ChevronRight } from 'lucide-react'

export default function FailDeliveryPage() {
  const { deliveryId } = useParams<{ deliveryId: string }>()
  const router = useRouter()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([getDeliveries(), getOrders()]).then(([deliveries, orders]) => {
      const d = deliveries.find(d => d.id === deliveryId) ?? null
      setDelivery(d)
      if (d) setOrder(orders.find(o => o.id === d.orderId) ?? null)
      setLoading(false)
    })
  }, [deliveryId])

  async function handleFail() {
    if (!delivery || !reason) return
    setSaving(true)
    await failDelivery(delivery.id, reason)
    router.push('/dispatch')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  )

  if (!delivery || !order) return (
    <div className="p-6">
      <p className="text-muted-foreground">Delivery not found.</p>
      <Link href="/dispatch" className="text-primary text-sm underline mt-2 inline-block">Back to Dispatch</Link>
    </div>
  )

  const client = mockClients.find(c => c.id === order.clientId)

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/dispatch" className="hover:text-foreground transition-colors">Dispatch</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Failed Delivery</span>
      </nav>

      <div className="flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <h1 className="text-xl font-semibold text-destructive">Failed Delivery</h1>
      </div>

      <div className="bg-muted/40 rounded-lg p-4 text-sm space-y-1">
        <p className="font-medium">{client?.businessName}</p>
        <p className="text-muted-foreground text-xs">{client?.contactName} · {client?.mobile}</p>
        <p className="text-xs font-mono text-muted-foreground">{order.number}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label>Reason for failure</Label>
          <Select value={reason} onValueChange={v => v && setReason(v)}>
            <SelectTrigger>
              <SelectValue>{(val: string) => val ? ({ 'not available': 'Customer not available', 'refused': 'Customer refused delivery', 'wrong address': 'Wrong address', 'other': 'Other' }[val] ?? val) : 'Select reason'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not available">Customer not available</SelectItem>
              <SelectItem value="refused">Customer refused delivery</SelectItem>
              <SelectItem value="wrong address">Wrong address</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push('/dispatch')}>Cancel</Button>
        <Button
          variant="destructive"
          disabled={!reason || saving}
          onClick={handleFail}
          className="flex-1"
        >
          {saving ? 'Saving…' : 'Mark Failed'}
        </Button>
      </div>
    </div>
  )
}
