'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getVendors, getVendorPriceRules } from '@/lib/services/vendors'
import { getVariants } from '@/lib/services/variants'
import type { Vendor, VendorPriceRule, Variant } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Plus, Search } from 'lucide-react'
import { format } from 'date-fns'

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const fmtDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy') } catch { return s } }

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [rules, setRules] = useState<VendorPriceRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [v, vars] = await Promise.all([getVendors(true), getVariants(undefined, true)])
      setVendors(v); setVariants(vars)
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const loadRules = useCallback(async () => {
    if (!selectedVendor) return
    setRulesLoading(true)
    try {
      const all = await getVendorPriceRules()
      setRules(all.filter(r => r.vendorId === selectedVendor.id))
    } catch {}
    setRulesLoading(false)
  }, [selectedVendor])

  useEffect(() => { loadRules() }, [loadRules])

  const filtered = vendors.filter(v => !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.mobile.includes(search))
  const variantMap = Object.fromEntries(variants.map(v => [v.id, v]))

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{vendors.filter(v => v.active).length} active vendors</p>
        </div>
        <Link href="/master/vendors/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Vendor
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">No vendors found.</div>
          ) : (
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendor</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mobile</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Terms</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr
                    key={v.id}
                    onClick={() => setSelectedVendor(v)}
                    className={`border-t border-border hover:bg-muted/50 cursor-pointer ${selectedVendor?.id === v.id ? 'bg-primary/5' : ''}`}
                  >
                    <td className="px-4 py-3 font-medium">{v.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.contactName}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{v.mobile}</td>
                    <td className="px-4 py-3 text-muted-foreground">{v.paymentTerms}</td>
                    <td className="px-4 py-3">
                      <Badge variant={v.active ? 'default' : 'secondary'} className="text-xs">{v.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {selectedVendor && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 pt-2">
            <div className="lg:col-span-2">
              <div className="rounded-lg border border-border p-4 space-y-1 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-base">{selectedVendor.name}</p>
                  <Badge variant={selectedVendor.active ? 'default' : 'secondary'}>{selectedVendor.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="text-muted-foreground">Contact: {selectedVendor.contactName} · {selectedVendor.mobile}</p>
                {selectedVendor.gstin && <p className="text-muted-foreground">GSTIN: {selectedVendor.gstin}</p>}
                <p className="text-muted-foreground">Terms: {selectedVendor.paymentTerms}</p>
                {selectedVendor.address && <p className="text-muted-foreground">{selectedVendor.address}</p>}
              </div>
            </div>

            <div className="lg:col-span-3 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Price Rules</p>
                <Link href={`/master/vendors/${selectedVendor.id}/price-rules/new`}>
                  <Button size="sm" variant="outline" className="gap-1 h-7 text-xs">
                    <Plus className="w-3 h-3" /> Add Rule
                  </Button>
                </Link>
              </div>
              <div className="rounded-lg border border-border overflow-x-auto">
                {rulesLoading ? (
                  <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">Loading…</div>
                ) : rules.length === 0 ? (
                  <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">No price rules. Add one above.</div>
                ) : (
                  <table className="w-full text-sm min-w-[600px]">
                    <thead className="bg-muted/40">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">SKU</th>
                        <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price/Pack</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Valid</th>
                        <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rules.map(r => {
                        const v = variantMap[r.variantId]
                        return (
                          <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                            <td className="px-4 py-3 font-mono text-xs">{v?.skuCode ?? r.variantId}</td>
                            <td className="px-4 py-3 text-right">{inrFmt.format(r.pricePerPack)}</td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(r.validFrom)} – {fmtDate(r.validTo)}</td>
                            <td className="px-4 py-3"><Badge variant={r.active ? 'default' : 'secondary'} className="text-xs">{r.active ? 'Active' : 'Inactive'}</Badge></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
