'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getPurchases, createPurchase, getGRNs, createGRN } from '@/lib/services/inventory'
import { getVendors } from '@/lib/services/vendors'
import { getVariants } from '@/lib/services/variants'
import { getUnits, getFloors } from '@/lib/services/warehouse'
import type { Purchase, GRN, Vendor, Variant, Unit, Floor } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, AlertTriangle } from 'lucide-react'
import { format } from 'date-fns'

function fmtDate(d: string) { try { return format(new Date(d), 'dd MMM yyyy') } catch { return d } }

const statusConfig: Record<string, { label: string; className: string }> = {
  'draft': { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  'grn-pending': { label: 'GRN Pending', className: 'bg-amber-500/15 text-amber-600 border-amber-500/30' },
  'grn-done': { label: 'GRN Done', className: 'bg-blue-500/15 text-blue-600 border-blue-500/30' },
  'putaway-done': { label: 'Put Away', className: 'bg-green-500/15 text-green-600 border-green-500/30' },
}

interface PurchaseLineForm { variantId: string; expectedCartons: number; expectedPacks: number; pricePerPack: number }
interface GRNLineForm { purchaseLineId: string; variantId: string; variantLabel: string; expectedCartons: number; expectedPacks: number; receivedCartons: number; receivedPacks: number; shortQty: number; damagedQty: number; batch: string; expiry: string }

export default function PurchasesPage() {
  const { can } = useAuth()
  const canAdd = can('create-grn')

  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [grns, setGRNs] = useState<GRN[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [loading, setLoading] = useState(true)

  const [purchaseDialog, setPurchaseDialog] = useState(false)
  const [pForm, setPForm] = useState({ vendorId: '', invoiceNumber: '', invoiceDate: '', unitId: '', createdBy: 'u2' })
  const [pLines, setPLines] = useState<PurchaseLineForm[]>([{ variantId: '', expectedCartons: 1, expectedPacks: 0, pricePerPack: 0 }])
  const [pSaving, setPSaving] = useState(false)
  const [pError, setPError] = useState('')

  const [grnDialog, setGRNDialog] = useState<Purchase | null>(null)
  const [grnFloorId, setGRNFloorId] = useState('')
  const [grnLines, setGRNLines] = useState<GRNLineForm[]>([])
  const [grnSaving, setGRNSaving] = useState(false)
  const [grnError, setGRNError] = useState('')

  useEffect(() => {
    Promise.all([getPurchases(), getGRNs(), getVendors(), getVariants(), getUnits(), getFloors()]).then(([p, g, v, va, u, f]) => {
      setPurchases(p)
      setGRNs(g)
      setVendors(v)
      setVariants(va)
      setUnits(u)
      setFloors(f)
      setLoading(false)
    })
  }, [])

  function openGRNDialog(purchase: Purchase) {
    const lines: GRNLineForm[] = purchase.lines.map(l => {
      const v = variants.find(v => v.id === l.variantId)
      return {
        purchaseLineId: l.id,
        variantId: l.variantId,
        variantLabel: v ? `${v.flavour} ${v.packSize}${v.packUnit} (${v.skuCode})` : l.variantId,
        expectedCartons: l.expectedCartons,
        expectedPacks: l.expectedPacks,
        receivedCartons: l.expectedCartons,
        receivedPacks: 0,
        shortQty: 0,
        damagedQty: 0,
        batch: '',
        expiry: '',
      }
    })
    setGRNLines(lines)
    setGRNFloorId('')
    setGRNError('')
    setGRNDialog(purchase)
  }

  async function handleCreatePurchase() {
    if (!pForm.vendorId || !pForm.invoiceNumber || !pForm.unitId) { setPError('Fill all required fields.'); return }
    if (pLines.some(l => !l.variantId)) { setPError('Select a variant for each line.'); return }
    setPSaving(true)
    setPError('')
    try {
      const purchase = await createPurchase({
        vendorId: pForm.vendorId,
        vendorInvoiceNumber: pForm.invoiceNumber,
        vendorInvoiceDate: pForm.invoiceDate,
        unitId: pForm.unitId,
        lines: pLines.map((l, i) => ({ id: `newpl${i}`, purchaseId: '', ...l })),
        createdBy: pForm.createdBy,
      })
      setPurchases(prev => [purchase, ...prev])
      setPurchaseDialog(false)
      setPForm({ vendorId: '', invoiceNumber: '', invoiceDate: '', unitId: '', createdBy: 'u2' })
      setPLines([{ variantId: '', expectedCartons: 1, expectedPacks: 0, pricePerPack: 0 }])
    } catch (err: unknown) {
      setPError(err instanceof Error ? err.message : 'Failed.')
    } finally {
      setPSaving(false)
    }
  }

  async function handleCreateGRN() {
    if (!grnDialog || !grnFloorId) { setGRNError('Select a floor.'); return }
    if (grnLines.some(l => !l.batch || !l.expiry)) { setGRNError('Fill batch and expiry for all lines.'); return }
    setGRNSaving(true)
    setGRNError('')
    try {
      const hasVariance = grnLines.some(l => l.shortQty > 0 || l.damagedQty > 0)
      const grn = await createGRN({
        purchaseId: grnDialog.id,
        floorId: grnFloorId,
        status: 'submitted',
        hasVariance,
        lines: grnLines.map((l, i) => ({
          id: `newgl${i}`, grnId: '',
          purchaseLineId: l.purchaseLineId,
          variantId: l.variantId,
          receivedCartons: l.receivedCartons,
          receivedPacks: l.receivedPacks,
          shortQty: l.shortQty,
          damagedQty: l.damagedQty,
          batch: l.batch,
          expiry: l.expiry,
        })),
        createdBy: 'u3',
      })
      setGRNs(prev => [grn, ...prev])
      setPurchases(prev => prev.map(p => p.id === grnDialog.id ? { ...p, status: 'grn-done' as const } : p))
      setGRNDialog(null)
    } catch (err: unknown) {
      setGRNError(err instanceof Error ? err.message : 'Failed.')
    } finally {
      setGRNSaving(false)
    }
  }

  if (loading) return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>

  const pendingGRN = purchases.filter(p => p.status === 'grn-pending')

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-xl font-semibold">Purchases &amp; GRN</h1>
        <p className="text-sm text-muted-foreground">Inward stock from vendors</p>
      </div>

      <div className="px-6 py-4">
        <Tabs defaultValue="purchases">
          <div className="flex items-center justify-between mb-4">
            <TabsList>
              <TabsTrigger value="purchases">Purchases ({purchases.length})</TabsTrigger>
              <TabsTrigger value="grn">
                GRN {pendingGRN.length > 0 && <Badge variant="destructive" className="ml-1.5 h-4 px-1 text-[9px]">{pendingGRN.length}</Badge>}
              </TabsTrigger>
            </TabsList>
            {canAdd && (
              <Button size="sm" onClick={() => setPurchaseDialog(true)}>
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Add Purchase
              </Button>
            )}
          </div>

          <TabsContent value="purchases">
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Invoice #</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Vendor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Unit</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lines</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.length === 0 ? (
                    <tr><td colSpan={7} className="text-center px-4 py-12 text-muted-foreground">No purchases yet</td></tr>
                  ) : purchases.map(p => {
                    const vendor = vendors.find(v => v.id === p.vendorId)
                    const unit = units.find(u => u.id === p.unitId)
                    const cfg = statusConfig[p.status] ?? statusConfig['draft']
                    return (
                      <tr key={p.id} className="border-t border-border hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs">{p.vendorInvoiceNumber}</td>
                        <td className="px-4 py-3">{vendor?.name ?? p.vendorId}</td>
                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.vendorInvoiceDate)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{unit?.name ?? p.unitId}</td>
                        <td className="px-4 py-3">{p.lines.length}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className={`text-[10px] ${cfg.className}`}>{cfg.label}</Badge></td>
                        <td className="px-4 py-3">
                          {p.status === 'grn-pending' && canAdd && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openGRNDialog(p)}>Create GRN</Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="grn">
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">GRN ID</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Purchase</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Floor</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Variance</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {grns.length === 0 ? (
                    <tr><td colSpan={6} className="text-center px-4 py-12 text-muted-foreground">No GRNs yet</td></tr>
                  ) : grns.map(g => {
                    const floor = floors.find(f => f.id === g.floorId)
                    return (
                      <tr key={g.id} className="border-t border-border hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono text-xs">{g.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{g.purchaseId.slice(0, 8)}</td>
                        <td className="px-4 py-3">{floor?.name ?? g.floorId}</td>
                        <td className="px-4 py-3"><Badge variant="outline" className="text-[10px]">{g.status}</Badge></td>
                        <td className="px-4 py-3">
                          {g.hasVariance ? (
                            <span className="flex items-center gap-1 text-xs text-amber-500"><AlertTriangle className="w-3 h-3" /> Yes</span>
                          ) : <span className="text-xs text-muted-foreground">None</span>}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{fmtDate(g.createdAt)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Purchase Dialog */}
      <Dialog open={purchaseDialog} onOpenChange={setPurchaseDialog}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Purchase</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Vendor *</Label>
                <Select value={pForm.vendorId} onValueChange={v => setPForm(p => ({ ...p, vendorId: v ?? p.vendorId }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select vendor" /></SelectTrigger>
                  <SelectContent>{vendors.map(v => <SelectItem key={v.id} value={v.id}>{v.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Unit *</Label>
                <Select value={pForm.unitId} onValueChange={v => setPForm(p => ({ ...p, unitId: v ?? p.unitId }))}>
                  <SelectTrigger className="text-sm"><SelectValue placeholder="Select unit" /></SelectTrigger>
                  <SelectContent>{units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Invoice Number *</Label>
                <Input value={pForm.invoiceNumber} onChange={e => setPForm(p => ({ ...p, invoiceNumber: e.target.value }))} placeholder="INV-2611-001" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Invoice Date</Label>
                <Input type="date" value={pForm.invoiceDate} onChange={e => setPForm(p => ({ ...p, invoiceDate: e.target.value }))} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Line Items *</Label>
                <Button size="sm" variant="outline" className="h-6 text-xs" onClick={() => setPLines(prev => [...prev, { variantId: '', expectedCartons: 1, expectedPacks: 0, pricePerPack: 0 }])}>
                  <Plus className="w-3 h-3 mr-1" /> Add Line
                </Button>
              </div>
              <div className="space-y-2">
                {pLines.map((line, i) => (
                  <div key={i} className="grid grid-cols-5 gap-2 items-end">
                    <div className="col-span-2 space-y-1">
                      {i === 0 && <Label className="text-xs">Variant</Label>}
                      <Select value={line.variantId} onValueChange={v => setPLines(prev => prev.map((l, idx) => idx === i ? { ...l, variantId: v ?? l.variantId } : l))}>
                        <SelectTrigger className="text-xs h-8"><SelectValue placeholder="Select variant" /></SelectTrigger>
                        <SelectContent>{variants.map(v => <SelectItem key={v.id} value={v.id}>{v.skuCode} — {v.flavour}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs">Cartons</Label>}
                      <Input type="number" min={0} className="h-8 text-xs" value={line.expectedCartons} onChange={e => setPLines(prev => prev.map((l, idx) => idx === i ? { ...l, expectedCartons: parseInt(e.target.value) || 0 } : l))} />
                    </div>
                    <div className="space-y-1">
                      {i === 0 && <Label className="text-xs">Price/pack ₹</Label>}
                      <Input type="number" min={0} className="h-8 text-xs" value={line.pricePerPack} onChange={e => setPLines(prev => prev.map((l, idx) => idx === i ? { ...l, pricePerPack: parseFloat(e.target.value) || 0 } : l))} />
                    </div>
                    <div className="flex items-end">
                      {pLines.length > 1 && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setPLines(prev => prev.filter((_, idx) => idx !== i))}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {pError && <p className="text-xs text-destructive">{pError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPurchaseDialog(false)}>Cancel</Button>
            <Button onClick={handleCreatePurchase} disabled={pSaving}>{pSaving ? 'Saving…' : 'Create Purchase'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create GRN Dialog */}
      <Dialog open={!!grnDialog} onOpenChange={() => setGRNDialog(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Create GRN — {grnDialog?.vendorInvoiceNumber}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Receiving Floor *</Label>
              <Select value={grnFloorId} onValueChange={(v) => v && setGRNFloorId(v)}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select floor" /></SelectTrigger>
                <SelectContent>{floors.map(f => <SelectItem key={f.id} value={f.id}>{f.name} ({f.code})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-3">
              <Label className="text-xs">Lines</Label>
              {grnLines.map((line, i) => (
                <div key={i} className="border border-border rounded-lg p-3 space-y-2">
                  <p className="text-xs font-medium">{line.variantLabel}</p>
                  <p className="text-xs text-muted-foreground">Expected: {line.expectedCartons} cartons + {line.expectedPacks} packs</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-xs">Received Cartons</Label>
                      <Input type="number" min={0} className="h-8 text-xs" value={line.receivedCartons} onChange={e => setGRNLines(prev => prev.map((l, idx) => idx === i ? { ...l, receivedCartons: parseInt(e.target.value) || 0 } : l))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Received Packs</Label>
                      <Input type="number" min={0} className="h-8 text-xs" value={line.receivedPacks} onChange={e => setGRNLines(prev => prev.map((l, idx) => idx === i ? { ...l, receivedPacks: parseInt(e.target.value) || 0 } : l))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Short Qty</Label>
                      <Input type="number" min={0} className="h-8 text-xs" value={line.shortQty} onChange={e => setGRNLines(prev => prev.map((l, idx) => idx === i ? { ...l, shortQty: parseInt(e.target.value) || 0 } : l))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Damaged Qty {line.damagedQty > 0 && <span className="text-amber-500">(photo required)</span>}</Label>
                      <Input type="number" min={0} className="h-8 text-xs" value={line.damagedQty} onChange={e => setGRNLines(prev => prev.map((l, idx) => idx === i ? { ...l, damagedQty: parseInt(e.target.value) || 0 } : l))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Batch *</Label>
                      <Input className="h-8 text-xs" placeholder="B2026-ON-01" value={line.batch} onChange={e => setGRNLines(prev => prev.map((l, idx) => idx === i ? { ...l, batch: e.target.value } : l))} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Expiry *</Label>
                      <Input type="date" className="h-8 text-xs" value={line.expiry} onChange={e => setGRNLines(prev => prev.map((l, idx) => idx === i ? { ...l, expiry: e.target.value } : l))} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {grnError && <p className="text-xs text-destructive">{grnError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGRNDialog(null)}>Cancel</Button>
            <Button onClick={handleCreateGRN} disabled={grnSaving}>{grnSaving ? 'Submitting…' : 'Submit GRN'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
