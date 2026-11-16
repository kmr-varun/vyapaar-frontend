'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createUnit } from '@/lib/services/warehouse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronRight } from 'lucide-react'

export default function NewUnitPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', address: '', gstin: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !form.address) return
    setSaving(true)
    setError('')
    try {
      await createUnit({ name: form.name, address: form.address, gstin: form.gstin || undefined, active: true })
      router.push('/warehouse')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create unit.')
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/warehouse" className="hover:text-foreground transition-colors">Warehouse</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Add Unit</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Add Unit</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Add a new warehouse unit</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Unit Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Unit 3 — Navi Mumbai"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label>GSTIN (optional)</Label>
            <Input
              placeholder="27AABCR..."
              value={form.gstin}
              onChange={e => setForm(p => ({ ...p, gstin: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <Label>Address <span className="text-destructive">*</span></Label>
            <Input
              placeholder="Full address"
              value={form.address}
              onChange={e => setForm(p => ({ ...p, address: e.target.value }))}
              required
            />
          </div>
        </div>

        {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}

        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/warehouse')}>Cancel</Button>
          <Button type="submit" disabled={saving || !form.name || !form.address}>
            {saving ? 'Saving…' : 'Add Unit'}
          </Button>
        </div>
      </form>
    </div>
  )
}
