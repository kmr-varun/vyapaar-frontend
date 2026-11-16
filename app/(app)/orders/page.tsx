'use client'

import { useEffect, useState, useCallback } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getOrders, logCall, createOrderManual } from '@/lib/services/orders'
import { getClients, createClient } from '@/lib/services/clients'
import { getVariants } from '@/lib/services/variants'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import type { Order, Client, Variant, Brand, Product, OrderStatus } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
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
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Log call dialog
  const [callDialogOrder, setCallDialogOrder] = useState<Order | null>(null)
  const [callOutcome, setCallOutcome] = useState<string>('')
  const [callNotes, setCallNotes] = useState('')
  const [callCancelReason, setCallCancelReason] = useState('')
  const [callLoading, setCallLoading] = useState(false)

  // Create order dialog
  const [createOpen, setCreateOpen] = useState(false)
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [isNewClient, setIsNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientMobile, setNewClientMobile] = useState('')
  const [newClientBusiness, setNewClientBusiness] = useState('')
  const [newClientAddress, setNewClientAddress] = useState('')
  const [orderLines, setOrderLines] = useState([{ variantId: '', qtyCartons: 0, qtyPacks: 0 }])
  const [createLoading, setCreateLoading] = useState(false)

  // Detail sheet
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const [os, cs, vs, bs, ps] = await Promise.all([
      getOrders(),
      getClients(),
      getVariants(),
      getBrands(),
      getProducts(),
    ])
    setOrders(os)
    setClients(cs)
    setVariants(vs)
    setBrands(bs)
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

  async function handleLogCall() {
    if (!callDialogOrder || !callOutcome) return
    setCallLoading(true)
    try {
      await logCall(callDialogOrder.id, {
        outcome: callOutcome as Order['callLogs'][0]['outcome'],
        notes: callNotes || undefined,
        cancelReason: callOutcome === 'cancelled' ? callCancelReason : undefined,
        userId: user?.id ?? 'u1',
      })
      await load()
      setCallDialogOrder(null)
      setCallOutcome('')
      setCallNotes('')
      setCallCancelReason('')
    } finally {
      setCallLoading(false)
    }
  }

  function filteredClients() {
    if (!clientSearch) return clients.slice(0, 8)
    const q = clientSearch.toLowerCase()
    return clients.filter(c =>
      c.businessName.toLowerCase().includes(q) ||
      c.contactName.toLowerCase().includes(q) ||
      c.mobile.includes(q)
    ).slice(0, 8)
  }

  async function handleCreateOrder() {
    setCreateLoading(true)
    try {
      let clientId = selectedClientId
      if (isNewClient) {
        const c = await createClient({
          businessName: newClientBusiness || newClientName,
          contactName: newClientName,
          mobile: newClientMobile,
          billingAddress: newClientAddress,
          creditLimit: 0,
          creditDays: 0,
          source: 'manual',
        })
        clientId = c.id
      }
      const lines = orderLines.filter(l => l.variantId)
      await createOrderManual(clientId, lines)
      await load()
      setCreateOpen(false)
      setOrderLines([{ variantId: '', qtyCartons: 0, qtyPacks: 0 }])
      setSelectedClientId('')
      setIsNewClient(false)
    } finally {
      setCreateLoading(false)
    }
  }

  // Group variants by brand+product for the select
  const variantOptions = variants.map(v => {
    const p = products.find(p => p.id === v.productId)
    const b = p ? brands.find(br => br.id === p.brandId) : undefined
    return { ...v, productName: p?.name ?? '', brandName: b?.name ?? '' }
  })

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Orders</h1>
          <p className="text-sm text-muted-foreground">{pendingOrders.length} pending confirmation</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Create Order
        </Button>
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
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
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
                      <td className="px-4 py-3 font-mono text-xs">{order.number}</td>
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
                        <Button size="sm" variant="outline" onClick={() => { setCallDialogOrder(order); setCallOutcome('') }}>
                          <Phone className="w-3 h-3 mr-1.5" /> Log Call
                        </Button>
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
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
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
                  <tr key={order.id} className="border-t border-border hover:bg-muted/20 cursor-pointer" onClick={() => setDetailOrder(order)}>
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
                    <td className="px-4 py-3"><ChevronRight className="w-4 h-4 text-muted-foreground" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Log Call Dialog */}
      <Dialog open={!!callDialogOrder} onOpenChange={open => { if (!open) setCallDialogOrder(null) }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Log Call — {callDialogOrder?.number}</DialogTitle>
          </DialogHeader>
          {callDialogOrder && (
            <div className="space-y-4">
              <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                <p className="text-sm font-medium">{clientName(callDialogOrder.clientId)}</p>
                <div className="space-y-1">
                  {callDialogOrder.lines.map(l => (
                    <p key={l.id} className="text-xs text-muted-foreground">
                      {variantLabel(l.variantId)} — {l.qtyCartons > 0 ? `${l.qtyCartons} ctn` : ''}{l.qtyPacks > 0 ? ` ${l.qtyPacks} pks` : ''}
                    </p>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Outcome</Label>
                <Select value={callOutcome} onValueChange={(v) => v && setCallOutcome(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select outcome" />
                  </SelectTrigger>
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
                  <Input value={callCancelReason} onChange={e => setCallCancelReason(e.target.value)} placeholder="Why is the order cancelled?" />
                </div>
              )}
              <div className="space-y-1.5">
                <Label className="text-xs">Notes</Label>
                <Textarea value={callNotes} onChange={e => setCallNotes(e.target.value)} placeholder="Optional notes…" rows={3} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCallDialogOrder(null)}>Cancel</Button>
            <Button
              onClick={handleLogCall}
              disabled={callLoading || !callOutcome || (callOutcome === 'cancelled' && !callCancelReason)}
            >
              {callLoading ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Order Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs">Client</Label>
              {!isNewClient ? (
                <div className="space-y-2">
                  <Input placeholder="Search by name or mobile…" value={clientSearch} onChange={e => { setClientSearch(e.target.value); setSelectedClientId('') }} />
                  {clientSearch && (
                    <div className="border border-border rounded-lg divide-y divide-border max-h-40 overflow-y-auto">
                      {filteredClients().map(c => (
                        <button key={c.id} className={`w-full text-left px-3 py-2 text-sm hover:bg-muted/40 ${selectedClientId === c.id ? 'bg-primary/10' : ''}`}
                          onClick={() => { setSelectedClientId(c.id); setClientSearch(`${c.businessName} — ${c.mobile}`) }}>
                          <span className="font-medium">{c.businessName}</span>
                          <span className="text-muted-foreground ml-2 text-xs">{c.mobile}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  <button className="text-xs text-primary underline" onClick={() => setIsNewClient(true)}>+ New client</button>
                </div>
              ) : (
                <div className="space-y-2 p-3 border border-border rounded-lg bg-muted/20">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-medium">New Client</span>
                    <button className="text-xs text-muted-foreground underline" onClick={() => setIsNewClient(false)}>Choose existing</button>
                  </div>
                  <Input placeholder="Contact name *" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                  <Input placeholder="Mobile *" value={newClientMobile} onChange={e => setNewClientMobile(e.target.value)} />
                  <Input placeholder="Business name" value={newClientBusiness} onChange={e => setNewClientBusiness(e.target.value)} />
                  <Input placeholder="Delivery address" value={newClientAddress} onChange={e => setNewClientAddress(e.target.value)} />
                </div>
              )}
            </div>

            <Separator />

            <div className="space-y-2">
              <Label className="text-xs">Order Lines</Label>
              {orderLines.map((line, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Select value={line.variantId} onValueChange={v => setOrderLines(ls => ls.map((l, j) => j === i ? { ...l, variantId: v ?? l.variantId } : l))}>
                    <SelectTrigger className="flex-1 text-xs">
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {variantOptions.map(v => (
                        <SelectItem key={v.id} value={v.id} className="text-xs">
                          <span className="text-muted-foreground">{v.brandName} /</span> {v.productName} — {v.flavour} {v.packSize}{v.packUnit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min={0} placeholder="Ctn" className="w-16 text-xs" value={line.qtyCartons || ''} onChange={e => setOrderLines(ls => ls.map((l, j) => j === i ? { ...l, qtyCartons: +e.target.value } : l))} />
                  <Input type="number" min={0} placeholder="Pks" className="w-16 text-xs" value={line.qtyPacks || ''} onChange={e => setOrderLines(ls => ls.map((l, j) => j === i ? { ...l, qtyPacks: +e.target.value } : l))} />
                  {orderLines.length > 1 && (
                    <button className="text-muted-foreground hover:text-destructive text-xs" onClick={() => setOrderLines(ls => ls.filter((_, j) => j !== i))}>✕</button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setOrderLines(ls => [...ls, { variantId: '', qtyCartons: 0, qtyPacks: 0 }])}>
                <Plus className="w-3 h-3 mr-1" /> Add line
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateOrder} disabled={createLoading || (!selectedClientId && !isNewClient) || orderLines.every(l => !l.variantId)}>
              {createLoading ? 'Creating…' : 'Create Order'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Order Detail Sheet */}
      <Dialog open={!!detailOrder} onOpenChange={open => { if (!open) setDetailOrder(null) }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{detailOrder?.number}</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${STATUS_COLORS[detailOrder.status] ?? ''}`}>
                  {detailOrder.status.replace(/-/g, ' ')}
                </span>
                <Badge variant="outline" className="text-[10px] capitalize">{detailOrder.source}</Badge>
              </div>

              <div className="space-y-1 text-sm">
                <p><span className="text-muted-foreground">Client:</span> {clientName(detailOrder.clientId)}</p>
                {detailOrder.deliveryAddress && <p><span className="text-muted-foreground">Address:</span> {detailOrder.deliveryAddress}</p>}
                {detailOrder.preferredDeliveryDate && <p><span className="text-muted-foreground">Preferred date:</span> {format(new Date(detailOrder.preferredDeliveryDate), 'dd MMM yyyy')}</p>}
              </div>

              <Separator />

              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">ORDER LINES</p>
                <div className="space-y-1">
                  {detailOrder.lines.map(l => (
                    <div key={l.id} className="flex justify-between text-sm">
                      <span>{variantLabel(l.variantId)}</span>
                      <span className="text-muted-foreground">{l.qtyCartons > 0 ? `${l.qtyCartons} ctn` : ''} {l.qtyPacks > 0 ? `${l.qtyPacks} pks` : ''}</span>
                    </div>
                  ))}
                </div>
              </div>

              {detailOrder.callLogs.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-2">CALL HISTORY</p>
                    <div className="space-y-2">
                      {detailOrder.callLogs.map(log => (
                        <div key={log.id} className="text-sm bg-muted/30 rounded-lg p-2.5">
                          <div className="flex justify-between">
                            <span className="font-medium capitalize">{log.outcome.replace(/-/g, ' ')}</span>
                            <span className="text-xs text-muted-foreground">{format(new Date(log.createdAt), 'dd MMM, HH:mm')}</span>
                          </div>
                          {log.notes && <p className="text-xs text-muted-foreground mt-0.5">{log.notes}</p>}
                          {log.cancelReason && <p className="text-xs text-destructive mt-0.5">Reason: {log.cancelReason}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <Separator />
              <div className="text-xs text-muted-foreground">
                <p>Created: {format(new Date(detailOrder.createdAt), 'dd MMM yyyy, HH:mm')}</p>
                <p>SLA deadline: {format(new Date(detailOrder.slaDeadline), 'dd MMM yyyy, HH:mm')}</p>
                {detailOrder.confirmedAt && <p>Confirmed: {format(new Date(detailOrder.confirmedAt), 'dd MMM yyyy, HH:mm')}</p>}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
