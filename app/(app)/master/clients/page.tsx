'use client'

import { useState, useEffect, useCallback } from 'react'
import { getClients, createClient, updateClient } from '@/lib/services/clients'
import type { Client } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'

import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Plus, Search } from 'lucide-react'

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

const emptyForm = {
  businessName: '', contactName: '', mobile: '', gstin: '',
  billingAddress: '', shippingAddress: '', creditLimit: '', creditDays: '30', notes: '',
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)

  const [addOpen, setAddOpen] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [addLoading, setAddLoading] = useState(false)
  const [addError, setAddError] = useState('')

  const load = useCallback(async () => {
    setLoading(true); setError('')
    try { setClients(await getClients(true)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load.') }
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

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!form.businessName.trim()) { setAddError('Business name is required.'); return }
    if (!form.contactName.trim()) { setAddError('Contact name is required.'); return }
    if (!/^\d{10}$/.test(form.mobile)) { setAddError('Enter a valid 10-digit mobile number.'); return }
    if (form.gstin && !GSTIN_RE.test(form.gstin.toUpperCase())) { setAddError('GSTIN format is invalid (e.g. 27AABCF1234A1Z1).'); return }
    if (!form.billingAddress.trim()) { setAddError('Billing address is required.'); return }
    const creditLimit = parseFloat(form.creditLimit)
    if (form.creditLimit && (isNaN(creditLimit) || creditLimit < 0)) { setAddError('Enter a valid credit limit.'); return }
    setAddError(''); setAddLoading(true)
    try {
      await createClient({
        businessName: form.businessName.trim(),
        contactName: form.contactName.trim(),
        mobile: form.mobile,
        gstin: form.gstin ? form.gstin.toUpperCase() : undefined,
        billingAddress: form.billingAddress.trim(),
        shippingAddress: form.shippingAddress || undefined,
        creditLimit: creditLimit || 0,
        creditDays: parseInt(form.creditDays) || 30,
        notes: form.notes || undefined,
        source: 'manual',
      })
      setAddOpen(false); setForm(emptyForm); await load()
    } catch (e: unknown) { setAddError(e instanceof Error ? e.message : 'Failed to create client.') }
    setAddLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{clients.filter(c => c.active).length} active clients</p>
        </div>
        <Button onClick={() => setAddOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Client
        </Button>
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
        <div className="rounded-lg border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading…</div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-destructive text-sm">{error}</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Business</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mobile</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">GSTIN</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Credit Limit</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Source</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 w-20 font-medium text-muted-foreground">Active</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center text-muted-foreground px-4 py-12">
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
                      <Switch checked={c.active} onCheckedChange={async () => { await updateClient(c.id, { active: !c.active }); await load() }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <Dialog open={addOpen} onOpenChange={o => { setAddOpen(o); if (!o) { setForm(emptyForm); setAddError('') } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Client</DialogTitle></DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Business name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. FitLife Store" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact name <span className="text-destructive">*</span></Label>
                <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile <span className="text-destructive">*</span></Label>
                <Input placeholder="10-digit number" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>GSTIN</Label>
                <Input placeholder="Optional — e.g. 27AABCF1234A1Z1" value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Billing address <span className="text-destructive">*</span></Label>
                <Textarea rows={2} value={form.billingAddress} onChange={e => setForm(f => ({ ...f, billingAddress: e.target.value }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Shipping address</Label>
                <Textarea rows={2} placeholder="If different from billing" value={form.shippingAddress} onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Credit limit (₹)</Label>
                <Input type="number" min="0" placeholder="0" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Credit days</Label>
                <Input type="number" min="0" placeholder="30" value={form.creditDays} onChange={e => setForm(f => ({ ...f, creditDays: e.target.value }))} disabled={addLoading} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Notes</Label>
                <Textarea rows={2} placeholder="Optional notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} disabled={addLoading} />
              </div>
            </div>
            {addError && <p className="text-xs text-destructive">{addError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddOpen(false)} disabled={addLoading}>Cancel</Button>
              <Button type="submit" disabled={addLoading}>{addLoading ? 'Saving…' : 'Add Client'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
