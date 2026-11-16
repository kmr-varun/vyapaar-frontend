'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrands } from '@/lib/services/brands'
import { createProduct } from '@/lib/services/products'
import type { Brand, ProductCategory } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight } from 'lucide-react'

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

const GST_RATES = [5, 12, 18, 28]

export default function NewProductPage() {
  const router = useRouter()
  const [brands, setBrands] = useState<Brand[]>([])
  const [form, setForm] = useState({ brandId: '', name: '', category: '' as ProductCategory | '', description: '', hsnCode: '', gstRate: 18 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { getBrands().then(setBrands) }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.brandId) { setError('Select a brand.'); return }
    if (!form.name.trim()) { setError('Product name is required.'); return }
    if (!form.category) { setError('Select a category.'); return }
    if (!form.hsnCode.trim()) { setError('HSN code is required.'); return }
    setError('')
    setSaving(true)
    try {
      await createProduct({
        brandId: form.brandId,
        name: form.name.trim(),
        category: form.category as ProductCategory,
        description: form.description || undefined,
        hsnCode: form.hsnCode.trim(),
        gstRate: form.gstRate,
      })
      router.push('/master/products')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create product.')
    }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/master/products" className="hover:text-foreground transition-colors">Products</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">New Product</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Add Product</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Create a new product under a brand</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>Brand <span className="text-destructive">*</span></Label>
          <Select value={form.brandId} onValueChange={v => setForm(f => ({ ...f, brandId: v ?? f.brandId }))}>
            <SelectTrigger>
              <SelectValue>{(val: string) => val ? (brands.find(b => b.id === val)?.name ?? val) : 'Select brand'}</SelectValue>
            </SelectTrigger>
            <SelectContent>{brands.filter(b => b.active).map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Category <span className="text-destructive">*</span></Label>
          <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v as ProductCategory }))}>
            <SelectTrigger>
              <SelectValue>{(val: string) => val ? (CATEGORIES.find(c => c.value === val)?.label ?? val) : 'Select category'}</SelectValue>
            </SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label>Product name <span className="text-destructive">*</span></Label>
          <Input
            placeholder="e.g. Gold Standard 100% Whey"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            disabled={saving}
          />
        </div>

        <div className="space-y-1.5">
          <Label>HSN Code <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. 21069099" value={form.hsnCode} onChange={e => setForm(f => ({ ...f, hsnCode: e.target.value }))} disabled={saving} />
        </div>
        <div className="space-y-1.5">
          <Label>GST Rate <span className="text-destructive">*</span></Label>
          <Select value={String(form.gstRate)} onValueChange={v => setForm(f => ({ ...f, gstRate: Number(v) }))}>
            <SelectTrigger>
              <SelectValue>{(val: string) => val ? `${val}%` : '18%'}</SelectValue>
            </SelectTrigger>
            <SelectContent>{GST_RATES.map(r => <SelectItem key={r} value={String(r)}>{r}%</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label>Description</Label>
          <Textarea
            placeholder="Short product description…"
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            rows={2}
            disabled={saving}
          />
        </div>

        {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}

        <div className="md:col-span-2 flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add Product'}
          </Button>
          <Link href="/master/products">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
