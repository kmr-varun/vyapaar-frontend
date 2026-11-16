'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getUnits, createFloor } from '@/lib/services/warehouse'
import type { Unit } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronRight } from 'lucide-react'

export default function NewFloorPage() {
  const router = useRouter()
  const params = useParams()
  const unitId = params.unitId as string

  const [unit, setUnit] = useState<Unit | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', code: '' })

  useEffect(() => {
    getUnits().then(units => {
      setUnit(units.find(u => u.id === unitId) ?? null)
      setLoading(false)
    })
  }, [unitId])

  async function handleCreate() {
    if (!form.name.trim() || !form.code.trim()) {
      setError('Name and code are required.'); return
    }
    setSaving(true); setError('')
    try {
      await createFloor({ unitId, name: form.name.trim(), code: form.code.trim().toUpperCase(), active: true })
      router.push('/warehouse')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create floor.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/warehouse" className="hover:text-foreground transition-colors">Warehouse</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="hover:text-foreground">{unit?.name ?? unitId}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Add Floor</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Add Floor</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{unit?.name}</p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Floor Name <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. Ground Floor"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>
          <div className="space-y-1.5">
            <Label>Floor Code <span className="text-destructive">*</span></Label>
            <Input
              placeholder="e.g. GF"
              value={form.code}
              onChange={e => setForm(p => ({ ...p, code: e.target.value }))}
            />
            <p className="text-xs text-muted-foreground">Short alphanumeric code used in bin addresses</p>
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Link href="/warehouse"><Button variant="outline">Cancel</Button></Link>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create Floor'}</Button>
        </div>
      </div>
    </div>
  )
}
