'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getVendors, createVendorPriceRule } from '@/lib/services/vendors'
import { getVariants } from '@/lib/services/variants'
import { getProducts } from '@/lib/services/products'
import { getBrands } from '@/lib/services/brands'
import type { Vendor, Variant, PaymentMode, Product, Brand } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight } from 'lucide-react'

const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'upi', label: 'UPI' }, { value: 'bank', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' }, { value: 'credit', label: 'Credit' },
]

export default function NewPriceRulePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [vendor, setVendor] = useState<Vendor | null>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    variantId: '',
    pricePerPack: '',
    minCartons: '',
    paymentMode: '' as PaymentMode | '',
    deliveryWithinDays: '',
    validFrom: '',
    validTo: '',
  })

  useEffect(() => {
    async function load() {
      const [vendors, vars, prods, brs] = await Promise.all([getVendors(true), getVariants(undefined, true), getProducts(), getBrands()])
      setVendor(vendors.find(v => v.id === id) ?? null)
      setVariants(vars)
      setProducts(prods)
      setBrands(brs)
      setLoading(false)
    }
    load()
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!vendor) return
    if (!form.variantId) { setError('Select a variant.'); return }
    const price = parseFloat(form.pricePerPack)
    if (!form.pricePerPack || isNaN(price) || price <= 0) { setError('Enter a valid price.'); return }
    if (!form.validFrom || !form.validTo) { setError('Enter valid from/to dates.'); return }
    setError(''); setSaving(true)
    try {
      await createVendorPriceRule({
        vendorId: vendor.id,
        variantId: form.variantId,
        pricePerPack: price,
        minCartons: form.minCartons ? parseInt(form.minCartons) : undefined,
        paymentMode: form.paymentMode || undefined,
        deliveryWithinDays: form.deliveryWithinDays ? parseInt(form.deliveryWithinDays) : undefined,
        validFrom: form.validFrom,
        validTo: form.validTo,
        active: true,
      })
      router.push('/master/vendors')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save.')
    }
    setSaving(false)
  }

  const productMap = Object.fromEntries(products.map(p => [p.id, p]))
  const brandMap = Object.fromEntries(brands.map(b => [b.id, b]))
  function variantLabel(v: Variant) {
    const p = productMap[v.productId]
    const b = p ? brandMap[p.brandId] : undefined
    return `${b?.name ?? ''} / ${p?.name ?? ''} — ${v.flavour} ${v.packSize}${v.packUnit}`
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>
  if (!vendor) return <div className="p-6 text-muted-foreground">Vendor not found.</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
          <Link href="/master/vendors" className="hover:text-foreground transition-colors">Vendors</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">{vendor.name}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Add Price Rule</span>
        </nav>
        <h1 className="text-xl font-semibold">Add Price Rule</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{vendor.name}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2 space-y-1.5">
            <Label>Variant / SKU <span className="text-destructive">*</span></Label>
            <Select value={form.variantId} onValueChange={v => v && setForm(f => ({ ...f, variantId: v }))}>
              <SelectTrigger><SelectValue>{(val: string) => { const v = variants.find(o => o.id === val); return v ? variantLabel(v) : (val || 'Select variant') }}</SelectValue></SelectTrigger>
              <SelectContent>
                {variants.filter(v => v.active).map(v => (
                  <SelectItem key={v.id} value={v.id}>{variantLabel(v)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label>Price per pack (₹) <span className="text-destructive">*</span></Label>
            <Input type="number" min="1" step="0.01" value={form.pricePerPack} onChange={e => setForm(f => ({ ...f, pricePerPack: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Min cartons</Label>
            <Input type="number" min="1" placeholder="Optional" value={form.minCartons} onChange={e => setForm(f => ({ ...f, minCartons: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label>Payment mode</Label>
            <Select value={form.paymentMode} onValueChange={v => v && setForm(f => ({ ...f, paymentMode: v as PaymentMode }))}>
              <SelectTrigger><SelectValue>{(val: string) => val ? (PAYMENT_MODES.find(m => m.value === val)?.label ?? val) : 'Any'}</SelectValue></SelectTrigger>
              <SelectContent>
                {PAYMENT_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Delivery within (days)</Label>
            <Input type="number" min="1" placeholder="Optional" value={form.deliveryWithinDays} onChange={e => setForm(f => ({ ...f, deliveryWithinDays: e.target.value }))} />
          </div>

          <div className="space-y-1.5">
            <Label>Valid from <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.validFrom} onChange={e => setForm(f => ({ ...f, validFrom: e.target.value }))} />
          </div>
          <div className="space-y-1.5">
            <Label>Valid to <span className="text-destructive">*</span></Label>
            <Input type="date" value={form.validTo} onChange={e => setForm(f => ({ ...f, validTo: e.target.value }))} />
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Add Price Rule'}</Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        </div>
      </form>
    </div>
  )
}
