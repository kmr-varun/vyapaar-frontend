'use client'

import { useState, useEffect, useCallback } from 'react'
import { getBrands, createBrand, updateBrand } from '@/lib/services/brands'
import type { Brand } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
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

  // Add dialog
  const [addOpen, setAddOpen] = useState(false)
  const [addName, setAddName] = useState('')
  const [addActive, setAddActive] = useState(true)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  // Toggle confirm dialog
  const [toggleTarget, setToggleTarget] = useState<Brand | null>(null)
  const [toggleLoading, setToggleLoading] = useState(false)

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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!addName.trim()) { setAddError('Brand name is required.'); return }
    setAddError('')
    setAddLoading(true)
    try {
      await createBrand({ name: addName.trim() })
      setAddOpen(false)
      setAddName('')
      setAddActive(true)
      await load()
    } catch (e: unknown) {
      setAddError(e instanceof Error ? e.message : 'Failed to create brand.')
    } finally {
      setAddLoading(false)
    }
  }

  async function handleToggle() {
    if (!toggleTarget) return
    setToggleLoading(true)
    try {
      await updateBrand(toggleTarget.id, { active: !toggleTarget.active })
      setToggleTarget(null)
      await load()
    } catch {}
    setToggleLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Brands</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{brands.filter(b => b.active).length} active brands</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Brand
        </Button>
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
        <div className="rounded-lg border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading…</div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-destructive text-sm">{error}</div>
          ) : (
            <table className="w-full text-sm">
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
                        onCheckedChange={() => setToggleTarget(brand)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) { setAddName(''); setAddError('') } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Brand</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="brandName">Brand name <span className="text-destructive">*</span></Label>
              <Input
                id="brandName"
                placeholder="e.g. Optimum Nutrition"
                value={addName}
                onChange={e => setAddName(e.target.value)}
                disabled={addLoading}
                autoFocus
              />
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel</Button>
              <Button type="submit" disabled={addLoading || !addName.trim()}>
                {addLoading ? 'Saving…' : 'Add Brand'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Toggle confirm dialog */}
      <Dialog open={!!toggleTarget} onOpenChange={o => { if (!o) setToggleTarget(null) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{toggleTarget?.active ? 'Deactivate' : 'Activate'} Brand</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {toggleTarget?.active
              ? `Deactivating "${toggleTarget?.name}" will hide it from new products and the catalog.`
              : `Activating "${toggleTarget?.name}" will make it visible again.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToggleTarget(null)} disabled={toggleLoading}>Cancel</Button>
            <Button
              variant={toggleTarget?.active ? 'destructive' : 'default'}
              onClick={handleToggle}
              disabled={toggleLoading}
            >
              {toggleLoading ? 'Saving…' : toggleTarget?.active ? 'Deactivate' : 'Activate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
