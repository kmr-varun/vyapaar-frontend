'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { getUnits, getFloors, getRacks, getBins, updateBin } from '@/lib/services/warehouse'
import type { Unit, Floor, Rack, Bin } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ChevronRight, ChevronLeft, Building2, Layers, Grid3X3, Box, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

type MobileStep = 'units' | 'floors' | 'racks'

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
  const [mobileStep, setMobileStep] = useState<MobileStep>('units')

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
    setMobileStep('floors')
  }

  async function loadRacks(floor: Floor) {
    setSelectedFloor(floor)
    setBins([])
    const r = await getRacks(floor.id)
    setRacks(r)
    const allBins = await Promise.all(r.map(rack => getBins(rack.id)))
    setBins(allBins.flat())
    setExpandedRacks(new Set(r.map(r => r.id)))
    setMobileStep('racks')
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
      {/* Page header */}
      <div className="px-4 md:px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">Warehouse Map</h1>
            <p className="text-sm text-muted-foreground">Units, floors, racks and bins</p>
          </div>
          {/* Mobile breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground md:hidden">
            {mobileStep !== 'units' && (
              <>
                <button
                  onClick={() => setMobileStep(mobileStep === 'racks' ? 'floors' : 'units')}
                  className="flex items-center gap-1 text-primary text-sm font-medium"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {mobileStep === 'racks' ? selectedUnit?.name : 'Units'}
                </button>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-medium text-foreground">
                  {mobileStep === 'floors' ? selectedUnit?.name : selectedFloor?.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Units Panel */}
        <div className={cn(
          'flex-col shrink-0 border-r border-border',
          mobileStep === 'units' ? 'flex flex-1' : 'hidden',
          'md:flex md:w-56 md:flex-none'
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Units</span>
            {canEdit && (
              <Link href="/warehouse/units/new">
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {units.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No warehouse units yet</p>
                {canEdit && (
                  <Link href="/warehouse/units/new">
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Unit
                    </Button>
                  </Link>
                )}
              </div>
            ) : units.map(unit => (
              <button
                key={unit.id}
                onClick={() => loadFloors(unit)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-3 text-left transition-colors',
                  selectedUnit?.id === unit.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <Building2 className="w-4 h-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{unit.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{unit.address.split(',')[0]}</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto shrink-0 opacity-40" />
              </button>
            ))}
          </div>
        </div>

        {/* Floors Panel */}
        <div className={cn(
          'flex-col shrink-0 border-r border-border',
          mobileStep === 'floors' ? 'flex flex-1' : 'hidden',
          'md:flex md:w-52 md:flex-none'
        )}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Floors</span>
            {canEdit && selectedUnit && (
              <Link href={`/warehouse/units/${selectedUnit.id}/floors/new`}>
                <Button size="icon" variant="ghost" className="h-6 w-6">
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </Link>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {!selectedUnit ? (
              <p className="text-xs text-muted-foreground px-4 py-6 text-center">Select a unit</p>
            ) : floors.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-muted-foreground mb-3">No floors yet</p>
                {canEdit && (
                  <Link href={`/warehouse/units/${selectedUnit.id}/floors/new`}>
                    <Button size="sm" variant="outline" className="gap-1.5">
                      <Plus className="w-3.5 h-3.5" /> Add Floor
                    </Button>
                  </Link>
                )}
              </div>
            ) : floors.map(floor => (
              <button
                key={floor.id}
                onClick={() => loadRacks(floor)}
                className={cn(
                  'w-full flex items-center gap-2 px-4 py-3 text-left transition-colors',
                  selectedFloor?.id === floor.id
                    ? 'bg-primary/10 text-primary'
                    : 'hover:bg-muted text-foreground'
                )}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{floor.name}</p>
                  <p className="font-mono text-xs text-muted-foreground">{floor.code}</p>
                </div>
                <ChevronRight className="w-4 h-4 ml-auto shrink-0 opacity-40" />
              </button>
            ))}
          </div>
        </div>

        {/* Racks + Bins Panel */}
        <div className={cn(
          'flex-col overflow-y-auto',
          mobileStep === 'racks' ? 'flex flex-1' : 'hidden',
          'md:flex md:flex-1'
        )}>
          <div className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-border">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Racks &amp; Bins {selectedFloor ? `— ${selectedFloor.name}` : ''}
            </span>
            {canEdit && selectedFloor && (
              <Link href={`/warehouse/floors/${selectedFloor.id}/racks/new`}>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                  <Plus className="w-3 h-3" /> Add Racks
                </Button>
              </Link>
            )}
          </div>

          {binError && (
            <div className="mx-4 md:mx-6 mt-3 flex items-center gap-2 text-xs text-destructive bg-destructive/10 rounded px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5" /> {binError}
            </div>
          )}

          {!selectedFloor ? (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-8">
              <Grid3X3 className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm text-center">Select a floor to view racks and bins</p>
            </div>
          ) : racks.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-muted-foreground p-8">
              <p className="text-sm mb-3 text-center">No racks yet.</p>
              {canEdit && (
                <Link href={`/warehouse/floors/${selectedFloor.id}/racks/new`}>
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="w-3.5 h-3.5" /> Add Racks
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="p-4 md:p-6 space-y-4">
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
                      <Grid3X3 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-medium text-sm">{rack.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{rack.code}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{rackBins.length} bins</span>
                      <ChevronRight className={cn('w-4 h-4 text-muted-foreground transition-transform shrink-0', isOpen && 'rotate-90')} />
                    </button>
                    {isOpen && (
                      <div className="p-3 md:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-2">
                        {rackBins.map(bin => (
                          <div key={bin.id} className={cn('border rounded-md p-2.5 flex flex-col gap-1', bin.active ? 'border-border' : 'border-border/50 opacity-60')}>
                            <div className="flex items-center justify-between gap-1">
                              <Box className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <Badge variant={bin.active ? 'secondary' : 'outline'} className="text-[9px] h-4 px-1">
                                {bin.active ? 'Active' : 'Inactive'}
                              </Badge>
                            </div>
                            <p className="text-xs font-semibold text-foreground leading-tight">{bin.name}</p>
                            <p className="font-mono text-[10px] text-muted-foreground leading-tight">{bin.code}</p>
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
    </div>
  )
}
