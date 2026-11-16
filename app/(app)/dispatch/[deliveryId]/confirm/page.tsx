'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getDeliveries, confirmDelivery } from '@/lib/services/dispatch'
import { getOrders } from '@/lib/services/orders'
import type { Delivery, Order } from '@/lib/types'
import { mockClients } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronRight } from 'lucide-react'

export default function ConfirmDeliveryPage() {
  const { deliveryId } = useParams<{ deliveryId: string }>()
  const router = useRouter()

  const [delivery, setDelivery] = useState<Delivery | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  const [otp, setOtp] = useState('')
  const [usePhoto, setUsePhoto] = useState(false)
  const [receiverName, setReceiverName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getDeliveries(), getOrders()]).then(([deliveries, orders]) => {
      const d = deliveries.find(d => d.id === deliveryId) ?? null
      setDelivery(d)
      if (d) setOrder(orders.find(o => o.id === d.orderId) ?? null)
      setLoading(false)
    })
  }, [deliveryId])

  async function handleConfirm() {
    if (!delivery) return
    setSaving(true)
    setError('')
    try {
      await confirmDelivery(delivery.id, {
        proofType: usePhoto ? 'photo' : 'otp',
        otp: usePhoto ? undefined : otp,
        receiverName: receiverName || undefined,
        proofUrl: usePhoto ? 'placeholder-photo.jpg' : undefined,
      })
      router.push('/dispatch')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delivery confirmation failed.')
      setSaving(false)
    }
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
        <span className="text-foreground font-medium">Confirm Delivery</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Confirm Delivery</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{order.number}</p>
      </div>

      <div className="bg-muted/40 rounded-lg p-4 text-sm space-y-1">
        <p className="font-medium">{client?.businessName}</p>
        <p className="text-muted-foreground text-xs">{client?.contactName} · {client?.mobile}</p>
        <p className="text-xs text-muted-foreground">{order.deliveryAddress ?? client?.billingAddress}</p>
      </div>

      {delivery.otp && (
        <div className="bg-muted/50 rounded-lg px-4 py-3 text-sm">
          OTP sent to customer: <span className="font-mono font-bold tracking-widest ml-2">{delivery.otp}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {!usePhoto ? (
          <div className="space-y-2 md:col-span-2">
            <Label>Enter delivery OTP</Label>
            <Input
              type="text"
              inputMode="numeric"
              maxLength={4}
              placeholder="4-digit OTP"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
              className="text-2xl text-center tracking-widest h-14 font-mono"
            />
            <p className="text-xs text-muted-foreground">OTP was sent to customer via WhatsApp.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 md:col-span-2">
              <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground text-sm">
                📷 Photo proof placeholder
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Receiver name</Label>
              <Input
                placeholder="Name of person who received"
                value={receiverName}
                onChange={e => setReceiverName(e.target.value)}
              />
            </div>
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => setUsePhoto(p => !p)}
        className="text-xs text-primary underline"
      >
        {usePhoto ? 'Use OTP instead' : "Can't get OTP? Use photo proof"}
      </button>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push('/dispatch')}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          disabled={saving || (!usePhoto && otp.length !== 4) || (usePhoto && !receiverName)}
          className="flex-1"
        >
          {saving ? 'Confirming…' : 'Confirm Delivered'}
        </Button>
      </div>
    </div>
  )
}
