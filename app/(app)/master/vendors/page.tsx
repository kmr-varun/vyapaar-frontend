'use client'

import { useState, useEffect, useCallback } from 'react'
import { getVendors, createVendor, getVendorPriceRules, createVendorPriceRule } from '@/lib/services/vendors'
import { getVariants } from '@/lib/services/variants'
import type { Vendor, VendorPriceRule, Variant, PaymentMode } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Search } from 'lucide-react'
import { format } from 'date-fns'

const inrFmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })
const fmtDate = (s: string) => { try { return format(new Date(s), 'dd MMM yyyy') } catch { return s } }

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Advance']
const PAYMENT_MODES: { value: PaymentMode; label: string }[] = [
  { value: 'upi', label: 'UPI' }, { value: 'bank', label: 'Bank Transfer' },
  { value: 'cash', label: 'Cash' }, { value: 'credit', label: 'Credit' },
]

const emptyVendor = { name: '', gstin: '', contactName: '', mobile: '', email: '', address: '', paymentTerms: 'Net 30' }
const emptyRule = { variantId: '', pricePerPack: '', minCartons: '', paymentMode: '' as PaymentMode | '', deliveryWithinDays: '', validFrom: '', validTo: '' }

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [rules, setRules] = useState<VendorPriceRule[]>([])
  const [rulesLoading, setRulesLoading] = useState(false)

  const [addVendorOpen, setAddVendorOpen] = useState(false)
  const [vendorForm, setVendorForm] = useState(emptyVendor)
  const [vendorLoading, setVendorLoading] = useState(false)
  const [vendorError, setVendorError] = useState('')

  const [addRuleOpen, setAddRuleOpen] = useState(false)
  const [ruleForm, setRuleForm] = useState(emptyRule)
  const [ruleLoading, setRuleLoading] = useState(false)
  const [ruleError, setRuleError] = useState('')

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

  async function handleAddVendor(e: React.FormEvent) {
    e.preventDefault()
    if (!vendorForm.name.trim()) { setVendorError('Vendor name is required.'); return }
    if (!vendorForm.contactName.trim()) { setVendorError('Contact name is required.'); return }
    if (!/^\d{10}$/.test(vendorForm.mobile)) { setVendorError('Enter a valid 10-digit mobile number.'); return }
    setVendorError(''); setVendorLoading(true)
    try {
      await createVendor({
        name: vendorForm.name.trim(),
        gstin: vendorForm.gstin || undefined,
        contactName: vendorForm.contactName.trim(),
        mobile: vendorForm.mobile,
        email: vendorForm.email || undefined,
        address: vendorForm.address.trim(),
        paymentTerms: vendorForm.paymentTerms,
      })
      setAddVendorOpen(false); setVendorForm(emptyVendor); await load()
    } catch (e: unknown) { setVendorError(e instanceof Error ? e.message : 'Failed.') }
    setVendorLoading(false)
  }

  async function handleAddRule(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedVendor) return
    if (!ruleForm.variantId) { setRuleError('Select a variant.'); return }
    const price = parseFloat(ruleForm.pricePerPack)
    if (!ruleForm.pricePerPack || isNaN(price) || price <= 0) { setRuleError('Enter a valid price.'); return }
    if (!ruleForm.validFrom || !ruleForm.validTo) { setRuleError('Enter valid from/to dates.'); return }
    setRuleError(''); setRuleLoading(true)
    try {
      await createVendorPriceRule({
        vendorId: selectedVendor.id,
        variantId: ruleForm.variantId,
        pricePerPack: price,
        minCartons: ruleForm.minCartons ? parseInt(ruleForm.minCartons) : undefined,
        paymentMode: ruleForm.paymentMode || undefined,
        deliveryWithinDays: ruleForm.deliveryWithinDays ? parseInt(ruleForm.deliveryWithinDays) : undefined,
        validFrom: ruleForm.validFrom,
        validTo: ruleForm.validTo,
        active: true,
      })
      setAddRuleOpen(false); setRuleForm(emptyRule); await loadRules()
    } catch (e: unknown) { setRuleError(e instanceof Error ? e.message : 'Failed.') }
    setRuleLoading(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Vendors</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{vendors.filter(v => v.active).length} active vendors</p>
        </div>
        <Button onClick={() => setAddVendorOpen(true)} size="sm" className="gap-1.5">
          <Plus className="w-4 h-4" /> Add Vendor
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search vendors…" value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        {/* Vendor list table */}
        <div className="rounded-lg border border-border overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center h-24 text-muted-foreground text-sm">No vendors found.</div>
          ) : (
            <table className="w-full text-sm">
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

        {/* Vendor detail + price rules */}
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
                <Button size="sm" variant="outline" onClick={() => setAddRuleOpen(true)} className="gap-1 h-7 text-xs">
                  <Plus className="w-3 h-3" /> Add Rule
                </Button>
              </div>
              <div className="rounded-lg border border-border overflow-hidden">
                {rulesLoading ? (
                  <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">Loading…</div>
                ) : rules.length === 0 ? (
                  <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">No price rules. Add one above.</div>
                ) : (
                  <table className="w-full text-sm">
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

      {/* Add Vendor Dialog */}
      <Dialog open={addVendorOpen} onOpenChange={o => { setAddVendorOpen(o); if (!o) { setVendorForm(emptyVendor); setVendorError('') } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader><DialogTitle>Add Vendor</DialogTitle></DialogHeader>
          <form onSubmit={handleAddVendor} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <Label>Vendor name <span className="text-destructive">*</span></Label>
                <Input placeholder="e.g. Nutritech Distributors" value={vendorForm.name} onChange={e => setVendorForm(f => ({ ...f, name: e.target.value }))} disabled={vendorLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Contact name <span className="text-destructive">*</span></Label>
                <Input value={vendorForm.contactName} onChange={e => setVendorForm(f => ({ ...f, contactName: e.target.value }))} disabled={vendorLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Mobile <span className="text-destructive">*</span></Label>
                <Input placeholder="10-digit number" value={vendorForm.mobile} onChange={e => setVendorForm(f => ({ ...f, mobile: e.target.value }))} disabled={vendorLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>GSTIN</Label>
                <Input placeholder="Optional" value={vendorForm.gstin} onChange={e => setVendorForm(f => ({ ...f, gstin: e.target.value }))} disabled={vendorLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="Optional" value={vendorForm.email} onChange={e => setVendorForm(f => ({ ...f, email: e.target.value }))} disabled={vendorLoading} />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Address</Label>
                <Textarea rows={2} value={vendorForm.address} onChange={e => setVendorForm(f => ({ ...f, address: e.target.value }))} disabled={vendorLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment terms</Label>
                <Select value={vendorForm.paymentTerms} onValueChange={v => setVendorForm(f => ({ ...f, paymentTerms: v ?? f.paymentTerms }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            {vendorError && <p className="text-xs text-destructive">{vendorError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddVendorOpen(false)} disabled={vendorLoading}>Cancel</Button>
              <Button type="submit" disabled={vendorLoading}>{vendorLoading ? 'Saving…' : 'Add Vendor'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Rule Dialog */}
      <Dialog open={addRuleOpen} onOpenChange={o => { setAddRuleOpen(o); if (!o) { setRuleForm(emptyRule); setRuleError('') } }}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Add Price Rule — {selectedVendor?.name}</DialogTitle></DialogHeader>
          <form onSubmit={handleAddRule} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Variant / SKU <span className="text-destructive">*</span></Label>
              <Select value={ruleForm.variantId} onValueChange={v => setRuleForm(f => ({ ...f, variantId: v ?? f.variantId }))}>
                <SelectTrigger><SelectValue placeholder="Select variant" /></SelectTrigger>
                <SelectContent>{variants.filter(v => v.active).map(v => <SelectItem key={v.id} value={v.id}>{v.skuCode} — {v.flavour} {v.packSize}{v.packUnit}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Price per pack (₹) <span className="text-destructive">*</span></Label>
                <Input type="number" min="1" step="0.01" value={ruleForm.pricePerPack} onChange={e => setRuleForm(f => ({ ...f, pricePerPack: e.target.value }))} disabled={ruleLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Min cartons</Label>
                <Input type="number" min="1" placeholder="Optional" value={ruleForm.minCartons} onChange={e => setRuleForm(f => ({ ...f, minCartons: e.target.value }))} disabled={ruleLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Payment mode</Label>
                <Select value={ruleForm.paymentMode} onValueChange={v => setRuleForm(f => ({ ...f, paymentMode: v as PaymentMode }))}>
                  <SelectTrigger><SelectValue placeholder="Any" /></SelectTrigger>
                  <SelectContent>{PAYMENT_MODES.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Delivery within (days)</Label>
                <Input type="number" min="1" placeholder="Optional" value={ruleForm.deliveryWithinDays} onChange={e => setRuleForm(f => ({ ...f, deliveryWithinDays: e.target.value }))} disabled={ruleLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Valid from <span className="text-destructive">*</span></Label>
                <Input type="date" value={ruleForm.validFrom} onChange={e => setRuleForm(f => ({ ...f, validFrom: e.target.value }))} disabled={ruleLoading} />
              </div>
              <div className="space-y-1.5">
                <Label>Valid to <span className="text-destructive">*</span></Label>
                <Input type="date" value={ruleForm.validTo} onChange={e => setRuleForm(f => ({ ...f, validTo: e.target.value }))} disabled={ruleLoading} />
              </div>
            </div>
            {ruleError && <p className="text-xs text-destructive">{ruleError}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddRuleOpen(false)} disabled={ruleLoading}>Cancel</Button>
              <Button type="submit" disabled={ruleLoading}>{ruleLoading ? 'Saving…' : 'Add Rule'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
