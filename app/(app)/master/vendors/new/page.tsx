'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createVendor } from '@/lib/services/vendors'
import type { PaymentMode } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight } from 'lucide-react'

const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Advance']

export default function NewVendorPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    name: '', gstin: '', contactName: '', mobile: '', email: '', address: '', paymentTerms: 'Net 30',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Vendor name is required.'); return }
    if (!form.contactName.trim()) { setError('Contact name is required.'); return }
    if (!/^\d{10}$/.test(form.mobile)) { setError('Enter a valid 10-digit mobile number.'); return }
    setError('')
    setSaving(true)
    try {
      await createVendor({
        name: form.name.trim(),
        gstin: form.gstin || undefined,
        contactName: form.contactName.trim(),
        mobile: form.mobile,
        email: form.email || undefined,
        address: form.address.trim(),
        paymentTerms: form.paymentTerms,
      })
      router.push('/master/vendors')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create vendor.')
    }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/master/vendors" className="hover:text-foreground transition-colors">Vendors</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">New Vendor</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Add Vendor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add a new supplier / distributor</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <Label>Vendor name <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. Nutritech Distributors" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} disabled={saving} autoFocus />
        </div>

        <div className="space-y-1.5">
          <Label>Contact name <span className="text-destructive">*</span></Label>
          <Input value={form.contactName} onChange={e => setForm(f => ({ ...f, contactName: e.target.value }))} disabled={saving} />
        </div>
        <div className="space-y-1.5">
          <Label>Mobile <span className="text-destructive">*</span></Label>
          <Input placeholder="10-digit number" value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} disabled={saving} />
        </div>

        <div className="space-y-1.5">
          <Label>GSTIN</Label>
          <Input placeholder="Optional" value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value }))} disabled={saving} />
        </div>
        <div className="space-y-1.5">
          <Label>Email</Label>
          <Input type="email" placeholder="Optional" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} disabled={saving} />
        </div>

        <div className="space-y-1.5">
          <Label>Payment terms</Label>
          <Select value={form.paymentTerms} onValueChange={v => setForm(f => ({ ...f, paymentTerms: v ?? f.paymentTerms }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{PAYMENT_TERMS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label>Address</Label>
          <Textarea rows={2} value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} disabled={saving} />
        </div>

        {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}

        <div className="md:col-span-2 flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add Vendor'}
          </Button>
          <Link href="/master/vendors">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
