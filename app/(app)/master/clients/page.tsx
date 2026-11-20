'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getClients, updateClient } from '@/lib/services/clients'
import type { Client } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, Share2 } from 'lucide-react'

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const c = await getClients(true)
      setClients(c)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load.') }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = clients.filter(c => {
    if (!showInactive && !c.active) return false
    if (search) {
      const q = search.toLowerCase()
      return c.businessName.toLowerCase().includes(q) || c.contactName.toLowerCase().includes(q) || c.mobile.includes(search)
    }
    return true
  })

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{clients.filter(c => c.active).length} active clients</p>
        </div>
        <Link href="/master/clients/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Add Client
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by name or mobile…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
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
            <table className="w-full text-sm min-w-[700px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mobile</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">GSTIN</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Credit Limit</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 font-medium text-muted-foreground">Catalog</th>
                  <th className="px-4 py-3 w-16 font-medium text-muted-foreground">Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center text-muted-foreground px-4 py-12">
                      {search ? 'No clients match your search.' : 'No clients yet. Add one to get started.'}
                    </td>
                  </tr>
                ) : filtered.map(c => (
                  <tr key={c.id} className={`border-t border-border hover:bg-muted/20 ${!c.active ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{c.businessName}</p>
                        <p className="text-xs text-muted-foreground">{c.billingAddress.substring(0, 40)}{c.billingAddress.length > 40 ? '…' : ''}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">{c.contactName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.mobile}</td>
                    <td className="px-4 py-3 font-mono text-xs">{c.gstin ?? '—'}</td>
                    <td className="px-4 py-3 text-right">{inrFmt.format(c.creditLimit)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={c.source === 'catalog' ? 'secondary' : 'outline'} className="text-xs capitalize">{c.source}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={c.active ? 'default' : 'secondary'} className="text-xs">{c.active ? 'Active' : 'Inactive'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/master/clients/${c.id}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          View
                        </Link>
                        {c.active && (
                          <Link
                            href={`/master/clients/${c.id}/send-link`}
                            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary hover:underline"
                          >
                            <Share2 className="w-3 h-3" /> Send Link
                          </Link>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Switch checked={c.active} onCheckedChange={async () => { await updateClient(c.id, { active: !c.active }); await load() }} />
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
