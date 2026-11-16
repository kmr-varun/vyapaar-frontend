'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/services/clients'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronRight } from 'lucide-react'

const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    businessName: '', contactName: '', mobile: '', gstin: '',
    billingAddress: '', shippingAddress: '', creditLimit: '', creditDays: '30', notes: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.businessName.trim()) { setError('Business name is required.'); return }
    if (!form.contactName.trim()) { setError('Contact name is required.'); return }
    if (!/^\d{10}$/.test(form.mobile)) { setError('Enter a valid 10-digit mobile number.'); return }
    if (form.gstin && !GSTIN_RE.test(form.gstin.toUpperCase())) { setError('GSTIN format is invalid (e.g. 27AABCF1234A1Z1).'); return }
    if (!form.billingAddress.trim()) { setError('Billing address is required.'); return }
    const creditLimit = parseFloat(form.creditLimit)
    if (form.creditLimit && (isNaN(creditLimit) || creditLimit < 0)) { setError('Enter a valid credit limit.'); return }
    setError('')
    setSaving(true)
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
      router.push('/master/clients')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create client.')
    }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/master/clients" className="hover:text-foreground transition-colors">Clients</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">New Client</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Add Client</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add a new retail or wholesale client</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <Label>Business name <span className="text-destructive">*</span></Label>
          <Input placeholder="e.g. FitLife Store" value={form.businessName} onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))} disabled={saving} autoFocus />
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
          <Input placeholder="Optional — e.g. 27AABCF1234A1Z1" value={form.gstin} onChange={e => setForm(f => ({ ...f, gstin: e.target.value.toUpperCase() }))} disabled={saving} />
        </div>
        <div className="space-y-1.5">
          <Label>Credit limit (₹)</Label>
          <Input type="number" min="0" placeholder="0" value={form.creditLimit} onChange={e => setForm(f => ({ ...f, creditLimit: e.target.value }))} disabled={saving} />
        </div>

        <div className="space-y-1.5">
          <Label>Credit days</Label>
          <Input type="number" min="0" placeholder="30" value={form.creditDays} onChange={e => setForm(f => ({ ...f, creditDays: e.target.value }))} disabled={saving} />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label>Billing address <span className="text-destructive">*</span></Label>
          <Textarea rows={2} value={form.billingAddress} onChange={e => setForm(f => ({ ...f, billingAddress: e.target.value }))} disabled={saving} />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label>Shipping address</Label>
          <Textarea rows={2} placeholder="If different from billing" value={form.shippingAddress} onChange={e => setForm(f => ({ ...f, shippingAddress: e.target.value }))} disabled={saving} />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label>Notes</Label>
          <Textarea rows={2} placeholder="Optional notes…" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} disabled={saving} />
        </div>

        {error && <p className="md:col-span-2 text-sm text-destructive">{error}</p>}

        <div className="md:col-span-2 flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Add Client'}
          </Button>
          <Link href="/master/clients">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
