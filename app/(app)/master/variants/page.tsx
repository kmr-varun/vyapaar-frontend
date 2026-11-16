'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import { getVariants, updateVariant } from '@/lib/services/variants'
import type { Brand, Product, Variant } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Variants / SKUs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{variants.filter(v => v.active).length} active SKUs</p>
        </div>
        <Link href="/master/variants/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Variant
          </Button>
        </Link>
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
        <div className="rounded-lg border border-border overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading…</div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-destructive text-sm">{error}</div>
          ) : (
            <table className="w-full text-sm min-w-[600px]">
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

    </div>
  )
}
