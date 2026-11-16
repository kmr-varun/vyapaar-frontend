'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import {
  getPickLists, confirmPickLine, createCartonOpenRequest,
} from '@/lib/services/picking'
import type { PickList, PickLine } from '@/lib/types'
import { mockVariants, mockLots, mockBins, mockOrders } from '@/lib/mock-data'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight, ClipboardList, Minus, Plus } from 'lucide-react'

function QtyStep({ value, onChange, min = 0, max }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="w-11 h-11 flex items-center justify-center rounded-lg border border-border hover:bg-muted active:scale-95 transition-all"
        onClick={() => onChange(Math.max(min, value - 1))}
      >
        <Minus className="w-4 h-4" />
      </button>
      <Input
        type="number"
        value={value}
        onChange={e => {
          const v = parseInt(e.target.value) || 0
          onChange(max !== undefined ? Math.min(max, Math.max(min, v)) : Math.max(min, v))
        }}
        className="w-16 text-center text-lg font-semibold"
      />
      <button
        type="button"
        className="w-11 h-11 flex items-center justify-center rounded-lg border border-border hover:bg-muted active:scale-95 transition-all"
        onClick={() => onChange(max !== undefined ? Math.min(max, value + 1) : value + 1)}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function PickDetailPage() {
  const { pickListId } = useParams<{ pickListId: string }>()
  const router = useRouter()
  const { user } = useAuth()

  const [pickList, setPickList] = useState<PickList | null>(null)
  const [loading, setLoading] = useState(true)
  const [lineStates, setLineStates] = useState<Record<string, { cartons: number; packs: number; short: boolean; reason: string }>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getPickLists().then(lists => {
      const found = lists.find(pl => pl.id === pickListId) ?? null
      setPickList(found)
      if (found) {
        const init: typeof lineStates = {}
        found.lines.forEach(l => {
          init[l.id] = { cartons: l.sealedCartons, packs: l.loosePacks, short: false, reason: '' }
        })
        setLineStates(init)
      }
      setLoading(false)
    })
  }, [pickListId])

  function updateLine(id: string, patch: Partial<{ cartons: number; packs: number; short: boolean; reason: string }>) {
    setLineStates(prev => ({ ...prev, [id]: { ...prev[id], ...patch } }))
  }

  async function handleConfirm() {
    if (!pickList || !user) return
    setSaving(true)
    setError('')
    try {
      for (const line of pickList.lines) {
        const s = lineStates[line.id]
        if (!s) continue
        await confirmPickLine(pickList.id, line.id, {
          pickedCartons: s.cartons,
          pickedPacks: s.packs,
          shortReason: s.short ? (s.reason || 'not found') : undefined,
        })
      }
      router.push('/picking?tab=packing')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to confirm picks.')
      setSaving(false)
    }
  }

  async function handleCartonOpenRequest(line: PickLine) {
    if (!pickList || !user) return
    await createCartonOpenRequest({
      pickLineId: line.id,
      variantId: line.variantId,
      lotId: line.lotId,
      binId: line.binId,
      packsNeeded: line.loosePacks,
      orderId: pickList.orderId,
      requestedBy: user.id,
    })
    router.push('/picking')
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  )

  if (!pickList) return (
    <div className="p-6">
      <p className="text-muted-foreground">Pick list not found.</p>
      <Link href="/picking" className="text-primary text-sm underline mt-2 inline-block">Back to Picking</Link>
    </div>
  )

  const order = mockOrders.find(o => o.id === pickList.orderId)

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/picking" className="hover:text-foreground transition-colors">Picking</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Pick List</span>
      </nav>

      <div className="flex items-center gap-3">
        <ClipboardList className="w-5 h-5 text-muted-foreground" />
        <div>
          <h1 className="text-xl font-semibold">Pick List — {order?.number}</h1>
          <p className="text-sm text-muted-foreground">{pickList.lines.length} line{pickList.lines.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      <div className="space-y-4">
        {pickList.lines.map(line => {
          const variant = mockVariants.find(v => v.id === line.variantId)
          const lot = mockLots.find(l => l.id === line.lotId)
          const bin = mockBins.find(b => b.id === line.binId)
          const s = lineStates[line.id]
          if (!s) return null
          const needsLoose = line.loosePacks > 0

          return (
            <Card key={line.id} className={line.status === 'short' ? 'border-destructive/50' : ''}>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm">{variant?.flavour} {variant?.packSize}{variant?.packUnit}</p>
                    <p className="text-xs text-muted-foreground">{variant?.skuCode}</p>
                    <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Bin: <span className="font-mono text-foreground">{bin?.code}</span></span>
                      <span>Batch: {lot?.batch}</span>
                      <span>Exp: {lot?.expiry}</span>
                    </div>
                  </div>
                  {line.status !== 'pending' && (
                    <Badge className={line.status === 'picked' ? 'bg-green-500/15 text-green-500' : 'bg-destructive/15 text-destructive'}>
                      {line.status}
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Sealed cartons to pick: {line.sealedCartons}</p>
                    <QtyStep value={s.cartons} onChange={v => updateLine(line.id, { cartons: v })} max={line.sealedCartons} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Loose packs to pick: {line.loosePacks}</p>
                    <div className="space-y-2">
                      <QtyStep value={s.packs} onChange={v => updateLine(line.id, { packs: v })} max={line.loosePacks} />
                      {needsLoose && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="text-xs w-full"
                          onClick={() => handleCartonOpenRequest(line)}
                        >
                          Request Carton Open
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`short-${line.id}`}
                    checked={s.short}
                    onCheckedChange={v => updateLine(line.id, { short: !!v })}
                  />
                  <Label htmlFor={`short-${line.id}`} className="text-sm">Short pick</Label>
                  {s.short && (
                    <Select value={s.reason} onValueChange={v => updateLine(line.id, { reason: v ?? '' })}>
                      <SelectTrigger className="h-8 text-xs flex-1">
                        <SelectValue placeholder="Reason" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not found">Not found</SelectItem>
                        <SelectItem value="damaged">Damaged</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push('/picking')}>Cancel</Button>
        <Button onClick={handleConfirm} disabled={saving} className="flex-1">
          {saving ? 'Saving…' : 'Confirm All Picks'}
        </Button>
      </div>
    </div>
  )
}
