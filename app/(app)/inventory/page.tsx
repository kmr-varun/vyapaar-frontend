'use client'

import { useEffect, useState, useMemo } from 'react'
import { getStockDisplay } from '@/lib/services/inventory'
import { getBrands } from '@/lib/services/brands'
import { getUnits } from '@/lib/services/warehouse'
import type { StockDisplay, Brand, Unit } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Boxes, AlertTriangle, Download, Search, CalendarClock, Package } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format, differenceInDays } from 'date-fns'

function fmtDate(d: string) {
  try { return format(new Date(d), 'dd MMM yyyy') } catch { return d }
}

export default function StockViewPage() {
  const [stock, setStock] = useState<StockDisplay[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState('all')
  const [unitFilter, setUnitFilter] = useState('all')
  const [expiryFilter, setExpiryFilter] = useState<'all' | 'expiring-6m'>('all')
  const [sortKey, setSortKey] = useState<'default' | 'name' | 'qty'>('default')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getStockDisplay(), getBrands(), getUnits()]).then(([s, b, u]) => {
      setStock(s)
      setBrands(b)
      setUnits(u)
      setLoading(false)
    })
  }, [])

  const filtered = useMemo(() => {
    const now = new Date()
    const sixMonthsOut = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000)
    let result = stock.filter(s => {
      const matchSearch = !search || s.skuCode.toLowerCase().includes(search.toLowerCase()) || s.variantLabel.toLowerCase().includes(search.toLowerCase()) || s.productName.toLowerCase().includes(search.toLowerCase())
      const matchBrand = brandFilter === 'all' || s.brandName === brands.find(b => b.id === brandFilter)?.name
      const matchUnit = unitFilter === 'all' || s.unitId === unitFilter
      const matchExpiry = expiryFilter === 'all' || (s.nearestExpiry != null && new Date(s.nearestExpiry) <= sixMonthsOut)
      return matchSearch && matchBrand && matchUnit && matchExpiry
    })
    if (sortKey === 'name') result = [...result].sort((a, b) => a.productName.localeCompare(b.productName) || a.variantLabel.localeCompare(b.variantLabel))
    if (sortKey === 'qty') result = [...result].sort((a, b) => a.availablePacks - b.availablePacks)
    return result
  }, [stock, search, brandFilter, unitFilter, expiryFilter, sortKey, brands])

  const lowStockCount = stock.filter(s => s.availablePacks <= 12 && s.availablePacks > 0).length
  const outOfStockCount = stock.filter(s => s.availablePacks <= 0).length
  const expiringSoonCount = stock.filter(s => s.nearestExpiry && differenceInDays(new Date(s.nearestExpiry), new Date()) <= 90).length
  const totalPacks = stock.reduce((sum, s) => sum + s.sealedCartons * s.unitsPerCarton + s.loosePacks, 0)

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Stock View</h1>
          <p className="text-sm text-muted-foreground">Real-time inventory across all locations</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => alert('Export coming soon')}>
          <Download className="w-3.5 h-3.5 mr-1.5" /> Export
        </Button>
      </div>

      <div className="px-6 py-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">Total SKUs tracked</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-primary" />
                <span className="text-2xl font-semibold">{stock.length}</span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">Total packs on hand</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-500" />
                <span className="text-2xl font-semibold">{totalPacks.toLocaleString('en-IN')}</span>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(lowStockCount > 0 ? 'border-amber-500/50' : '')}>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">Low / out of stock</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className={cn('w-4 h-4', (lowStockCount + outOfStockCount) > 0 ? 'text-amber-500' : 'text-muted-foreground')} />
                <span className="text-2xl font-semibold">{lowStockCount + outOfStockCount}</span>
              </div>
            </CardContent>
          </Card>
          <Card className={cn(expiringSoonCount > 0 ? 'border-amber-500/50' : '')}>
            <CardHeader className="pb-1 pt-3 px-4">
              <CardTitle className="text-xs text-muted-foreground font-normal">Expiring within 90 days</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex items-center gap-2">
                <CalendarClock className={cn('w-4 h-4', expiringSoonCount > 0 ? 'text-amber-500' : 'text-muted-foreground')} />
                <span className="text-2xl font-semibold">{expiringSoonCount}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search SKU, variant, product…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 w-64 h-8 text-sm"
            />
          </div>
          <Select value={unitFilter} onValueChange={(v) => v && setUnitFilter(v)}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue>{(val: string) => val === 'all' ? 'All units' : (units.find(u => u.id === val)?.name ?? val)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All units</SelectItem>
              {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={brandFilter} onValueChange={(v) => v && setBrandFilter(v)}>
            <SelectTrigger className="w-40 h-8 text-sm"><SelectValue placeholder="All brands" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All brands</SelectItem>
              {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={expiryFilter} onValueChange={(v) => v && setExpiryFilter(v as typeof expiryFilter)}>
            <SelectTrigger className="w-44 h-8 text-sm">
              <SelectValue>{(val: string) => val === 'expiring-6m' ? 'Expiring ≤ 6 months' : 'All expiry'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All expiry</SelectItem>
              <SelectItem value="expiring-6m">Expiring ≤ 6 months</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortKey} onValueChange={(v) => v && setSortKey(v as typeof sortKey)}>
            <SelectTrigger className="w-36 h-8 text-sm">
              <SelectValue>{(val: string) => ({ default: 'Default order', name: 'Sort: A–Z', qty: 'Sort: Qty ↑' }[val] ?? val)}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default order</SelectItem>
              <SelectItem value="name">Sort: A–Z</SelectItem>
              <SelectItem value="qty">Sort: Qty ↑</SelectItem>
            </SelectContent>
          </Select>
          <span className="text-xs text-muted-foreground self-center">{filtered.length} entries</span>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU Code</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Variant</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Product</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brand</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Location</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Sealed Cartons</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Loose Packs</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Reserved</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Available</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nearest Expiry</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center px-4 py-12 text-muted-foreground">No stock records found</td>
                </tr>
              ) : filtered.map((s, i) => {
                const expirySoon = s.nearestExpiry && differenceInDays(new Date(s.nearestExpiry), new Date()) <= 90
                const lowStock = s.availablePacks <= 12 && s.availablePacks > 0
                const outOfStock = s.availablePacks <= 0
                return (
                  <tr
                    key={`${s.variantId}-${s.binId}-${i}`}
                    className={cn('border-t border-border hover:bg-muted/20', outOfStock ? 'bg-destructive/5' : lowStock ? 'bg-amber-500/5' : '')}
                  >
                    <td className="px-4 py-3 font-mono text-xs">{s.skuCode}</td>
                    <td className="px-4 py-3">{s.variantLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.productName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{s.brandName}</td>
                    <td className="px-4 py-3">
                      {s.unitName && unitFilter === 'all' && <p className="text-[10px] text-muted-foreground">{s.unitName}</p>}
                      <p className="text-xs font-medium">{s.binName || s.binCode}</p>
                      {s.binName && <p className="font-mono text-[10px] text-muted-foreground">{s.binCode}</p>}
                    </td>
                    <td className="px-4 py-3 text-right">{s.sealedCartons}</td>
                    <td className="px-4 py-3 text-right">{s.loosePacks}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{s.reservedPacks}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={cn('font-medium', outOfStock ? 'text-destructive' : lowStock ? 'text-amber-500' : '')}>
                        {s.availablePacks}
                      </span>
                      {outOfStock && <Badge variant="destructive" className="ml-1.5 text-[9px] h-4 px-1">Out</Badge>}
                      {lowStock && <Badge className="ml-1.5 text-[9px] h-4 px-1 bg-amber-500/20 text-amber-600 border-amber-500/30">Low</Badge>}
                    </td>
                    <td className={cn('px-4 py-3', expirySoon ? 'text-amber-500' : 'text-muted-foreground')}>
                      {s.nearestExpiry ? fmtDate(s.nearestExpiry) : '—'}
                      {expirySoon && <AlertTriangle className="inline w-3 h-3 ml-1" />}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
