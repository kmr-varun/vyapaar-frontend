'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import { createVariant } from '@/lib/services/variants'
import type { Brand, Product, Variant } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight } from 'lucide-react'

const PACK_UNITS: Variant['packUnit'][] = ['kg', 'lb', 'g', 'ml', 'L', 'servings']

function autoSku() { return `SKU-${Date.now()}` }

export default function NewVariantPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [brandFilter, setBrandFilter] = useState('')
  const [form, setForm] = useState({
    productId: '', flavour: '', packSize: '', packUnit: 'kg' as Variant['packUnit'],
    mrp: '', skuCode: autoSku(), unitsPerCarton: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getBrands(), getProducts()]).then(([b, p]) => { setBrands(b); setProducts(p) })
  }, [])

  const filteredProducts = brandFilter ? products.filter(p => p.brandId === brandFilter && p.active) : products.filter(p => p.active)
  const brandMap = Object.fromEntries(brands.map(b => [b.id, b.name]))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.productId) { setError('Select a product.'); return }
    if (!form.flavour.trim()) { setError('Flavour is required.'); return }
    const packSize = parseFloat(form.packSize)
    if (!form.packSize || isNaN(packSize) || packSize <= 0) { setError('Enter a valid pack size.'); return }
    const mrp = parseFloat(form.mrp)
    if (!form.mrp || isNaN(mrp) || mrp <= 0) { setError('Enter a valid MRP.'); return }
    const upc = parseInt(form.unitsPerCarton)
    if (!form.unitsPerCarton || isNaN(upc) || upc < 1) { setError('Units per carton must be at least 1.'); return }
    setError('')
    setSaving(true)
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
      router.push('/master/variants')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create variant.')
    }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/master/variants" className="hover:text-foreground transition-colors">Variants</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">New Variant</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Add Variant / SKU</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add a new size or flavour variant to a product</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>Filter by brand</Label>
          <Select value={brandFilter || '__all__'} onValueChange={v => { if (v) { setBrandFilter(v === '__all__' ? '' : v); setForm(f => ({ ...f, productId: '' })) } }}>
            <SelectTrigger>
              <SelectValue>{(val: string) => (!val || val === '__all__') ? 'All brands' : (brands.find(b => b.id === val)?.name ?? val)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All brands</SelectItem>
              {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Product <span className="text-destructive">*</span></Label>
          <Select value={form.productId} onValueChange={v => setForm(f => ({ ...f, productId: v ?? f.productId }))}>
            <SelectTrigger>
              <SelectValue>{(val: string) => { if (!val) return 'Select product'; const p = filteredProducts.find(p => p.id === val); return p ? `${p.name} (${brandMap[p.brandId] ?? ''})` : val }}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {filteredProducts.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} ({brandMap[p.brandId] ?? ''})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label>Flavour <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. Double Rich Chocolate" value={form.flavour} onChange={e => setForm(f => ({ ...f, flavour: e.target.value }))} disabled={saving} />
        </div>

        <div className="space-y-1.5">
          <Label>Pack size <span className="text-destructive">*</span></Label>
          <Input type="number" placeholder="e.g. 5" min="0.1" step="0.1" value={form.packSize} onChange={e => setForm(f => ({ ...f, packSize: e.target.value }))} disabled={saving} />
        </div>
        <div className="space-y-1.5">
          <Label>Unit <span className="text-destructive">*</span></Label>
          <Select value={form.packUnit} onValueChange={v => setForm(f => ({ ...f, packUnit: v as Variant['packUnit'] }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PACK_UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>MRP (₹) <span className="text-destructive">*</span></Label>
          <Input type="number" placeholder="e.g. 5999" min="1" value={form.mrp} onChange={e => setForm(f => ({ ...f, mrp: e.target.value }))} disabled={saving} />
        </div>
        <div className="space-y-1.5">
          <Label>Units per carton <span className="text-destructive">*</span></Label>
          <Input type="number" placeholder="e.g. 6" min="1" step="1" value={form.unitsPerCarton} onChange={e => setForm(f => ({ ...f, unitsPerCarton: e.target.value }))} disabled={saving} />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label>SKU Code</Label>
          <Input placeholder="Auto-generated if blank" value={form.skuCode} onChange={e => setForm(f => ({ ...f, skuCode: e.target.value }))} disabled={saving} />
          <p className="text-xs text-muted-foreground">Leave blank to auto-generate.</p>
        </div>

        {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}

        <div className="md:col-span-2 flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add Variant'}
          </Button>
          <Link href="/master/variants">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
