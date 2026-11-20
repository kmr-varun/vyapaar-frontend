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
import { ChevronRight, Sparkles } from 'lucide-react'

const PACK_UNITS: Variant['packUnit'][] = ['kg', 'lb', 'g', 'ml', 'L', 'servings']

function initials(s: string): string {
  return s.trim().split(/[\s\-\/]+/).map(w => w[0] ?? '').join('').toUpperCase()
}

function generateSku(productName: string, flavour: string): string {
  const p = initials(productName)
  const f = initials(flavour)
  if (!p && !f) return ''
  if (!f) return p
  if (!p) return f
  return `${p}-${f}`
}

export default function NewVariantPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [brandFilter, setBrandFilter] = useState('')
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false)
  const [form, setForm] = useState({
    productId: '', flavour: '', packSize: '', packUnit: 'kg' as Variant['packUnit'],
    mrp: '', skuCode: '', unitsPerCarton: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getBrands(), getProducts()]).then(([b, p]) => { setBrands(b); setProducts(p) })
  }, [])

  // Auto-generate SKU when product or flavour changes (unless user has manually edited it)
  useEffect(() => {
    if (skuManuallyEdited) return
    const product = products.find(p => p.id === form.productId)
    if (!product) return
    const brand = brands.find(b => b.id === product.brandId)
    const brandAbbr = brand ? initials(brand.name) : ''
    const productAbbr = initials(product.name)
    const flavourAbbr = form.flavour ? initials(form.flavour) : ''
    const parts = [brandAbbr, productAbbr, flavourAbbr].filter(Boolean)
    setForm(f => ({ ...f, skuCode: parts.join('-') }))
  }, [form.productId, form.flavour, products, brands, skuManuallyEdited])

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
      const product = products.find(p => p.id === form.productId)
      const brand = brands.find(b => b.id === product?.brandId)
      const fallbackSku = generateSku(product?.name ?? '', form.flavour)
      await createVariant({
        productId: form.productId,
        flavour: form.flavour.trim(),
        packSize,
        packUnit: form.packUnit,
        mrp,
        skuCode: form.skuCode.trim() || fallbackSku,
        unitsPerCarton: upc,
      })
      void brand
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
          <div className="flex items-center justify-between">
            <Label>SKU Code</Label>
            {skuManuallyEdited && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                onClick={() => { setSkuManuallyEdited(false) }}
              >
                <Sparkles className="w-3 h-3" /> Reset to auto
              </button>
            )}
          </div>
          <Input
            placeholder="Auto-generated from product and flavour"
            value={form.skuCode}
            onChange={e => { setSkuManuallyEdited(true); setForm(f => ({ ...f, skuCode: e.target.value })) }}
            disabled={saving}
          />
          <p className="text-xs text-muted-foreground">
            {skuManuallyEdited
              ? 'Using your custom SKU code.'
              : 'Auto-generated from brand · product · flavour initials. Edit to customise.'}
          </p>
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
