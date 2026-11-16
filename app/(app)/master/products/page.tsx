'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrands } from '@/lib/services/brands'
import { getProducts, createProduct, updateProduct } from '@/lib/services/products'
import type { Brand, Product, ProductCategory } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'

const CATEGORIES: { value: ProductCategory; label: string }[] = [
  { value: 'whey', label: 'Whey Protein' },
  { value: 'isolate', label: 'Isolate' },
  { value: 'gainer', label: 'Mass Gainer' },
  { value: 'pre-workout', label: 'Pre-Workout' },
  { value: 'creatine', label: 'Creatine' },
  { value: 'amino', label: 'Amino Acids' },
  { value: 'vitamins', label: 'Vitamins & Health' },
  { value: 'fat-burner', label: 'Fat Burner' },
  { value: 'other', label: 'Other' },
]

const CATEGORY_COLORS: Record<ProductCategory, string> = {
  whey: 'bg-blue-500/10 text-blue-400',
  isolate: 'bg-purple-500/10 text-purple-400',
  gainer: 'bg-orange-500/10 text-orange-400',
  'pre-workout': 'bg-red-500/10 text-red-400',
  creatine: 'bg-cyan-500/10 text-cyan-400',
  amino: 'bg-green-500/10 text-green-400',
  vitamins: 'bg-yellow-500/10 text-yellow-400',
  'fat-burner': 'bg-pink-500/10 text-pink-400',
  other: 'bg-muted text-muted-foreground',
}

const GST_RATES = [5, 12, 18, 28]

const emptyForm = { brandId: '', name: '', category: '' as ProductCategory, description: '', hsnCode: '', gstRate: 18, active: true }

export default function ProductsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [showInactive, setShowInactive] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const [b, p] = await Promise.all([getBrands(true), getProducts(undefined, true)])
      setBrands(b); setProducts(p)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load.')
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = products.filter(p => {
    if (!showInactive && !p.active) return false
    if (brandFilter !== 'all' && p.brandId !== brandFilter) return false
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.brandId) { setAddError('Select a brand.'); return }
    if (!form.name.trim()) { setAddError('Product name is required.'); return }
    if (!form.category) { setAddError('Select a category.'); return }
    if (!form.hsnCode.trim()) { setAddError('HSN code is required.'); return }
    setAddError(''); setAddLoading(true)
    try {
      await createProduct({
        brandId: form.brandId,
        name: form.name.trim(),
        category: form.category,
        description: form.description || undefined,
        hsnCode: form.hsnCode.trim(),
        gstRate: form.gstRate,
      })
      setAddOpen(false); setForm(emptyForm); await load()
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Failed to create product.')
    } finally { setAddLoading(false) }
  }

  const brandMap = Object.fromEntries(brands.map(b => [b.id, b.name]))
  const catMap = Object.fromEntries(CATEGORIES.map(c => [c.value, c.label]))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{products.filter(p => p.active).length} active products</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search products…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={brandFilter} onValueChange={(v) => v && setBrandFilter(v)}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="All brands" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brand</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">HSN</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">GST %</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 w-20 font-medium text-muted-foreground">Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted-foreground px-4 py-12">
                      {search || brandFilter !== 'all' ? 'No products match your filters.' : 'No products yet.'}
                    </td>
                  </tr>
                ) : filtered.map(product => (
                  <tr key={product.id} className={`border-t border-border hover:bg-muted/20 ${!product.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3 font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{brandMap[product.brandId] ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[product.category]}`}>
                        {catMap[product.category] ?? product.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{product.hsnCode}</td>
                    <td className="px-4 py-3 text-right">{product.gstRate}%</td>
                    <td className="px-4 py-3">
                      <Badge variant={product.active ? 'default' : 'secondary'} className="text-xs">
                        {product.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={product.active}
                        onCheckedChange={async () => {
                          await updateProduct(product.id, { active: !product.active })
                          await load()
                        }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) { setForm(emptyForm); setAddError('') } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Brand <span className="text-destructive">*</span></Label>
                <Select value={form.brandId} onValueChange={v => setForm(f => ({ ...f, brandId: v ?? f.brandId }))}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>{brands.filter(b => b.active).map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Category <span className="text-destructive">*</span></Label>
                <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as ProductCategory }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Product name <span className="text-destructive">*</span></Label>
              <Input placeholder="e.g. Gold Standard 100% Whey" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={addLoading} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea placeholder="Short product description…" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} disabled={addLoading} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>HSN Code <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. 21069099" value={form.hsnCode} onChange={e => setForm(f => ({ ...f, hsnCode: e.target.value }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>GST Rate <span className="text-destructive">*</span></Label>
                <Select value={String(form.gstRate)} onValueChange={v => setForm(f => ({ ...f, gstRate: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{GST_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel</Button>
              <Button type="submit" disabled={addLoading}>{addLoading ? 'Saving…' : 'Add Product'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
