'use client'

import { useEffect, useState } from 'react'
import { getTransfers, createTransfer, receiveTransfer, getLots } from '@/lib/services/inventory'
import { getAllBins } from '@/lib/services/warehouse'
import { getVariants } from '@/lib/services/variants'
import type { StockTransfer, Bin, Variant, Lot } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus } from 'lucide-react'
import { format } from 'date-fns'

function fmtDate(d: string) { try { return format(new Date(d), 'dd MMM yyyy') } catch { return d } }

const statusConfig: Record<string, { label: string; className: string }> = {
  'draft': { label: 'Draft', className: '' },
  'in-transit': { label: 'In Transit', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  'received': { label: 'Received', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
  'variance': { label: 'Variance', className: 'bg-destructive/15 text-destructive border-destructive/30' },
}

export default function TransfersPage() {
  const [transfers, setTransfers] = useState<StockTransfer[]>([])
  const [bins, setBins] = useState<Bin[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [loading, setLoading] = useState(true)

  const [dialog, setDialog] = useState(false)
  const [form, setForm] = useState({ fromBinId: '', toBinId: '', variantId: '', lotId: '', qty: 1 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getTransfers(), getAllBins(), getVariants(), getLots()]).then(([t, b, v, l]) => {
      setTransfers(t)
      setBins(b)
      setVariants(v)
      setLots(l)
      setLoading(false)
    })
  }, [])

  const filteredLots = lots.filter(l => !form.variantId || l.variantId === form.variantId)

  async function handleCreate() {
    if (!form.fromBinId || !form.toBinId || !form.variantId || !form.lotId) {
      setError('Fill all fields.')
      return
    }
    if (form.fromBinId === form.toBinId) { setError('From and to bins must be different.'); return }
    setSaving(true)
    setError('')
    try {
      const t = await createTransfer({ fromBinId: form.fromBinId, toBinId: form.toBinId, variantId: form.variantId, lotId: form.lotId, qty: form.qty, status: 'in-transit', createdBy: 'u3' })
      setTransfers(prev => [t, ...prev])
      setDialog(false)
      setForm({ fromBinId: '', toBinId: '', variantId: '', lotId: '', qty: 1 })
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed.')
    } finally {
      setSaving(false)
    }
  }

  async function handleReceive(id: string) {
    const t = await receiveTransfer(id)
    setTransfers(prev => prev.map(tr => tr.id === id ? t : tr))
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Stock Transfers</h1>
          <p className="text-sm text-muted-foreground">Move stock between bins, floors or units</p>
        </div>
        <Button size="sm" onClick={() => setDialog(true)}>
          <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Transfer
        </Button>
      </div>

      <div className="px-6 py-4">
        <div className="rounded-lg border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">From Bin</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">To Bin</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Variant</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty (packs)</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Received</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
              </tr>
            </thead>
            <tbody>
              {transfers.length === 0 ? (
                <tr><td colSpan={9} className="text-center px-4 py-12 text-muted-foreground">No transfers yet</td></tr>
              ) : transfers.map(t => {
                const fromBin = bins.find(b => b.id === t.fromBinId)
                const toBin = bins.find(b => b.id === t.toBinId)
                const variant = variants.find(v => v.id === t.variantId)
                const cfg = statusConfig[t.status] ?? {}
                return (
                  <tr key={t.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono text-xs">{t.id.slice(0, 6)}</td>
                    <td className="px-4 py-3 font-mono text-xs">{fromBin?.code ?? t.fromBinId}</td>
                    <td className="px-4 py-3 font-mono text-xs">{toBin?.code ?? t.toBinId}</td>
                    <td className="px-4 py-3">{variant ? `${variant.flavour} ${variant.packSize}${variant.packUnit}` : t.variantId}</td>
                    <td className="px-4 py-3 text-right">{t.qty}</td>
                    <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${cfg.className}`}>{cfg.label}</Badge></td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(t.createdAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.receivedAt ? fmtDate(t.receivedAt) : '—'}</td>
                    <td className="px-4 py-3">
                      {t.status === 'in-transit' && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleReceive(t.id)}>Mark Received</Button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>Add Stock Transfer</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Variant *</Label>
              <Select value={form.variantId} onValueChange={v => setForm(p => ({ ...p, variantId: v ?? p.variantId, lotId: '' }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select variant" /></SelectTrigger>
                <SelectContent>{variants.map(v => <SelectItem key={v.id} value={v.id}>{v.skuCode} — {v.flavour}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Lot / Batch *</Label>
              <Select value={form.lotId} onValueChange={v => setForm(p => ({ ...p, lotId: v ?? p.lotId }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select lot" /></SelectTrigger>
                <SelectContent>{filteredLots.map(l => <SelectItem key={l.id} value={l.id}>{l.batch} (exp {l.expiry})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">From Bin *</Label>
              <Select value={form.fromBinId} onValueChange={v => setForm(p => ({ ...p, fromBinId: v ?? p.fromBinId }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select source bin" /></SelectTrigger>
                <SelectContent>{bins.filter(b => b.active).map(b => <SelectItem key={b.id} value={b.id}>{b.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">To Bin *</Label>
              <Select value={form.toBinId} onValueChange={v => setForm(p => ({ ...p, toBinId: v ?? p.toBinId }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select destination bin" /></SelectTrigger>
                <SelectContent>{bins.filter(b => b.active && b.id !== form.fromBinId).map(b => <SelectItem key={b.id} value={b.id}>{b.code}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quantity (packs) *</Label>
              <Input type="number" min={1} value={form.qty} onChange={e => setForm(p => ({ ...p, qty: parseInt(e.target.value) || 1 }))} />
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? 'Saving…' : 'Create Transfer'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
