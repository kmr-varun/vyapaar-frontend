'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { getOrders, logCall, updateOrderStatus } from '@/lib/services/orders'
import { createPickList } from '@/lib/services/picking'
import { recordAndVerifyPayment } from '@/lib/services/payments'
import { getClients } from '@/lib/services/clients'
import { getVariants } from '@/lib/services/variants'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import { getEstimates } from '@/lib/services/estimates'
import { getPayments } from '@/lib/services/payments'
import type { Order, Client, Variant, Brand, Product, Estimate, Payment } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { ChevronRight, Phone, Plus, FileText, Truck, PackageCheck, ArrowRight } from 'lucide-react'
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

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const router = useRouter()

  const [order, setOrder] = useState<Order | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  const [showCallForm, setShowCallForm] = useState(false)
  const [callOutcome, setCallOutcome] = useState('')
  const [callNotes, setCallNotes] = useState('')
  const [callCancelReason, setCallCancelReason] = useState('')
  const [callLoading, setCallLoading] = useState(false)

  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [payAmount, setPayAmount] = useState('')
  const [payMode, setPayMode] = useState('upi')
  const [payUtr, setPayUtr] = useState('')
  const [payLoading, setPayLoading] = useState(false)

  const load = useCallback(async () => {
    const [orders, cls, vs, bs, ps, ests, pays] = await Promise.all([
      getOrders(), getClients(), getVariants(), getBrands(), getProducts(),
      getEstimates(id), getPayments(id),
    ])
    const found = orders.find(o => o.id === id)
    setOrder(found ?? null)
    setClients(cls); setVariants(vs); setBrands(bs); setProducts(ps)
    setEstimates(ests); setPayments(pays)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  function clientName() {
    if (!order) return '—'
    const c = clients.find(c => c.id === order.clientId)
    return c ? `${c.businessName} (${c.contactName})` : order.clientId
  }

  function variantLabel(variantId: string) {
    const v = variants.find(v => v.id === variantId)
    if (!v) return variantId
    const p = products.find(p => p.id === v.productId)
    return `${p?.name ?? ''} — ${v.flavour} ${v.packSize}${v.packUnit}`
  }

  async function advanceStatus(status: string) {
    if (!order) return
    if (status === 'in-warehouse') {
      await createPickList(order)
    } else {
      await updateOrderStatus(order.id, status as Order['status'])
    }
    await load()
  }

  async function handleRecordPayment() {
    if (!order || !payAmount) return
    const sentEstimate = estimates.find(e => e.status === 'sent') ?? estimates[0]
    if (!sentEstimate) return
    setPayLoading(true)
    try {
      await recordAndVerifyPayment({
        orderId: order.id,
        estimateId: sentEstimate.id,
        amount: parseFloat(payAmount),
        mode: payMode as 'upi' | 'bank' | 'cash' | 'credit',
        utrReference: payUtr || undefined,
        verifiedBy: user?.id ?? 'u1',
      })
      await load()
      setShowPaymentForm(false)
      setPayAmount('')
      setPayUtr('')
    } finally {
      setPayLoading(false)
    }
  }

  async function handleLogCall() {
    if (!order || !callOutcome) return
    setCallLoading(true)
    try {
      await logCall(order.id, {
        outcome: callOutcome as Order['callLogs'][0]['outcome'],
        notes: callNotes || undefined,
        cancelReason: callOutcome === 'cancelled' ? callCancelReason : undefined,
        userId: user?.id ?? 'u1',
      })
      await load()
      setShowCallForm(false)
      setCallOutcome('')
      setCallNotes('')
      setCallCancelReason('')
    } finally {
      setCallLoading(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  )

  if (!order) return (
    <div className="p-6">
      <p className="text-muted-foreground">Order not found.</p>
      <Link href="/orders" className="text-primary text-sm underline mt-2 inline-block">Back to Orders</Link>
    </div>
  )

  const client = clients.find(c => c.id === order.clientId)

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/orders" className="hover:text-foreground transition-colors">Orders</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{order.number}</span>
      </nav>

      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{order.number}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_COLORS[order.status] ?? ''}`}>
              {order.status.replace(/-/g, ' ')}
            </span>
            <Badge variant="outline" className="text-[10px] capitalize">{order.source}</Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Created {format(new Date(order.createdAt), 'dd MMM yyyy, HH:mm')}
          </p>
        </div>
      </div>

      {/* Pipeline actions */}
      {order.status === 'confirmed' && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">Ready for estimate</p>
            <p className="text-xs text-muted-foreground mt-0.5">Create a priced estimate to send to this client</p>
          </div>
          <Link href={`/estimates/new?orderId=${order.id}`}>
            <Button size="sm" className="gap-1.5"><FileText className="w-3.5 h-3.5" /> Create Estimate</Button>
          </Link>
        </div>
      )}
      {order.status === 'estimate-sent' && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">Estimate sent — awaiting payment</p>
            <p className="text-xs text-muted-foreground mt-0.5">Mark as payment pending once client confirms</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => advanceStatus('payment-pending')}>
            <ArrowRight className="w-3.5 h-3.5" /> Mark Payment Pending
          </Button>
        </div>
      )}
      {order.status === 'payment-pending' && (
        <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium">Payment pending</p>
              <p className="text-xs text-muted-foreground mt-0.5">Record payment received from client</p>
            </div>
            {!showPaymentForm && (
              <Button size="sm" className="gap-1.5" onClick={() => setShowPaymentForm(true)}>
                <ArrowRight className="w-3.5 h-3.5" /> Record Payment
              </Button>
            )}
          </div>
          {showPaymentForm && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1 border-t border-yellow-500/20">
              <div className="space-y-1">
                <Label className="text-xs">Amount (₹) <span className="text-destructive">*</span></Label>
                <Input className="h-8 text-xs" type="number" placeholder={estimates[0] ? String(estimates[0].totalAmount) : '0'} value={payAmount} onChange={e => setPayAmount(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mode</Label>
                <Select value={payMode} onValueChange={v => v && setPayMode(v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">UTR / Reference</Label>
                <Input className="h-8 text-xs" placeholder="Optional" value={payUtr} onChange={e => setPayUtr(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" className="h-8 text-xs" disabled={payLoading || !payAmount || !estimates.length} onClick={handleRecordPayment}>
                  {payLoading ? 'Saving…' : 'Verify & Save'}
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => setShowPaymentForm(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>
      )}
      {order.status === 'payment-verified' && (
        <div className="rounded-lg border border-cyan-500/30 bg-cyan-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">Payment verified</p>
            <p className="text-xs text-muted-foreground mt-0.5">Move order to warehouse for picking</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => advanceStatus('in-warehouse')}>
            <PackageCheck className="w-3.5 h-3.5" /> Move to Warehouse
          </Button>
        </div>
      )}
      {order.status === 'in-warehouse' && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">In warehouse</p>
            <p className="text-xs text-muted-foreground mt-0.5">Start the picking process for this order</p>
          </div>
          <Link href={`/picking?orderId=${order.id}`}>
            <Button size="sm" className="gap-1.5"><PackageCheck className="w-3.5 h-3.5" /> Go to Picking</Button>
          </Link>
        </div>
      )}
      {order.status === 'packed' && (
        <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">Packed — ready for dispatch</p>
            <p className="text-xs text-muted-foreground mt-0.5">Create a delivery to dispatch this order</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => advanceStatus('ready-for-dispatch')}>
            <ArrowRight className="w-3.5 h-3.5" /> Mark Ready for Dispatch
          </Button>
        </div>
      )}
      {order.status === 'ready-for-dispatch' && (
        <div className="rounded-lg border border-violet-500/30 bg-violet-500/5 p-4 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-sm font-medium">Ready for dispatch</p>
            <p className="text-xs text-muted-foreground mt-0.5">Create a delivery to dispatch this order</p>
          </div>
          <Link href="/dispatch">
            <Button size="sm" className="gap-1.5"><Truck className="w-3.5 h-3.5" /> Go to Dispatch</Button>
          </Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          {/* Client */}
          <div className="rounded-lg border border-border p-4 space-y-2 text-sm">
            <h2 className="font-semibold text-sm">Client</h2>
            {client ? (
              <div className="space-y-1">
                <p className="font-medium">{client.businessName}</p>
                <p className="text-muted-foreground">{client.contactName} · {client.mobile}</p>
                {order.deliveryAddress && <p className="text-muted-foreground">{order.deliveryAddress}</p>}
                {order.preferredDeliveryDate && <p className="text-muted-foreground">Preferred: {format(new Date(order.preferredDeliveryDate), 'dd MMM yyyy')}</p>}
                <a href={`tel:${client.mobile}`} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                  <Phone className="w-3 h-3" /> Call {client.contactName}
                </a>
              </div>
            ) : (
              <p className="text-muted-foreground">{clientName()}</p>
            )}
          </div>

          {/* Lines */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h2 className="font-semibold text-sm">Products</h2>
            <div className="space-y-2">
              {order.lines.map(l => (
                <div key={l.id} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{variantLabel(l.variantId)}</span>
                  <span className="font-medium shrink-0 ml-4">
                    {l.qtyCartons > 0 ? `${l.qtyCartons} ctn` : ''}
                    {l.qtyPacks > 0 ? ` ${l.qtyPacks} pks` : ''}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Estimates */}
          {estimates.length > 0 && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h2 className="font-semibold text-sm">Estimates</h2>
              <div className="space-y-2">
                {estimates.map(e => (
                  <div key={e.id} className="flex items-center justify-between text-sm">
                    <Link href={`/estimates/${e.id}`} className="font-mono text-xs text-primary hover:underline">{e.number}</Link>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        e.status === 'sent' ? 'bg-purple-500/20 text-purple-400' :
                        e.status === 'priced' ? 'bg-blue-500/20 text-blue-400' :
                        e.status === 'replaced' ? 'bg-muted text-muted-foreground' :
                        'bg-muted text-muted-foreground'
                      }`}>{e.status}</span>
                      <span className="text-muted-foreground text-xs">₹{e.totalAmount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payments */}
          {payments.length > 0 && (
            <div className="rounded-lg border border-border p-4 space-y-3">
              <h2 className="font-semibold text-sm">Payments</h2>
              <div className="space-y-2">
                {payments.map(p => (
                  <div key={p.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground capitalize text-xs">{p.mode}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        p.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                        p.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                        'bg-yellow-500/20 text-yellow-400'
                      }`}>{p.status}</span>
                      <span className="font-medium">₹{p.amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Call log */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm">Call Log</h2>
              {!showCallForm && (
                <Button variant="outline" size="sm" className="h-7 px-2 text-xs gap-1" onClick={() => setShowCallForm(true)}>
                  <Plus className="w-3 h-3" /> Log Call
                </Button>
              )}
            </div>

            {showCallForm && (
              <div className="space-y-3 pb-3 border-b border-border">
                <div className="space-y-1.5">
                  <Label className="text-xs">Outcome</Label>
                  <Select value={callOutcome} onValueChange={v => v && setCallOutcome(v)}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue>{(val: string) => ({ confirmed: 'Confirmed', 'changes-requested': 'Changes Requested', 'not-reachable': 'Not Reachable', cancelled: 'Cancelled' }[val] ?? (val || 'Select outcome'))}</SelectValue></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="changes-requested">Changes Requested</SelectItem>
                      <SelectItem value="not-reachable">Not Reachable</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {callOutcome === 'cancelled' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Cancellation reason <span className="text-destructive">*</span></Label>
                    <Input className="h-8 text-xs" value={callCancelReason} onChange={e => setCallCancelReason(e.target.value)} placeholder="Why cancelled?" />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label className="text-xs">Notes</Label>
                  <Textarea rows={2} className="text-xs" value={callNotes} onChange={e => setCallNotes(e.target.value)} placeholder="Optional notes…" />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 px-3 text-xs" onClick={handleLogCall}
                    disabled={callLoading || !callOutcome || (callOutcome === 'cancelled' && !callCancelReason)}>
                    {callLoading ? 'Saving…' : 'Save'}
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 px-3 text-xs" onClick={() => setShowCallForm(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {order.callLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No calls logged yet.</p>
            ) : (
              <div className="space-y-3">
                {[...order.callLogs].reverse().map(log => (
                  <div key={log.id} className="text-xs space-y-0.5 bg-muted/30 rounded-lg p-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium capitalize">{log.outcome.replace(/-/g, ' ')}</span>
                      <span className="text-muted-foreground">{format(new Date(log.createdAt), 'dd MMM, HH:mm')}</span>
                    </div>
                    {log.notes && <p className="text-muted-foreground">{log.notes}</p>}
                    {log.cancelReason && <p className="text-destructive">Reason: {log.cancelReason}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-lg border border-border p-4 text-xs text-muted-foreground space-y-1">
            <p>SLA deadline: {format(new Date(order.slaDeadline), 'dd MMM yyyy, HH:mm')}</p>
            {order.confirmedAt && <p>Confirmed: {format(new Date(order.confirmedAt), 'dd MMM yyyy, HH:mm')}</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
