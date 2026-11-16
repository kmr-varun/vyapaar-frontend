'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { createEstimate } from '@/lib/services/estimates'
import { getOrders } from '@/lib/services/orders'
import { getVariants } from '@/lib/services/variants'
import { getVendorPriceRules } from '@/lib/services/vendors'
import type { Order, Variant, VendorPriceRule, EstimateLine, PaymentMode } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ChevronLeft } from 'lucide-react'

interface LineForm {
  variantId: string
  qtyPacks: number
  pricePerPack: number
  discount: number
  gstRate: number
  includeGst: boolean
}

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function NewEstimatePage() {
  const { can } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [orders, setOrders] = useState<Order[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [priceRules, setPriceRules] = useState<VendorPriceRule[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [selectedOrderId, setSelectedOrderId] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi')
  const [taxInclusive, setTaxInclusive] = useState(true)
  const [validityDays, setValidityDays] = useState(7)
  const [linesForms, setLinesForms] = useState<LineForm[]>([])

  useEffect(() => {
    async function load() {
      const [ords, vars, rules] = await Promise.all([
        getOrders(['confirmed', 'estimate-sent', 'changes-requested']),
        getVariants(),
        getVendorPriceRules(),
      ])
      setOrders(ords)
      setVariants(vars)
      setPriceRules(rules)
      setLoading(false)
      const preOrderId = searchParams.get('orderId')
      if (preOrderId) {
        const preOrder = ords.find(o => o.id === preOrderId)
        if (preOrder) {
          setSelectedOrderId(preOrderId)
          setLinesForms(preOrder.lines.map(l => ({
            variantId: l.variantId,
            qtyPacks: l.qtyPacks,
            pricePerPack: 0,
            discount: 0,
            gstRate: 18,
            includeGst: true,
          })))
        }
      }
    }
    load()
  }, [searchParams])

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
    setLinesForms(order.lines.map(l => ({
      variantId: l.variantId,
      qtyPacks: l.qtyPacks,
      pricePerPack: 0,
      discount: 0,
      gstRate: 18,
      includeGst: true,
    })))
  }

  function updateLine(idx: number, field: keyof LineForm, value: number | string | boolean) {
    setLinesForms(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l))
  }

  function computeLineTotal(line: LineForm) {
    const base = line.qtyPacks * line.pricePerPack - line.discount
    const effectiveGstRate = line.includeGst ? line.gstRate : 0
    const gstAmount = base * (effectiveGstRate / 100)
    return { base, gstAmount, lineTotal: base + gstAmount }
  }

  async function handleCreate() {
    if (!selectedOrderId || linesForms.length === 0) return
    setSaving(true)
    setError('')
    try {
      const lines: Omit<EstimateLine, 'id' | 'estimateId'>[] = linesForms.map(l => {
        const { base, gstAmount, lineTotal } = computeLineTotal(l)
        return { variantId: l.variantId, qtyPacks: l.qtyPacks, pricePerPack: l.pricePerPack, discount: l.discount, gstRate: l.gstRate, lineTotal, gstAmount }
      })
      await createEstimate(selectedOrderId, lines, paymentMode, taxInclusive, validityDays)
      router.push('/estimates')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create estimate.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/estimates" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/estimates" className="hover:text-foreground">Estimates</Link>
            <span>/</span>
            <span>New</span>
          </div>
          <h1 className="text-xl font-semibold">Create Estimate</h1>
        </div>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Confirmed Order</Label>
            <Select value={selectedOrderId} onValueChange={(v) => v && handleSelectOrder(v)}>
              <SelectTrigger>
                <SelectValue>{(val: string) => val ? (orders.find(o => o.id === val)?.number ?? val) : 'Select order…'}</SelectValue>
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
            <Select value={paymentMode} onValueChange={v => v && setPaymentMode(v as PaymentMode)}>
              <SelectTrigger>
                <SelectValue>{(val: string) => ({ upi: 'UPI', bank: 'Bank Transfer', cash: 'Cash', credit: 'Credit' }[val] ?? val)}</SelectValue>
              </SelectTrigger>
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
            <div className="rounded-lg border border-border overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty (packs)</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price / pack ₹</th>
                    <th className="text-right px-4 py-3 font-medium text-muted-foreground">Discount ₹</th>
                    <th className="text-center px-4 py-3 font-medium text-muted-foreground">GST</th>
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
                        <td className="px-4 py-3 text-center">
                          <Switch checked={line.includeGst} onCheckedChange={v => updateLine(idx, 'includeGst', v)} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Input type="number" className="w-16 h-7 text-xs text-right" value={line.gstRate}
                            disabled={!line.includeGst}
                            onChange={e => updateLine(idx, 'gstRate', Number(e.target.value))} min={0} max={28} />
                        </td>
                        {can('view-cost-prices') && (
                          <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                            {cost ? <span>{inr(cost)} · {marginPct(line.pricePerPack, cost) ?? '—'}</span> : '—'}
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

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Link href="/estimates">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            disabled={!selectedOrderId || linesForms.length === 0 || saving}
            onClick={handleCreate}
          >
            {saving ? 'Creating…' : 'Create Draft'}
          </Button>
        </div>
      </div>
    </div>
  )
}
