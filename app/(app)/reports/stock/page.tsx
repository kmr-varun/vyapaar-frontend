'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getStockDisplay } from '@/lib/services/inventory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Download, Search } from 'lucide-react'
import type { StockDisplay } from '@/lib/types'

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

const ageingBuckets = [
  { label: '0–30 days', count: 4, packs: 72 },
  { label: '31–90 days', count: 2, packs: 24 },
  { label: '91–180 days', count: 1, packs: 15 },
  { label: '180+ days', count: 0, packs: 0 },
]

export default function StockReportPage() {
  const { can } = useAuth()
  const [stockRows, setStockRows] = useState<StockDisplay[]>([])
  const [search, setSearch] = useState('')
  const [unit, setUnit] = useState('all')
  const [brand, setBrand] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStockDisplay().then(setStockRows).finally(() => setLoading(false))
  }, [])

  const filtered = stockRows.filter(r =>
    r.variantLabel.toLowerCase().includes(search.toLowerCase()) ||
    r.skuCode.toLowerCase().includes(search.toLowerCase()) ||
    r.binCode.toLowerCase().includes(search.toLowerCase())
  )

  const mockCostPerPack: Record<string, number> = {
    v2: 4200, v3: 4200, v5: 1900, v8: 4600, v1: 2200, v6: 3800,
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Stock Report</h1>
          <p className="text-sm text-muted-foreground">Current stock by location</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => alert('Preparing export...')}>
          <Download className="w-4 h-4 mr-2" /> Export Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1 col-span-2 sm:col-span-1">
              <Label className="text-xs">Search</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="SKU, variant, bin…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="h-8 text-sm pl-8"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unit</Label>
              <Select value={unit} onValueChange={(v) => v && setUnit(v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue>{(val: string) => ({ all: 'All units', unit1: 'Unit 1 — Andheri', unit2: 'Unit 2 — Bhiwandi' }[val] ?? val)}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All units</SelectItem>
                  <SelectItem value="unit1">Unit 1 — Andheri</SelectItem>
                  <SelectItem value="unit2">Unit 2 — Bhiwandi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Brand</Label>
              <Select value={brand} onValueChange={(v) => v && setBrand(v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue>{(val: string) => ({ all: 'All brands', br1: 'Optimum Nutrition', br2: 'MuscleBlaze', br4: 'Avatar Nutrition' }[val] ?? val)}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brands</SelectItem>
                  <SelectItem value="br1">Optimum Nutrition</SelectItem>
                  <SelectItem value="br2">MuscleBlaze</SelectItem>
                  <SelectItem value="br4">Avatar Nutrition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">As of Date</Label>
              <Input type="date" defaultValue="2026-11-16" className="h-8 text-sm" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stock Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">No stock records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    {['Variant', 'SKU', 'Bin', 'Sealed Cartons', 'Loose Packs', 'Reserved', 'Available', ...(can('view-cost-prices') ? ['Cost Valuation'] : [])].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => (
                    <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">{row.productName}</p>
                        <p className="text-muted-foreground">{row.variantLabel}</p>
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">{row.skuCode}</td>
                      <td className="px-4 py-3 font-mono">{row.binCode}</td>
                      <td className="px-4 py-3 text-right">{row.sealedCartons}</td>
                      <td className="px-4 py-3 text-right">{row.loosePacks}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{row.reservedPacks}</td>
                      <td className="px-4 py-3 text-right font-medium">{row.availablePacks}</td>
                      {can('view-cost-prices') && (
                        <td className="px-4 py-3 text-right">
                          {inr((mockCostPerPack[row.variantId] ?? 2000) * (row.sealedCartons * row.unitsPerCarton + row.loosePacks))}
                        </td>
                      )}
                      <td className="px-4 py-3 text-muted-foreground">
                        {row.nearestExpiry ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stock Ageing */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Stock Ageing</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {ageingBuckets.map(b => (
              <div key={b.label} className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">{b.label}</p>
                <p className="text-xl font-bold">{b.count}</p>
                <p className="text-xs text-muted-foreground">lots · {b.packs} packs</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
