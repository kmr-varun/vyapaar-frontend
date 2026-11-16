'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createTransfer, getLots } from '@/lib/services/inventory'
import { getAllBins } from '@/lib/services/warehouse'
import { getVariants } from '@/lib/services/variants'
import { getProducts } from '@/lib/services/products'
import { getBrands } from '@/lib/services/brands'
import type { Bin, Variant, Lot, Product, Brand } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight } from 'lucide-react'

export default function NewTransferPage() {
  const router = useRouter()
  const [bins, setBins] = useState<Bin[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({ fromBinId: '', toBinId: '', variantId: '', lotId: '', qty: 1 })

  useEffect(() => {
    Promise.all([getAllBins(), getVariants(), getLots(), getProducts(), getBrands()]).then(([b, v, l, p, br]) => {
      setBins(b); setVariants(v); setLots(l); setProducts(p); setBrands(br); setLoading(false)
    })
  }, [])

  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const brandMap = Object.fromEntries(brands.map(b => [b.id, b]))
  function variantLabel(v: Variant) {
    const p = productMap[v.productId]
    const b = p ? brandMap[p.brandId] : undefined
    return `${b?.name ?? ''} / ${p?.name ?? ''} — ${v.flavour} ${v.packSize}${v.packUnit}`
  }

  const filteredLots = lots.filter(l => !form.variantId || l.variantId === form.variantId)

  async function handleCreate() {
    if (!form.fromBinId || !form.toBinId || !form.variantId || !form.lotId) {
      setError('Please fill all required fields.'); return
    }
    if (form.fromBinId === form.toBinId) { setError('From and to bins must be different.'); return }
    setSaving(true); setError('')
    try {
      await createTransfer({
        fromBinId: form.fromBinId, toBinId: form.toBinId,
        variantId: form.variantId, lotId: form.lotId,
        qty: form.qty, status: 'in-transit', createdBy: 'u3',
      })
      router.push('/inventory/transfers')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create transfer.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
          <Link href="/inventory/transfers" className="hover:text-foreground transition-colors">Transfers</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">New Transfer</span>
        </nav>
        <h1 className="text-xl font-semibold">Add Stock Transfer</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Move stock between bins</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <Label>Variant <span className="text-destructive">*</span></Label>
          <Select value={form.variantId} onValueChange={v => v && setForm(p => ({ ...p, variantId: v, lotId: '' }))}>
            <SelectTrigger><SelectValue>{(val: string) => { const v = variants.find(o => o.id === val); return v ? variantLabel(v) : (val || 'Select variant') }}</SelectValue></SelectTrigger>
            <SelectContent>
              {variants.map(v => <SelectItem key={v.id} value={v.id}>{variantLabel(v)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label>Lot / Batch <span className="text-destructive">*</span></Label>
          <Select value={form.lotId} onValueChange={v => v && setForm(p => ({ ...p, lotId: v }))}>
            <SelectTrigger><SelectValue>{(val: string) => { const l = lots.find(o => o.id === val); return l ? `${l.batch} (exp ${l.expiry})` : (val || 'Select lot') }}</SelectValue></SelectTrigger>
            <SelectContent>
              {filteredLots.length === 0
                ? <SelectItem value="_none" disabled>No lots for this variant</SelectItem>
                : filteredLots.map(l => <SelectItem key={l.id} value={l.id}>{l.batch} (exp {l.expiry})</SelectItem>)
              }
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>From Bin <span className="text-destructive">*</span></Label>
          <Select value={form.fromBinId} onValueChange={v => v && setForm(p => ({ ...p, fromBinId: v }))}>
            <SelectTrigger><SelectValue>{(val: string) => { const b = bins.find(o => o.id === val); return b ? (b.name || b.code) : (val || 'Select source bin') }}</SelectValue></SelectTrigger>
            <SelectContent>
              {bins.filter(b => b.active).map(b => <SelectItem key={b.id} value={b.id}>{b.name || b.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>To Bin <span className="text-destructive">*</span></Label>
          <Select value={form.toBinId} onValueChange={v => v && setForm(p => ({ ...p, toBinId: v }))}>
            <SelectTrigger><SelectValue>{(val: string) => { const b = bins.find(o => o.id === val); return b ? (b.name || b.code) : (val || 'Select destination bin') }}</SelectValue></SelectTrigger>
            <SelectContent>
              {bins.filter(b => b.active && b.id !== form.fromBinId).map(b => <SelectItem key={b.id} value={b.id}>{b.name || b.code}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Quantity (packs) <span className="text-destructive">*</span></Label>
          <Input type="number" min={1} value={form.qty} onChange={e => setForm(p => ({ ...p, qty: parseInt(e.target.value) || 1 }))} />
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3">
        <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create Transfer'}</Button>
        <Link href="/inventory/transfers"><Button variant="outline">Cancel</Button></Link>
      </div>
    </div>
  )
}
