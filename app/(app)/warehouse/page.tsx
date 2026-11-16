'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { getUnits, createUnit, getFloors, createFloor, getRacks, createRacks, getBins, updateBin } from '@/lib/services/warehouse'
import type { Unit, Floor, Rack, Bin } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, ChevronRight, Building2, Layers, Grid3X3, Box, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

const FLOOR_MANAGERS = [
  { id: 'u3', name: 'Suresh Kumar' },
  { id: 'u7', name: 'Anil Gupta' },
]

export default function WarehousePage() {
  const { can } = useAuth()
  const canEdit = can('edit-warehouse')

  const [units, setUnits] = useState<Unit[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [racks, setRacks] = useState<Rack[]>([])
  const [bins, setBins] = useState<Bin[]>([])
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [selectedFloor, setSelectedFloor] = useState<Floor | null>(null)
  const [expandedRacks, setExpandedRacks] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [binError, setBinError] = useState('')

  // Unit dialog
  const [unitDialog, setUnitDialog] = useState(false)
  const [unitForm, setUnitForm] = useState({ name: '', address: '', gstin: '' })
  const [unitSaving, setUnitSaving] = useState(false)

  // Floor dialog
  const [floorDialog, setFloorDialog] = useState(false)
  const [floorForm, setFloorForm] = useState({ name: '', primaryFloorManagerId: '' })
  const [floorSaving, setFloorSaving] = useState(false)

  // Rack dialog
  const [rackDialog, setRackDialog] = useState(false)
  const [rackForm, setRackForm] = useState({ count: 1, binsPerRack: 4 })
  const [rackSaving, setRackSaving] = useState(false)

  useEffect(() => {
    getUnits().then(u => { setUnits(u); setLoading(false) })
  }, [])

  async function loadFloors(unit: Unit) {
    setSelectedUnit(unit)
    setSelectedFloor(null)
    setRacks([])
    setBins([])
    const f = await getFloors(unit.id)
    setFloors(f)
  }

  async function loadRacks(floor: Floor) {
    setSelectedFloor(floor)
    setBins([])
    const r = await getRacks(floor.id)
    setRacks(r)
    const allBins = await Promise.all(r.map(rack => getBins(rack.id)))
    setBins(allBins.flat())
    setExpandedRacks(new Set(r.map(r => r.id)))
  }

  async function handleAddUnit() {
    if (!unitForm.name || !unitForm.address) return
    setUnitSaving(true)
    try {
      const u = await createUnit({ name: unitForm.name, address: unitForm.address, gstin: unitForm.gstin || undefined, active: true })
      setUnits(prev => [...prev, u])
      setUnitDialog(false)
      setUnitForm({ name: '', address: '', gstin: '' })
    } finally {
      setUnitSaving(false)
    }
  }

  async function handleAddFloor() {
    if (!floorForm.name || !selectedUnit) return
    setFloorSaving(true)
    try {
      const unitIndex = units.findIndex(u => u.id === selectedUnit.id) + 1
      const floorIndex = floors.length + 1
      const code = `U${unitIndex}-F${floorIndex}`
      const f = await createFloor({
        unitId: selectedUnit.id,
        name: floorForm.name,
        code,
        primaryFloorManagerId: floorForm.primaryFloorManagerId || undefined,
        active: true,
      })
      setFloors(prev => [...prev, f])
      setFloorDialog(false)
      setFloorForm({ name: '', primaryFloorManagerId: '' })
    } finally {
      setFloorSaving(false)
    }
  }

  async function handleAddRacks() {
    if (!selectedFloor) return
    setRackSaving(true)
    try {
      await createRacks(selectedFloor.id, rackForm.count, rackForm.binsPerRack)
      await loadRacks(selectedFloor)
      setRackDialog(false)
      setRackForm({ count: 1, binsPerRack: 4 })
    } finally {
      setRackSaving(false)
    }
  }

  async function handleToggleBin(bin: Bin) {
    setBinError('')
    try {
      const updated = await updateBin(bin.id, { active: !bin.active })
      setBins(prev => prev.map(b => b.id === bin.id ? updated : b))
    } catch (err: unknown) {
      setBinError(err instanceof Error ? err.message : 'Failed to update bin.')
    }
  }

  if (loading) {
    return <div className="flex h-screen items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-border">
        <h1 className="text-xl font-semibold">Warehouse Map</h1>
        <p className="text-sm text-muted-foreground">Units, floors, racks and bins</p>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Units Panel */}
        <div className="w-56 shrink-0 border-r border-border flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Units</span>
            {canEdit && (
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setUnitDialog(true)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {units.map(unit => (
              <button
                key={unit.id}
                onClick={() => loadFloors(unit)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors',
                  selectedUnit?.id === unit.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{unit.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{unit.address.split(',')[0]}</p>
                </div>
                <ChevronRight className="w-3 h-3 ml-auto shrink-0 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Floors Panel */}
        <div className="w-52 shrink-0 border-r border-border flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Floors</span>
            {canEdit && selectedUnit && (
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setFloorDialog(true)}>
                <Plus className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {!selectedUnit ? (
              <p className="text-xs text-muted-foreground px-4 py-6 text-center">Select a unit</p>
            ) : floors.length === 0 ? (
              <p className="text-xs text-muted-foreground px-4 py-6 text-center">No floors yet</p>
            ) : floors.map(floor => (
              <button
                key={floor.id}
                onClick={() => loadRacks(floor)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-2.5 text-left transition-colors',
                  selectedFloor?.id === floor.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{floor.name}</p>
                  <p className="font-mono text-[10px] text-muted-foreground">{floor.code}</p>
                </div>
                <ChevronRight className="w-3 h-3 ml-auto shrink-0 opacity-50" />
              </button>
            ))}
          </div>
        </div>

        {/* Racks + Bins Panel */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between px-6 py-3 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Racks &amp; Bins {selectedFloor ? `— ${selectedFloor.name}` : ''}
            </span>
            {canEdit && selectedFloor && (
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setRackDialog(true)}>
                <Plus className="w-3 h-3 mr-1" /> Add Racks
              </Button>
            )}
          </div>

          {binError && (
            <div className="mx-6 mt-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {binError}
            </div>
          )}

          {!selectedFloor ? (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
              <Grid3X3 className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">Select a floor to view racks and bins</p>
            </div>
          ) : racks.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground">
              <p className="text-sm">No racks yet. Add some to get started.</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {racks.map(rack => {
                const rackBins = bins.filter(b => b.rackId === rack.id)
                const isOpen = expandedRacks.has(rack.id)
                return (
                  <div key={rack.id} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedRacks(prev => {
                        const next = new Set(prev)
                        isOpen ? next.delete(rack.id) : next.add(rack.id)
                        return next
                      })}
                      className="w-full flex items-center gap-3 px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <Grid3X3 className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium text-sm">{rack.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{rack.code}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{rackBins.length} bins</span>
                      <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                    </button>
                    {isOpen && (
                      <div className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {rackBins.map(bin => (
                          <div key={bin.id} className={cn('border rounded-md p-2.5 flex flex-col gap-1', bin.active ? 'border-border' : 'border-border/50 opacity-60')}>
                            <div className="flex items-center justify-between gap-1">
                              <Box className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <Badge variant={bin.active ? 'secondary' : 'outline'} className="text-[9px] h-4 px-1">
                                {bin.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="font-mono text-[10px] text-foreground leading-tight">{bin.code}</p>
                            {canEdit && (
                              <button
                                onClick={() => handleToggleBin(bin)}
                                className="text-[10px] text-muted-foreground hover:text-foreground underline text-left mt-1"
                              >
                                {bin.active ? 'Deactivate' : 'Activate'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Unit Dialog */}
      <Dialog open={unitDialog} onOpenChange={setUnitDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Unit</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Unit Name *</Label>
              <Input placeholder="e.g. Unit 3 — Navi Mumbai" value={unitForm.name} onChange={e => setUnitForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Address *</Label>
              <Input placeholder="Full address" value={unitForm.address} onChange={e => setUnitForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">GSTIN (optional)</Label>
              <Input placeholder="27AABCR..." value={unitForm.gstin} onChange={e => setUnitForm(p => ({ ...p, gstin: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnitDialog(false)}>Cancel</Button>
            <Button onClick={handleAddUnit} disabled={unitSaving || !unitForm.name || !unitForm.address}>
              {unitSaving ? 'Saving…' : 'Add Unit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Floor Dialog */}
      <Dialog open={floorDialog} onOpenChange={setFloorDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Add Floor — {selectedUnit?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Floor Name *</Label>
              <Input placeholder="e.g. Floor 3" value={floorForm.name} onChange={e => setFloorForm(p => ({ ...p, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Code (auto-generated)</Label>
              <div className="font-mono text-sm text-muted-foreground px-3 py-2 bg-muted rounded-md">
                U{(units.findIndex(u => u.id === selectedUnit?.id) + 1)}-F{floors.length + 1}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Primary Floor Manager (optional)</Label>
              <Select value={floorForm.primaryFloorManagerId} onValueChange={v => setFloorForm(p => ({ ...p, primaryFloorManagerId: v ?? p.primaryFloorManagerId }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Assign manager" /></SelectTrigger>
                <SelectContent>
                  {FLOOR_MANAGERS.map(m => <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFloorDialog(false)}>Cancel</Button>
            <Button onClick={handleAddFloor} disabled={floorSaving || !floorForm.name}>
              {floorSaving ? 'Saving…' : 'Add Floor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Racks Dialog */}
      <Dialog open={rackDialog} onOpenChange={setRackDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>Bulk Add Racks — {selectedFloor?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Number of racks to add</Label>
              <Input
                type="number"
                min={1}
                max={50}
                value={rackForm.count}
                onChange={e => setRackForm(p => ({ ...p, count: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Bins per rack</Label>
              <Input
                type="number"
                min={1}
                max={20}
                value={rackForm.binsPerRack}
                onChange={e => setRackForm(p => ({ ...p, binsPerRack: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Will create {rackForm.count} rack(s) × {rackForm.binsPerRack} bins = {rackForm.count * rackForm.binsPerRack} bins total
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRackDialog(false)}>Cancel</Button>
            <Button onClick={handleAddRacks} disabled={rackSaving}>
              {rackSaving ? 'Creating…' : 'Create Racks'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
