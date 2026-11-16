'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { getFloors, createRacks } from '@/lib/services/warehouse'
import type { Floor } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronRight } from 'lucide-react'

export default function NewRacksPage() {
  const router = useRouter()
  const params = useParams()
  const floorId = params.floorId as string

  const [floor, setFloor] = useState<Floor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [count, setCount] = useState(1)
  const [binsPerRack, setBinsPerRack] = useState(4)

  useEffect(() => {
    getFloors().then(floors => {
      setFloor(floors.find(f => f.id === floorId) ?? null)
      setLoading(false)
    })
  }, [floorId])

  async function handleCreate() {
    if (count < 1 || binsPerRack < 1) {
      setError('Count and bins per rack must be at least 1.'); return
    }
    setSaving(true); setError('')
    try {
      await createRacks(floorId, count, binsPerRack)
      router.push('/warehouse')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create racks.')
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
        <span className="hover:text-foreground">{floor?.name ?? floorId}</span>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Add Racks</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Add Racks</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{floor?.name}</p>
      </div>

      <div className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-1.5">
            <Label>Number of Racks <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={e => setCount(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">Racks will be numbered sequentially from the next available number</p>
          </div>
          <div className="space-y-1.5">
            <Label>Bins per Rack <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min={1}
              max={20}
              value={binsPerRack}
              onChange={e => setBinsPerRack(parseInt(e.target.value) || 1)}
            />
            <p className="text-xs text-muted-foreground">Each rack will get this many storage bins</p>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm text-muted-foreground md:col-span-2">
            This will create <span className="font-medium text-foreground">{count} rack{count !== 1 ? 's' : ''}</span> with <span className="font-medium text-foreground">{binsPerRack} bin{binsPerRack !== 1 ? 's' : ''}</span> each — <span className="font-medium text-foreground">{count * binsPerRack} bins</span> total on {floor?.name ?? 'this floor'}.
          </div>
        </div>

        {error && <p className="text-xs text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Link href="/warehouse"><Button variant="outline">Cancel</Button></Link>
          <Button onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : `Create ${count} Rack${count !== 1 ? 's' : ''}`}</Button>
        </div>
      </div>
    </div>
  )
}
