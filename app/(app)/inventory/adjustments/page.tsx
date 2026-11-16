'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getAdjustments, createAdjustment, approveAdjustment, rejectAdjustment, getLots } from '@/lib/services/inventory'
import { getAllBins } from '@/lib/services/warehouse'
import { getVariants } from '@/lib/services/variants'
import type { StockAdjustment, Bin, Variant, Lot } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, CheckCircle2, XCircle } from 'lucide-react'
import { format } from 'date-fns'

function fmtDate(d: string) { try { return format(new Date(d), 'dd MMM yyyy') } catch { return d } }

const reasonLabels: Record<string, string> = {
  damage: 'Damage', expiry: 'Expiry', found: 'Found', lost: 'Lost', sample: 'Sample',
}

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  approved: { label: 'Approved', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
  rejected: { label: 'Rejected', className: 'bg-destructive/15 text-destructive border-destructive/30' },
}

export default function AdjustmentsPage() {
  const { user, can } = useAuth()
  const canApprove = can('approve-adjustment')

  const [adjustments, setAdjustments] = useState<StockAdjustment[]>([])
  const [bins, setBins] = useState<Bin[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)

  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState({ variantId: '', lotId: '', binId: '', qty: 1, reason: 'damage' as StockAdjustment['reason'], notes: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [rejectDialogId, setRejectDialogId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getAdjustments(), getAllBins(), getVariants(), getLots()]).then(([a, b, v, l]) => {
      setAdjustments(a)
      setBins(b)
      setVariants(v)
      setLots(l)
      setLoading(false)
    })
  }, [])

  const pending = adjustments.filter(a => a.status === 'pending')
  const filteredLots = lots.filter(l => !form.variantId || l.variantId === form.variantId)

  async function handleCreate() {
    if (!form.variantId || !form.lotId || !form.binId) { setError('Fill all required fields.'); return }
    if (!user) return
    setSaving(true)
    setError('')
    try {
      const adj = await createAdjustment({
        variantId: form.variantId,
        lotId: form.lotId,
        binId: form.binId,
        qty: form.qty,
        reason: form.reason,
        notes: form.notes || undefined,
        requestedBy: user.id,
      })
      setAdjustments(prev => [adj, ...prev])
      setDialog(false)
      setForm({ variantId: '', lotId: '', binId: '', qty: 1, reason: 'damage', notes: '' })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleApprove(id: string) {
    if (!user) return
    const adj = await approveAdjustment(id, user.id)
    setAdjustments(prev => prev.map(a => a.id === id ? adj : a))
  }

  async function handleReject(id: string) {
    const adj = await rejectAdjustment(id)
    setAdjustments(prev => prev.map(a => a.id === id ? adj : a))
    setRejectDialogId(null)
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  function AdjustmentTable({ data }: { data: StockAdjustment[] }) {
    return (
      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Variant</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Bin</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty Change</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Reason</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Requested By</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              {canApprove && <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr><td colSpan={canApprove ? 8 : 7} className="text-center px-4 py-8 text-muted-foreground">No adjustments</td></tr>
            ) : data.map(a => {
              const variant = variants.find(v => v.id === a.variantId)
              const bin = bins.find(b => b.id === a.binId)
              const cfg = statusConfig[a.status] ?? {}
              return (
                <tr key={a.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">{variant ? `${variant.flavour} ${variant.packSize}${variant.packUnit}` : a.variantId}</td>
                  <td className="px-4 py-3 font-mono text-xs">{bin?.code ?? a.binId}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${a.qty >= 0 ? 'text-green-500' : 'text-destructive'}`}>
                      {a.qty >= 0 ? '+' : ''}{a.qty}
                    </span>
                  </td>
                  <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{reasonLabels[a.reason] ?? a.reason}</Badge></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.requestedBy}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{fmtDate(a.createdAt)}</td>
                  <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${cfg.className}`}>{cfg.label}</Badge></td>
                  {canApprove && (
                    <td className="px-4 py-3">
                      {a.status === 'pending' && (
                        <div className="flex gap-1.5">
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:text-green-600" title="Approve" onClick={() => handleApprove(a.id)}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive/80" title="Reject" onClick={() => setRejectDialogId(a.id)}>
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Stock Adjustments</h1>
          <p className="text-sm text-muted-foreground">Request and approve stock corrections</p>
        </div>
        <Button size="sm" onClick={() => setDialog(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Request Adjustment
        </Button>
      </div>

      <div className="px-6 py-4">
        <Tabs defaultValue="pending">
          <TabsList className="mb-4">
            <TabsTrigger value="pending">
              Pending {pending.length > 0 && <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[9px]">{pending.length}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="all">All ({adjustments.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pending"><AdjustmentTable data={pending} /></TabsContent>
          <TabsContent value="all"><AdjustmentTable data={adjustments} /></TabsContent>
        </Tabs>
      </div>

      {/* Add Adjustment Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Request Stock Adjustment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Variant *</Label>
              <Select value={form.variantId} onValueChange={v => setForm(p => ({ ...p, variantId: v ?? p.variantId, lotId: '' }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select variant" /></SelectTrigger>
                <SelectContent>{variants.map(v => <SelectItem key={v.id} value={v.id}>{v.skuCode} — {v.flavour}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lot *</Label>
              <Select value={form.lotId} onValueChange={v => setForm(p => ({ ...p, lotId: v ?? p.lotId }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select lot" /></SelectTrigger>
                <SelectContent>{filteredLots.map(l => <SelectItem key={l.id} value={l.id}>{l.batch}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bin *</Label>
              <Select value={form.binId} onValueChange={v => setForm(p => ({ ...p, binId: v ?? p.binId }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select bin" /></SelectTrigger>
                <SelectContent>{bins.filter(b => b.active).map(b => <SelectItem key={b.id} value={b.id}>{b.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity (+ = found, − = loss/damage)</Label>
              <Input type="number" value={form.qty} onChange={e => setForm(p => ({ ...p, qty: parseInt(e.target.value) || 0 }))} placeholder="-2 or +3" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Reason *</Label>
              <Select value={form.reason} onValueChange={v => setForm(p => ({ ...p, reason: v as StockAdjustment['reason'] }))}>
                <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(reasonLabels).map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea rows={2} className="text-sm" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Describe what happened…" />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Submitting…' : 'Submit Request'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Confirm Dialog */}
      <Dialog open={!!rejectDialogId} onOpenChange={() => setRejectDialogId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject Adjustment?</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">This adjustment request will be marked rejected. This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => rejectDialogId && handleReject(rejectDialogId)}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
