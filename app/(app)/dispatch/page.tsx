'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import {
  getDeliveries, createDelivery, markOutForDelivery,
  confirmDelivery, failDelivery,
} from '@/lib/services/dispatch'
import { getOrders } from '@/lib/services/orders'
import type { Delivery, Order, DeliveryMode } from '@/lib/types'
import { mockUsers, mockClients } from '@/lib/mock-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Truck, MapPin, Phone, AlertTriangle, CheckCircle2, Package } from 'lucide-react'

function resolveClient(clientId: string) {
  return mockClients.find(c => c.id === clientId)
}
function resolveUser(userId: string) {
  return mockUsers.find(u => u.id === userId)
}
const riders = mockUsers.filter(u => u.role === 'delivery-team')

// ——————————————————————————————————————————
// Ready for Dispatch Tab
// ——————————————————————————————————————————
function ReadyForDispatchTab({ onDispatched }: { onDispatched: () => void }) {
  const { user } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [modes, setModes] = useState<Record<string, DeliveryMode>>({})
  const [riderAssign, setRiderAssign] = useState<Record<string, string>>({})
  const [dispatching, setDispatching] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await getOrders(['ready-for-dispatch', 'packed'])
    setOrders(all)
    const initModes: Record<string, DeliveryMode> = {}
    all.forEach(o => { initModes[o.id] = 'delivery-team' })
    setModes(initModes)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDispatch(orderId: string) {
    setDispatching(orderId)
    const mode = modes[orderId] ?? 'delivery-team'
    const riderId = mode === 'delivery-team' ? riderAssign[orderId] : undefined
    await createDelivery(orderId, mode, riderId)
    await load()
    onDispatched()
    setDispatching(null)
  }

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>

  if (!orders.length) {
    return (
      <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
        <Package className="w-10 h-10 opacity-30" />
        <p className="text-sm">No orders ready for dispatch</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Delivery Address</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mode</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rider</th>
            <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(o => {
            const client = resolveClient(o.clientId)
            const mode = modes[o.id] ?? 'delivery-team'
            return (
              <tr key={o.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">{o.number}</td>
                <td className="px-4 py-3">
                  <p className="font-medium">{client?.businessName}</p>
                  <p className="text-xs text-muted-foreground">{client?.contactName}</p>
                </td>
                <td className="px-4 py-3 max-w-48 truncate">{o.deliveryAddress ?? client?.billingAddress}</td>
                <td className="px-4 py-3">
                  <Select
                    value={mode}
                    onValueChange={v => setModes(prev => ({ ...prev, [o.id]: v as DeliveryMode }))}
                  >
                    <SelectTrigger className="h-8 w-36 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delivery-team">Delivery Team</SelectItem>
                      <SelectItem value="self-delivery">Self Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="px-4 py-3">
                  {mode === 'delivery-team' ? (
                    <Select
                      value={riderAssign[o.id] ?? ''}
                      onValueChange={v => setRiderAssign(prev => ({ ...prev, [o.id]: v ?? '' }))}
                    >
                      <SelectTrigger className="h-8 w-36 text-xs">
                        <SelectValue placeholder="Assign rider" />
                      </SelectTrigger>
                      <SelectContent>
                        {riders.map(r => (
                          <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    size="sm"
                    disabled={dispatching === o.id || (mode === 'delivery-team' && !riderAssign[o.id])}
                    onClick={() => handleDispatch(o.id)}
                    className="py-3"
                  >
                    {dispatching === o.id ? 'Dispatching…' : 'Dispatch'}
                  </Button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ——————————————————————————————————————————
// Delivery Confirmation Dialog
// ——————————————————————————————————————————
function DeliveryConfirmDialog({
  delivery,
  order,
  open,
  onOpenChange,
  onDone,
}: {
  delivery: Delivery
  order: Order
  open: boolean
  onOpenChange: (o: boolean) => void
  onDone: () => void
}) {
  const [otp, setOtp] = useState('')
  const [usePhoto, setUsePhoto] = useState(false)
  const [receiverName, setReceiverName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleConfirm() {
    setSaving(true)
    setError('')
    try {
      await confirmDelivery(delivery.id, {
        proofType: usePhoto ? 'photo' : 'otp',
        otp: usePhoto ? undefined : otp,
        receiverName: receiverName || undefined,
        proofUrl: usePhoto ? 'placeholder-photo.jpg' : undefined,
      })
      onDone()
      onOpenChange(false)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delivery confirmation failed.')
    } finally {
      setSaving(false)
    }
  }

  const client = resolveClient(order.clientId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Confirm Delivery</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="bg-muted/40 rounded-lg p-3 text-sm space-y-1">
            <p className="font-medium">{client?.businessName}</p>
            <p className="text-muted-foreground text-xs">{client?.contactName} · {client?.mobile}</p>
          </div>

          {!usePhoto ? (
            <div className="space-y-2">
              <Label className="text-sm">Enter delivery OTP</Label>
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
            <div className="space-y-2">
              <div className="border-2 border-dashed rounded-lg p-6 text-center text-muted-foreground text-sm">
                📷 Photo proof placeholder
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Receiver name</Label>
                <Input
                  placeholder="Name of person who received"
                  value={receiverName}
                  onChange={e => setReceiverName(e.target.value)}
                />
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setUsePhoto(p => !p)}
            className="text-xs text-primary underline"
          >
            {usePhoto ? 'Use OTP instead' : "Can't get OTP? Use photo proof"}
          </button>

          {error && <p className="text-xs text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={handleConfirm}
            disabled={saving || (!usePhoto && otp.length !== 4) || (usePhoto && !receiverName)}
            className="py-3"
          >
            {saving ? 'Confirming…' : 'Confirm Delivered'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ——————————————————————————————————————————
// Fail Delivery Dialog
// ——————————————————————————————————————————
function FailDeliveryDialog({
  delivery,
  open,
  onOpenChange,
  onDone,
}: {
  delivery: Delivery
  open: boolean
  onOpenChange: (o: boolean) => void
  onDone: () => void
}) {
  const [reason, setReason] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleFail() {
    if (!reason) return
    setSaving(true)
    await failDelivery(delivery.id, reason)
    onDone()
    onOpenChange(false)
    setSaving(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-4 h-4" /> Failed Delivery
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Label className="text-sm">Reason for failure</Label>
          <Select value={reason} onValueChange={(v) => v && setReason(v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select reason" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="not available">Customer not available</SelectItem>
              <SelectItem value="refused">Customer refused delivery</SelectItem>
              <SelectItem value="wrong address">Wrong address</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="destructive" disabled={!reason || saving} onClick={handleFail} className="py-3">
            {saving ? 'Saving…' : 'Mark Failed'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ——————————————————————————————————————————
// Out for Delivery Tab
// ——————————————————————————————————————————
function OutForDeliveryTab({ onDone }: { onDone: () => void }) {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [confirmTarget, setConfirmTarget] = useState<{ delivery: Delivery; order: Order } | null>(null)
  const [failTarget, setFailTarget] = useState<Delivery | null>(null)
  const [marking, setMarking] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const [dels, ords] = await Promise.all([
      getDeliveries(),
      getOrders(['dispatched', 'out-for-delivery']),
    ])
    let filtered = dels.filter(d => d.status === 'assigned' || d.status === 'out-for-delivery')
    if (user?.role === 'delivery-team') {
      filtered = filtered.filter(d => d.riderId === user.id)
    }
    setDeliveries(filtered)
    setOrders(ords)
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  async function handleMarkOut(deliveryId: string) {
    setMarking(deliveryId)
    await markOutForDelivery(deliveryId)
    await load()
    setMarking(null)
  }

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>

  if (!deliveries.length) {
    return (
      <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
        <Truck className="w-10 h-10 opacity-30" />
        <p className="text-sm">No active deliveries</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {deliveries.map(d => {
        const order = orders.find(o => o.id === d.orderId)
        if (!order) return null
        const client = resolveClient(order.clientId)
        const rider = d.riderId ? resolveUser(d.riderId) : null
        const isOut = d.status === 'out-for-delivery'

        return (
          <Card key={d.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="font-mono">{order.number}</span>
                <Badge className={isOut ? 'bg-amber-500/15 text-amber-500' : 'bg-muted text-muted-foreground'}>
                  {isOut ? 'Out for Delivery' : 'Assigned'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="font-medium">{client?.businessName}</p>
                  <p className="text-muted-foreground text-xs">{client?.contactName}</p>
                  <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                    <Phone className="w-3 h-3" />
                    <span>{client?.mobile}</span>
                  </div>
                </div>
                <div>
                  <div className="flex items-start gap-1 text-xs">
                    <MapPin className="w-3 h-3 mt-0.5 shrink-0 text-muted-foreground" />
                    <span className="text-muted-foreground">{order.deliveryAddress ?? client?.billingAddress}</span>
                  </div>
                  {rider && <p className="text-xs text-muted-foreground mt-1">Rider: {rider.name}</p>}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  disabled
                >
                  <MapPin className="w-3 h-3 mr-1" />
                  Open in Maps
                </Button>
              </div>

              {isOut && d.otp && (
                <div className="bg-muted/50 rounded-lg px-3 py-2 text-sm">
                  OTP sent to customer: <span className="font-mono font-bold tracking-widest">{d.otp}</span>
                </div>
              )}

              <div className="flex gap-2 flex-wrap">
                {!isOut && (
                  <Button
                    size="sm"
                    className="py-3"
                    disabled={marking === d.id}
                    onClick={() => handleMarkOut(d.id)}
                  >
                    {marking === d.id ? 'Sending OTP…' : 'Mark Out for Delivery'}
                  </Button>
                )}
                {isOut && (
                  <Button
                    size="sm"
                    className="py-3 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => order && setConfirmTarget({ delivery: d, order })}
                  >
                    <CheckCircle2 className="w-4 h-4 mr-1.5" />
                    Confirm Delivery
                  </Button>
                )}
                {isOut && (
                  <Button
                    size="sm"
                    variant="destructive"
                    className="py-3"
                    onClick={() => setFailTarget(d)}
                  >
                    Failed Delivery
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )
      })}

      {confirmTarget && (
        <DeliveryConfirmDialog
          delivery={confirmTarget.delivery}
          order={confirmTarget.order}
          open={true}
          onOpenChange={() => setConfirmTarget(null)}
          onDone={() => { load(); onDone() }}
        />
      )}
      {failTarget && (
        <FailDeliveryDialog
          delivery={failTarget}
          open={true}
          onOpenChange={() => setFailTarget(null)}
          onDone={() => { load(); onDone() }}
        />
      )}
    </div>
  )
}

// ——————————————————————————————————————————
// Delivery History Tab
// ——————————————————————————————————————————
function DeliveryHistoryTab() {
  const { user } = useAuth()
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDeliveries(), getOrders(['delivered', 'failed-delivery', 'closed'])]).then(([dels, ords]) => {
      let filtered = dels.filter(d => d.status === 'delivered' || d.status === 'failed')
      if (user?.role === 'delivery-team') {
        filtered = filtered.filter(d => d.riderId === user.id)
      }
      setDeliveries(filtered)
      setOrders(ords)
      setLoading(false)
    })
  }, [user])

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>

  if (!deliveries.length) {
    return (
      <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
        <CheckCircle2 className="w-10 h-10 opacity-30" />
        <p className="text-sm">No delivery history yet</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/40">
          <tr>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mode</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Rider</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Proof</th>
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Delivered At</th>
          </tr>
        </thead>
        <tbody>
          {deliveries.map(d => {
            const order = orders.find(o => o.id === d.orderId)
            const client = order ? resolveClient(order.clientId) : null
            const rider = d.riderId ? resolveUser(d.riderId) : null
            return (
              <tr key={d.id} className="border-t border-border hover:bg-muted/20">
                <td className="px-4 py-3 font-mono text-xs">{order?.number ?? '—'}</td>
                <td className="px-4 py-3">{client?.businessName ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className="text-xs capitalize">{d.mode.replace('-', ' ')}</span>
                </td>
                <td className="px-4 py-3">{rider?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <Badge className={d.status === 'delivered' ? 'bg-green-500/15 text-green-500' : 'bg-destructive/15 text-destructive'}>
                    {d.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {d.proofType === 'otp' ? (
                    <span className="text-xs text-muted-foreground">OTP</span>
                  ) : d.proofType === 'photo' ? (
                    <span className="text-xs text-muted-foreground">Photo · {d.receiverName}</span>
                  ) : d.failureReason ? (
                    <span className="text-xs text-destructive">{d.failureReason}</span>
                  ) : '—'}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {d.deliveredAt ? format(new Date(d.deliveredAt), 'd MMM, HH:mm') : '—'}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ——————————————————————————————————————————
// Main Page
// ——————————————————————————————————————————
export default function DispatchPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dispatch &amp; Delivery</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage dispatch assignments, OTP delivery confirmation, and delivery history</p>
      </div>

      <Tabs defaultValue="ready">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="ready" className="text-sm">
            <Package className="w-4 h-4 mr-1.5" />Ready
          </TabsTrigger>
          <TabsTrigger value="out" className="text-sm">
            <Truck className="w-4 h-4 mr-1.5" />Out for Delivery
          </TabsTrigger>
          <TabsTrigger value="history" className="text-sm">
            <CheckCircle2 className="w-4 h-4 mr-1.5" />History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ready" className="mt-4">
          <ReadyForDispatchTab onDispatched={() => setRefreshKey(k => k + 1)} />
        </TabsContent>
        <TabsContent value="out" className="mt-4">
          <OutForDeliveryTab key={refreshKey} onDone={() => setRefreshKey(k => k + 1)} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <DeliveryHistoryTab key={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
