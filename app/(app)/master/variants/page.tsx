'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import { getVariants, createVariant, updateVariant } from '@/lib/services/variants'
import type { Brand, Product, Variant } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'

const PACK_UNITS: Variant['packUnit'][] = ['kg', 'lb', 'g', 'ml', 'L', 'servings']

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

const emptyForm = {
  productId: '', flavour: '', packSize: '', packUnit: 'kg' as Variant['packUnit'],
  mrp: '', skuCode: '', unitsPerCarton: '',
}

export default function VariantsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [productFilter, setProductFilter] = useState('all')
  const [brandFilter, setBrandFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [b, p, v] = await Promise.all([getBrands(true), getProducts(undefined, true), getVariants(undefined, true)])
      setBrands(b); setProducts(p); setVariants(v)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filteredProducts = brandFilter === 'all' ? products : products.filter(p => p.brandId === brandFilter)

  const filtered = variants.filter(v => {
    if (!showInactive && !v.active) return false
    if (productFilter !== 'all' && v.productId !== productFilter) return false
    if (brandFilter !== 'all') {
      const prod = products.find(p => p.id === v.productId)
      if (!prod || prod.brandId !== brandFilter) return false
    }
    if (search && !v.flavour.toLowerCase().includes(search.toLowerCase()) && !v.skuCode.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const brandMap = Object.fromEntries(brands.map(b => [b.id, b.name]))

  function autoSku() {
    return `SKU-${Date.now()}`
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productId) { setAddError('Select a product.'); return }
    if (!form.flavour.trim()) { setAddError('Flavour is required.'); return }
    const packSize = parseFloat(form.packSize)
    if (!form.packSize || isNaN(packSize) || packSize <= 0) { setAddError('Enter a valid pack size.'); return }
    const mrp = parseFloat(form.mrp)
    if (!form.mrp || isNaN(mrp) || mrp <= 0) { setAddError('Enter a valid MRP.'); return }
    const upc = parseInt(form.unitsPerCarton)
    if (!form.unitsPerCarton || isNaN(upc) || upc < 1) { setAddError('Units per carton must be at least 1.'); return }
    setAddError(''); setAddLoading(true)
    try {
      await createVariant({
        productId: form.productId,
        flavour: form.flavour.trim(),
        packSize,
        packUnit: form.packUnit,
        mrp,
        skuCode: form.skuCode.trim() || autoSku(),
        unitsPerCarton: upc,
      })
      setAddOpen(false); setForm(emptyForm); await load()
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Failed to create variant.')
    } finally { setAddLoading(false) }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Variants / SKUs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{variants.filter(v => v.active).length} active SKUs</p>
        </div>
        <Button onClick={() => { setForm(f => ({ ...f, skuCode: autoSku() })); setAddOpen(true) }} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Variant
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by flavour or SKU…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={brandFilter} onValueChange={v => { if (v) { setBrandFilter(v); setProductFilter('all') } }}>
            <SelectTrigger className="w-36"><SelectValue placeholder="All brands" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={productFilter} onValueChange={(v) => v && setProductFilter(v)}>
            <SelectTrigger className="w-44"><SelectValue placeholder="All products" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All products</SelectItem>
              {filteredProducts.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Switch checked={showInactive} onCheckedChange={setShowInactive} /> Show inactive
          </label>
        </div>
        <div className="rounded-lg border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading…</div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-destructive text-sm">{error}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU Code</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Flavour</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Size</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">MRP</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Carton Qty</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 w-20 font-medium text-muted-foreground">Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted-foreground px-4 py-12">
                      {search || productFilter !== 'all' ? 'No variants match your filters.' : 'No variants yet.'}
                    </td>
                  </tr>
                ) : filtered.map(v => {
                  const prod = productMap[v.productId]
                  return (
                    <tr key={v.id} className={`border-t border-border hover:bg-muted/20 ${!v.active ? 'opacity-50' : ''}`}>
                      <td className="px-4 py-3 font-mono text-xs">{v.skuCode}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium">{prod?.name ?? '—'}</p>
                          <p className="text-xs text-muted-foreground">{prod ? brandMap[prod.brandId] : ''}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">{v.flavour}</td>
                      <td className="px-4 py-3">{v.packSize} {v.packUnit}</td>
                      <td className="px-4 py-3 text-right">{inrFmt.format(v.mrp)}</td>
                      <td className="px-4 py-3 text-right">{v.unitsPerCarton}</td>
                      <td className="px-4 py-3">
                        <Badge variant={v.active ? 'default' : 'secondary'} className="text-xs">
                          {v.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Switch checked={v.active} onCheckedChange={async () => { await updateVariant(v.id, { active: !v.active }); await load() }} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) { setForm(emptyForm); setAddError('') } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Variant / SKU</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Product <span className="text-destructive">*</span></Label>
              <Select value={form.productId} onValueChange={v => setForm(f => ({ ...f, productId: v ?? f.productId }))}>
                <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                <SelectContent>
                  {products.filter(p => p.active).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} <span className="text-muted-foreground ml-1 text-xs">({brandMap[p.brandId]})</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Flavour <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Double Rich Chocolate" value={form.flavour} onChange={e => setForm(f => ({ ...f, flavour: e.target.value }))} disabled={addLoading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Pack size <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="e.g. 5" min="0.1" step="0.1" value={form.packSize} onChange={e => setForm(f => ({ ...f, packSize: e.target.value }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Unit <span className="text-destructive">*</span></Label>
                <Select value={form.packUnit} onValueChange={v => setForm(f => ({ ...f, packUnit: v as Variant['packUnit'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PACK_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>MRP (₹) <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="e.g. 5999" min="1" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Units per carton <span className="text-destructive">*</span></Label>
                <Input type="number" placeholder="e.g. 6" min="1" step="1" value={form.unitsPerCarton} onChange={e => setForm(f => ({ ...f, unitsPerCarton: e.target.value }))} disabled={addLoading} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>SKU Code</Label>
              <Input placeholder="Auto-generated if blank" value={form.skuCode} onChange={e => setForm(f => ({ ...f, skuCode: e.target.value }))} disabled={addLoading} />
              <p className="text-xs text-muted-foreground">Leave blank to auto-generate.</p>
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel</Button>
              <Button type="submit" disabled={addLoading}>{addLoading ? 'Saving…' : 'Add Variant'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
