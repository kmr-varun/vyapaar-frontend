'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { getEstimates, createEstimate, sendEstimate, reviseEstimate, refreshExpiredEstimate, updateEstimateLines } from '@/lib/services/estimates'
import { getOrders } from '@/lib/services/orders'
import { getVariants } from '@/lib/services/variants'
import { getVendorPriceRules } from '@/lib/services/vendors'
import type { Estimate, Order, Variant, VendorPriceRule, EstimateLine, PaymentMode } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

import { Copy, ExternalLink, Plus, RefreshCw, Send, FilePen } from 'lucide-react'

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

interface LineForm {
  variantId: string
  qtyPacks: number
  pricePerPack: number
  discount: number
  gstRate: number
}

export default function EstimatesPage() {
  const { user, can } = useAuth()
  const [estimates, setEstimates] = useState<Estimate[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [priceRules, setPriceRules] = useState<VendorPriceRule[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Estimate | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Create form state
  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi')
  const [taxInclusive, setTaxInclusive] = useState(true)
  const [validityDays, setValidityDays] = useState(7)
  const [linesForms, setLinesForms] = useState<LineForm[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    const [ests, ords, vars, rules] = await Promise.all([
      getEstimates(),
      getOrders(['confirmed']),
      getVariants(),
      getVendorPriceRules(),
    ])
    setEstimates(ests.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    setOrders(ords)
    setVariants(vars)
    setPriceRules(rules)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function getVariant(id: string) { return variants.find(v => v.id === id) }

  function bestCostPrice(variantId: string): number | null {
    const active = priceRules.filter(r => r.variantId === variantId && r.active)
    if (!active.length) return null
    return Math.min(...active.map(r => r.pricePerPack))
  }

  function marginPct(price: number, cost: number | null) {
    if (!cost || !price) return null
    return (((price - cost) / price) * 100).toFixed(1) + '%'
  }

  function handleSelectOrder(orderId: string) {
    setSelectedOrderId(orderId)
    const order = orders.find(o => o.id === orderId)
    if (!order) return
    setLinesForms(order.lines.map(l => {
      const v = getVariant(l.variantId)
      return {
        variantId: l.variantId,
        qtyPacks: l.qtyPacks,
        pricePerPack: 0,
        discount: 0,
        gstRate: 18,
      }
    }))
  }

  function updateLine(idx: number, field: keyof LineForm, value: number | string) {
    setLinesForms(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function computeLineTotal(line: LineForm) {
    const base = line.qtyPacks * line.pricePerPack - line.discount
    const gstAmount = base * (line.gstRate / 100)
    return { base, gstAmount, lineTotal: base + gstAmount }
  }

  async function handleCreate() {
    if (!selectedOrderId) return
    setActionLoading('create')
    try {
      const lines: Omit<EstimateLine, 'id' | 'estimateId'>[] = linesForms.map(l => {
        const { base, gstAmount, lineTotal } = computeLineTotal(l)
        return { variantId: l.variantId, qtyPacks: l.qtyPacks, pricePerPack: l.pricePerPack, discount: l.discount, gstRate: l.gstRate, lineTotal, gstAmount }
      })
      await createEstimate(selectedOrderId, lines, paymentMode, taxInclusive, validityDays)
      setCreateOpen(false)
      setSelectedOrderId('')
      setLinesForms([])
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  async function handleSend(id: string) {
    setActionLoading(id)
    try {
      const updated = await sendEstimate(id)
      setEstimates(prev => prev.map(e => e.id === id ? updated : e))
      if (selected?.id === id) setSelected(updated)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRevise(id: string) {
    setActionLoading(id + '-revise')
    try {
      const revised = await reviseEstimate(id)
      await load()
      setSelected(revised)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRefresh(id: string) {
    setActionLoading(id + '-refresh')
    try {
      const updated = await refreshExpiredEstimate(id)
      setEstimates(prev => prev.map(e => e.id === id ? updated : e))
      if (selected?.id === id) setSelected(updated)
    } finally {
      setActionLoading(null)
    }
  }

  function copyLink(token: string) {
    const url = `${window.location.origin}/estimate/${token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const isExpired = (e: Estimate) => e.status === 'sent' && new Date(e.validUntil) < new Date()

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading estimates…</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Estimates</h1>
          <p className="text-sm text-muted-foreground">{estimates.length} total</p>
        </div>
        {can('create-estimate') && (
          <Button onClick={() => setCreateOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-1.5" /> Create Estimate
          </Button>
        )}
      </div>

      {estimates.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No estimates yet.</CardContent></Card>
      ) : (
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
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
                  onClick={() => setSelected(e)}
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
                      {(e.status === 'priced') && (
                        <Button size="sm" variant="default" className="h-7 text-xs"
                          disabled={actionLoading === e.id}
                          onClick={() => handleSend(e.id)}>
                          <Send className="w-3 h-3 mr-1" /> Send
                        </Button>
                      )}
                      {e.status === 'sent' && !isExpired(e) && can('send-estimate') && (
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          disabled={actionLoading === e.id + '-revise'}
                          onClick={() => handleRevise(e.id)}>
                          <FilePen className="w-3 h-3 mr-1" /> Revise
                        </Button>
                      )}
                      {isExpired(e) && (
                        <Button size="sm" variant="outline" className="h-7 text-xs"
                          disabled={actionLoading === e.id + '-refresh'}
                          onClick={() => handleRefresh(e.id)}>
                          <RefreshCw className="w-3 h-3 mr-1" /> Refresh
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail panel */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selected.number}
                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig[isExpired(selected) ? 'expired' : selected.status]?.className}`}>
                  {statusConfig[isExpired(selected) ? 'expired' : selected.status]?.label}
                </span>
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-muted-foreground">Payment Mode:</span> <span className="font-medium capitalize">{selected.paymentMode}</span></div>
                <div><span className="text-muted-foreground">Tax:</span> <span className="font-medium">{selected.taxInclusive ? 'Inclusive' : 'Exclusive'}</span></div>
                <div><span className="text-muted-foreground">Valid Until:</span> <span className="font-medium">{format(new Date(selected.validUntil), 'dd MMM yyyy')}</span></div>
                <div><span className="text-muted-foreground">Version:</span> <span className="font-medium">v{selected.version}</span></div>
              </div>

              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price/unit</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Discount</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">GST</th>
                      <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.lines.map(line => {
                      const v = getVariant(line.variantId)
                      return (
                        <tr key={line.id} className="border-t border-border hover:bg-muted/20">
                          <td className="px-4 py-3">
                            {v ? `${v.flavour} ${v.packSize}${v.packUnit}` : line.variantId}
                            {can('view-cost-prices') && (() => {
                              const cost = bestCostPrice(line.variantId)
                              const margin = line.pricePerPack ? marginPct(line.pricePerPack, cost) : null
                              return cost ? (
                                <div className="text-[10px] text-muted-foreground">Cost: {inr(cost)} · Margin: {margin ?? '—'}</div>
                              ) : null
                            })()}
                          </td>
                          <td className="px-4 py-3 text-right">{line.qtyPacks}</td>
                          <td className="px-4 py-3 text-right">{line.pricePerPack ? inr(line.pricePerPack) : '—'}</td>
                          <td className="px-4 py-3 text-right">{line.discount ? inr(line.discount) : '—'}</td>
                          <td className="px-4 py-3 text-right">{line.gstRate}%</td>
                          <td className="px-4 py-3 text-right font-medium">{inr(line.lineTotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-border pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{inr(selected.totalAmount - selected.totalGst)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>GST</span>
                  <span>{inr(selected.totalGst)}</span>
                </div>
                <div className="flex justify-between font-semibold text-base">
                  <span>Total</span>
                  <span>{inr(selected.totalAmount)}</span>
                </div>
              </div>

              {/* Public link */}
              <div className="bg-muted/40 rounded-lg p-3 space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Public Estimate Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background px-2 py-1.5 rounded border border-border truncate">
                    {typeof window !== 'undefined' ? `${window.location.origin}/estimate/${selected.token}` : `/estimate/${selected.token}`}
                  </code>
                  <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={() => copyLink(selected.token)}>
                    <Copy className="w-3 h-3 mr-1" /> {copied ? 'Copied!' : 'Copy'}
                  </Button>
                  <a href={`/estimate/${selected.token}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="ghost" className="h-7"><ExternalLink className="w-3 h-3" /></Button>
                  </a>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                {selected.status === 'priced' && (
                  <Button size="sm" disabled={actionLoading === selected.id} onClick={() => handleSend(selected.id)}>
                    <Send className="w-4 h-4 mr-1.5" /> Send to Client
                  </Button>
                )}
                {selected.status === 'sent' && !isExpired(selected) && can('send-estimate') && (
                  <Button size="sm" variant="outline" disabled={actionLoading === selected.id + '-revise'} onClick={() => handleRevise(selected.id)}>
                    <FilePen className="w-4 h-4 mr-1.5" /> Revise Estimate
                  </Button>
                )}
                {isExpired(selected) && (
                  <Button size="sm" variant="outline" disabled={actionLoading === selected.id + '-refresh'} onClick={() => handleRefresh(selected.id)}>
                    <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh & Resend
                  </Button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Estimate Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Estimate</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Confirmed Order</Label>
                <Select value={selectedOrderId} onValueChange={(v) => v && handleSelectOrder(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select order…" />
                  </SelectTrigger>
                  <SelectContent>
                    {orders.length === 0
                      ? <SelectItem value="_none" disabled>No confirmed orders</SelectItem>
                      : orders.map(o => (
                        <SelectItem key={o.id} value={o.id}>{o.number}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Mode</Label>
                <Select value={paymentMode} onValueChange={v => setPaymentMode(v as PaymentMode)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Validity (days)</Label>
                <Input type="number" value={validityDays} onChange={e => setValidityDays(Number(e.target.value))} min={1} max={30} />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={taxInclusive} onCheckedChange={setTaxInclusive} id="tax-inclusive" />
                <Label htmlFor="tax-inclusive" className="text-sm">Prices are tax-inclusive</Label>
              </div>
            </div>

            {linesForms.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Line Items</p>
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty (packs)</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price / pack ₹</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Discount ₹</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">GST %</th>
                        {can('view-cost-prices') && <th className="text-right px-4 py-3 font-medium text-muted-foreground">Cost / Margin</th>}
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linesForms.map((line, idx) => {
                        const v = getVariant(line.variantId)
                        const { lineTotal } = computeLineTotal(line)
                        const cost = bestCostPrice(line.variantId)
                        return (
                          <tr key={idx} className="border-t border-border hover:bg-muted/20">
                            <td className="px-4 py-3">{v ? `${v.flavour} ${v.packSize}${v.packUnit}` : line.variantId}</td>
                            <td className="px-4 py-3 text-right">
                              <Input type="number" className="w-20 h-7 text-xs text-right" value={line.qtyPacks}
                                onChange={e => updateLine(idx, 'qtyPacks', Number(e.target.value))} min={1} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Input type="number" className="w-24 h-7 text-xs text-right" value={line.pricePerPack || ''}
                                placeholder="0" onChange={e => updateLine(idx, 'pricePerPack', Number(e.target.value))} min={0} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Input type="number" className="w-20 h-7 text-xs text-right" value={line.discount || ''}
                                placeholder="0" onChange={e => updateLine(idx, 'discount', Number(e.target.value))} min={0} />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <Input type="number" className="w-16 h-7 text-xs text-right" value={line.gstRate}
                                onChange={e => updateLine(idx, 'gstRate', Number(e.target.value))} min={0} max={28} />
                            </td>
                            {can('view-cost-prices') && (
                              <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                                {cost ? (
                                  <span>{inr(cost)} · {marginPct(line.pricePerPack, cost) ?? '—'}</span>
                                ) : '—'}
                              </td>
                            )}
                            <td className="px-4 py-3 text-right font-medium">{inr(lineTotal)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              disabled={!selectedOrderId || linesForms.length === 0 || actionLoading === 'create'}
              onClick={handleCreate}
            >
              {actionLoading === 'create' ? 'Creating…' : 'Create Draft'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
