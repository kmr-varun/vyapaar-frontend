'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { createAdjustment, getLots } from '@/lib/services/inventory'
import { getAllBins } from '@/lib/services/warehouse'
import { getVariants } from '@/lib/services/variants'
import { getProducts } from '@/lib/services/products'
import { getBrands } from '@/lib/services/brands'
import type { StockAdjustment, Bin, Variant, Lot, Product, Brand } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight } from 'lucide-react'

const reasonLabels: Record<string, string> = {
  damage: 'Damage', expiry: 'Expiry', found: 'Found', lost: 'Lost', sample: 'Sample',
}

export default function NewAdjustmentPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [bins, setBins] = useState<Bin[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({
    variantId: '', lotId: '', binId: '', qty: '1',
    reason: 'damage' as StockAdjustment['reason'], notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getAllBins(), getVariants(), getLots(), getProducts(), getBrands()]).then(([b, v, l, p, br]) => {
      setBins(b); setVariants(v); setLots(l); setProducts(p); setBrands(br); setLoading(false)
    })
  }, [])

  const filteredLots = lots.filter(l => !form.variantId || l.variantId === form.variantId)

  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const brandMap = Object.fromEntries(brands.map(b => [b.id, b]))
  function variantLabel(v: Variant) {
    const p = productMap[v.productId]
    const b = p ? brandMap[p.brandId] : undefined
    return `${b?.name ?? ''} / ${p?.name ?? ''} — ${v.flavour} ${v.packSize}${v.packUnit}`
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.variantId || !form.lotId || !form.binId) { setError('Select variant, lot, and bin.'); return }
    if (!user) return
    setError('')
    setSaving(true)
    try {
      await createAdjustment({
        variantId: form.variantId,
        lotId: form.lotId,
        binId: form.binId,
        qty: parseInt(form.qty) || 0,
        reason: form.reason,
        notes: form.notes || undefined,
        requestedBy: user.id,
      })
      router.push('/inventory/adjustments')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to submit adjustment.')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <div>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
          <Link href="/inventory/adjustments" className="hover:text-foreground transition-colors">Adjustments</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Request Adjustment</span>
        </nav>
        <h1 className="text-xl font-semibold">Request Stock Adjustment</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Submit a stock correction for manager approval</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 space-y-1.5">
            <Label>Variant <span className="text-destructive">*</span></Label>
            <Select value={form.variantId} onValueChange={v => setForm(f => ({ ...f, variantId: v ?? f.variantId, lotId: '' }))}>
              <SelectTrigger><SelectValue>{(val: string) => { const v = variants.find(o => o.id === val); return v ? variantLabel(v) : (val || 'Select variant') }}</SelectValue></SelectTrigger>
              <SelectContent>{variants.map(v => <SelectItem key={v.id} value={v.id}>{variantLabel(v)}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Lot <span className="text-destructive">*</span></Label>
            <Select value={form.lotId} onValueChange={v => setForm(f => ({ ...f, lotId: v ?? f.lotId }))}>
              <SelectTrigger><SelectValue>{(val: string) => { const l = lots.find(o => o.id === val); return l ? l.batch : (val || 'Select lot') }}</SelectValue></SelectTrigger>
              <SelectContent>
                {filteredLots.length === 0
                  ? <SelectItem value="_none" disabled>No lots found for this variant</SelectItem>
                  : filteredLots.map(l => <SelectItem key={l.id} value={l.id}>{l.batch}</SelectItem>)
                }
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Bin <span className="text-destructive">*</span></Label>
            <Select value={form.binId} onValueChange={v => setForm(f => ({ ...f, binId: v ?? f.binId }))}>
              <SelectTrigger><SelectValue>{(val: string) => { const b = bins.find(o => o.id === val); return b ? b.code : (val || 'Select bin') }}</SelectValue></SelectTrigger>
              <SelectContent>{bins.filter(b => b.active).map(b => <SelectItem key={b.id} value={b.id}>{b.code}</SelectItem>)}</SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Quantity change <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              value={form.qty}
              onChange={e => setForm(f => ({ ...f, qty: e.target.value }))}
              placeholder="-2 to remove, +3 to add"
            />
            <p className="text-xs text-muted-foreground">Positive = found/added, negative = lost/damaged</p>
          </div>

          <div className="space-y-1.5">
            <Label>Reason <span className="text-destructive">*</span></Label>
            <Select value={form.reason} onValueChange={v => setForm(f => ({ ...f, reason: v as StockAdjustment['reason'] }))}>
              <SelectTrigger><SelectValue>{(val: string) => val ? (reasonLabels[val] ?? val) : 'Select reason'}</SelectValue></SelectTrigger>
              <SelectContent>
                {Object.entries(reasonLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <Label>Notes</Label>
            <Textarea rows={3} placeholder="Describe what happened…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Submitting…' : 'Submit Request'}
          </Button>
          <Link href="/inventory/adjustments">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
