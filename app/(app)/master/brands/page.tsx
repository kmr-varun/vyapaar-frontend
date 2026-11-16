'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getBrands, updateBrand } from '@/lib/services/brands'
import type { Brand } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, Package2 } from 'lucide-react'
import { format } from 'date-fns'

function fmtDate(iso: string) {
  try { return format(new Date(iso), 'dd MMM yyyy') } catch { return iso }
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getBrands(true)
      setBrands(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load brands.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = brands.filter(b => {
    if (!showInactive && !b.active) return false
    if (search && !b.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Brands</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{brands.filter(b => b.active).length} active brands</p>
        </div>
        <Link href="/master/brands/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Brand
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search brands…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Switch checked={showInactive} onCheckedChange={setShowInactive} />
            Show inactive
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
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brand</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 w-24 font-medium text-muted-foreground">Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center text-muted-foreground px-4 py-12 text-sm">
                      {search ? 'No brands match your search.' : 'No brands yet. Add one to get started.'}
                    </td>
                  </tr>
                ) : filtered.map(brand => (
                  <tr key={brand.id} className={`border-t border-border hover:bg-muted/20 ${!brand.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-muted flex items-center justify-center shrink-0">
                          <Package2 className="w-3.5 h-3.5 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{brand.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={brand.active ? 'default' : 'secondary'} className="text-xs">
                        {brand.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(brand.createdAt)}</td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={brand.active}
                        onCheckedChange={async () => { await updateBrand(brand.id, { active: !brand.active }); await load() }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
