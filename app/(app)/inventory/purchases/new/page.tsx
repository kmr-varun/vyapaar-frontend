'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createPurchase } from '@/lib/services/inventory'
import { getVendors } from '@/lib/services/vendors'
import { getVariants } from '@/lib/services/variants'
import { getUnits } from '@/lib/services/warehouse'
import { getProducts } from '@/lib/services/products'
import { getBrands } from '@/lib/services/brands'
import type { Vendor, Variant, Unit, Product, Brand } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'

type PurchaseLine = { variantId: string; expectedCartons: number; pricePerPack: number }

export default function NewPurchasePage() {
  const router = useRouter()
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(true)

  const [form, setForm] = useState({ vendorId: '', invoiceNumber: '', invoiceDate: '', unitId: '' })
  const [lines, setLines] = useState<PurchaseLine[]>([{ variantId: '', expectedCartons: 1, pricePerPack: 0 }])

  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const brandMap = Object.fromEntries(brands.map(b => [b.id, b]))
  function variantLabel(v: Variant) {
    const p = productMap[v.productId]
    const b = p ? brandMap[p.brandId] : undefined
    return `${b?.name ?? ''} / ${p?.name ?? ''} — ${v.flavour} ${v.packSize}${v.packUnit}`
  }
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getVendors(), getVariants(), getUnits(), getProducts(), getBrands()]).then(([v, va, u, p, br]) => {
      setVendors(v); setVariants(va); setUnits(u); setProducts(p); setBrands(br); setLoading(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.vendorId || !form.invoiceNumber || !form.unitId) { setError('Fill all required fields (vendor, invoice number, unit).'); return }
    if (lines.some(l => !l.variantId)) { setError('Select a variant for each line.'); return }
    setError('')
    setSaving(true)
    try {
      await createPurchase({
        vendorId: form.vendorId,
        vendorInvoiceNumber: form.invoiceNumber,
        vendorInvoiceDate: form.invoiceDate,
        unitId: form.unitId,
        lines: lines.map((l, i) => ({ id: `newpl${i}`, purchaseId: '', expectedPacks: 0, ...l })),
        createdBy: 'u2',
      })
      router.push('/inventory/purchases')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create purchase.')
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
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/inventory/purchases" className="hover:text-foreground transition-colors">Purchases</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">New Purchase</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Add Purchase</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Record inbound stock from a vendor</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-border p-4 space-y-4">
          <h2 className="font-medium text-sm">Purchase Details</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Vendor <span className="text-destructive">*</span></Label>
              <Select value={form.vendorId} onValueChange={v => setForm(f => ({ ...f, vendorId: v ?? f.vendorId }))}>
                <SelectTrigger><SelectValue>{(val: string) => val ? (vendors.find(o => o.id === val)?.name ?? val) : 'Select vendor'}</SelectValue></SelectTrigger>
                <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Warehouse unit <span className="text-destructive">*</span></Label>
              <Select value={form.unitId} onValueChange={v => setForm(f => ({ ...f, unitId: v ?? f.unitId }))}>
                <SelectTrigger><SelectValue>{(val: string) => val ? (units.find(o => o.id === val)?.name ?? val) : 'Select unit'}</SelectValue></SelectTrigger>
                <SelectContent>{units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Invoice number <span className="text-destructive">*</span></Label>
              <Input placeholder="INV-2611-001" value={form.invoiceNumber} onChange={e => setForm(f => ({ ...f, invoiceNumber: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label>Invoice date</Label>
              <Input type="date" value={form.invoiceDate} onChange={e => setForm(f => ({ ...f, invoiceDate: e.target.value }))} />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-medium text-sm">Line Items</h2>
            <Button type="button" variant="outline" size="sm" onClick={() => setLines(prev => [...prev, { variantId: '', expectedCartons: 1, pricePerPack: 0 }])}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Line
            </Button>
          </div>
          <div className="space-y-3">
            {lines.map((line, i) => (
              <div key={i} className="grid grid-cols-5 gap-2 items-end">
                <div className="col-span-3 space-y-1">
                  {i === 0 && <Label className="text-xs">Variant</Label>}
                  <Select value={line.variantId} onValueChange={v => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, variantId: v ?? l.variantId } : l))}>
                    <SelectTrigger className="text-xs"><SelectValue>{(val: string) => { const v = variants.find(o => o.id === val); return v ? variantLabel(v) : (val || 'Select variant') }}</SelectValue></SelectTrigger>
                    <SelectContent>{variants.map(v => <SelectItem key={v.id} value={v.id}>{variantLabel(v)}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  {i === 0 && <Label className="text-xs">Cartons</Label>}
                  <Input type="number" min={0} className="text-xs" value={line.expectedCartons} onChange={e => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, expectedCartons: parseInt(e.target.value) || 0 } : l))} />
                </div>
                <div className="flex items-end gap-1">
                  <div className="flex-1 space-y-1">
                    {i === 0 && <Label className="text-xs">Price/pack ₹</Label>}
                    <Input type="number" min={0} className="text-xs" value={line.pricePerPack} onChange={e => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, pricePerPack: parseFloat(e.target.value) || 0 } : l))} />
                  </div>
                  {lines.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => setLines(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Create Purchase'}
          </Button>
          <Link href="/inventory/purchases">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
