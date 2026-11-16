'use client'

import { useState, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  getPickLists, confirmPickLine, getCartonOpenRequests,
  approveCartonOpenRequest, rejectCartonOpenRequest,
  getRemainingDeclarations, confirmRemainingDeclaration,
  createPackage, markPackagePacked, getPackages,
} from '@/lib/services/picking'
import type { PickList, CartonOpenRequest, RemainingDeclaration, Package } from '@/lib/types'
import { mockVariants, mockLots, mockBins, mockFloors, mockOrders, mockUsers } from '@/lib/mock-data'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { AlertTriangle, CheckCircle2, Package as PackageIcon, ClipboardList, Boxes } from 'lucide-react'

function statusBadge(status: PickList['status']) {
  const map: Record<string, string> = {
    pending: 'bg-muted text-muted-foreground',
    'in-progress': 'bg-amber-500/15 text-amber-500',
    picked: 'bg-green-500/15 text-green-500',
    'on-hold': 'bg-destructive/15 text-destructive',
  }
  return <Badge className={`${map[status] ?? ''} capitalize`}>{status.replace('-', ' ')}</Badge>
}

function resolveVariant(variantId: string) {
  return mockVariants.find(v => v.id === variantId)
}
function resolveLot(lotId: string) {
  return mockLots.find(l => l.id === lotId)
}
function resolveBin(binId: string) {
  return mockBins.find(b => b.id === binId)
}
function resolveFloor(floorId: string) {
  return mockFloors.find(f => f.id === floorId)
}
function resolveOrder(orderId: string) {
  return mockOrders.find(o => o.id === orderId)
}
function resolveUser(userId: string) {
  return mockUsers.find(u => u.id === userId)
}

// ——————————————————————————————————————————
// Pick Lists Tab
// ——————————————————————————————————————————
function PickListsTab({ refresh }: { refresh: () => void }) {
  const { user } = useAuth()
  const router = useRouter()
  const [lists, setLists] = useState<PickList[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    const all = await getPickLists()
    if (user?.role === 'floor-manager') {
      setLists(all.filter(pl => user.floorIds.includes(pl.floorId)))
    } else {
      setLists(all)
    }
    setLoading(false)
  }, [user])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="py-12 text-center text-muted-foreground text-sm">Loading…</div>
  if (!lists.length) return (
    <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
      <ClipboardList className="w-10 h-10 opacity-30" />
      <p className="text-sm">No pick lists assigned</p>
    </div>
  )

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Floor</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lines</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>
            </tr>
          </thead>
          <tbody>
            {lists.map(pl => {
              const order = resolveOrder(pl.orderId)
              const floor = resolveFloor(pl.floorId)
              return (
                <tr key={pl.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono text-xs">{order?.number}</td>
                  <td className="px-4 py-3">{floor?.name}</td>
                  <td className="px-4 py-3">{statusBadge(pl.status)}</td>
                  <td className="px-4 py-3">{pl.lines.length}</td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {format(new Date(pl.createdAt), 'd MMM, HH:mm')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {(pl.status === 'pending' || pl.status === 'in-progress') && (
                      <Button
                        size="sm"
                        onClick={() => router.push(`/picking/${pl.id}`)}
                      >
                        {pl.status === 'pending' ? 'Start Picking' : 'Continue'}
                      </Button>
                    )}
                    {pl.status === 'on-hold' && (
                      <span className="text-xs text-destructive">On hold — sub-admin review needed</span>
                    )}
                    {pl.status === 'picked' && (
                      <span className="flex items-center gap-1 justify-end text-xs text-green-500">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Done
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}

// ——————————————————————————————————————————
// Carton Requests Tab
// ——————————————————————————————————————————
function CartonRequestsTab() {
  const { user, can } = useAuth()
  const [requests, setRequests] = useState<CartonOpenRequest[]>([])
  const [declarations, setDeclarations] = useState<RemainingDeclaration[]>([])
  const [acting, setActing] = useState<string | null>(null)

  const canApprove = can('approve-carton-open')

  const load = useCallback(async () => {
    const [reqs, decls] = await Promise.all([getCartonOpenRequests(), getRemainingDeclarations()])
    if (user?.role === 'floor-manager') {
      setRequests(reqs.filter(r => r.requestedBy === user.id))
    } else {
      setRequests(reqs)
    }
    setDeclarations(decls)
  }, [user])

  useEffect(() => { load() }, [load])

  async function approve(id: string) {
    if (!user) return
    setActing(id)
    await approveCartonOpenRequest(id, user.id)
    await load()
    setActing(null)
  }

  async function reject(id: string) {
    setActing(id)
    await rejectCartonOpenRequest(id)
    await load()
    setActing(null)
  }

  async function confirmDecl(id: string) {
    if (!user) return
    setActing(id)
    await confirmRemainingDeclaration(id, user.id)
    await load()
    setActing(null)
  }

  const pending = requests.filter(r => r.status === 'pending')
  const resolved = requests.filter(r => r.status !== 'pending')

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold mb-3">Carton Open Requests</h3>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No pending requests</p>
        ) : (
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Variant</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Lot / Bin</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Packs Needed</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Requested by</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
                  {canApprove && <th className="text-right px-4 py-3 font-medium text-muted-foreground">Action</th>}
                </tr>
              </thead>
              <tbody>
                {pending.map(r => {
                  const variant = resolveVariant(r.variantId)
                  const lot = resolveLot(r.lotId)
                  const bin = resolveBin(r.binId)
                  const order = resolveOrder(r.orderId)
                  const reqUser = resolveUser(r.requestedBy)
                  return (
                    <tr key={r.id} className="border-t border-border hover:bg-muted/20">
                      <td className="px-4 py-3 font-mono text-xs">{order?.number}</td>
                      <td className="px-4 py-3">{variant?.flavour} {variant?.packSize}{variant?.packUnit}</td>
                      <td className="px-4 py-3 font-mono text-xs">{lot?.batch} / {bin?.code}</td>
                      <td className="px-4 py-3">{r.packsNeeded}</td>
                      <td className="px-4 py-3">{reqUser?.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{format(new Date(r.createdAt), 'd MMM, HH:mm')}</td>
                      {canApprove && (
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              disabled={acting === r.id}
                              onClick={() => approve(r.id)}
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={acting === r.id}
                              onClick={() => reject(r.id)}
                            >
                              Reject
                            </Button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {resolved.length > 0 && (
          <details className="mt-4">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              {resolved.length} resolved request(s)
            </summary>
            <div className="mt-2 space-y-1">
              {resolved.map(r => (
                <div key={r.id} className="flex items-center gap-2 text-xs px-2 py-1">
                  <Badge className={r.status === 'approved' ? 'bg-green-500/15 text-green-500' : 'bg-destructive/15 text-destructive'}>
                    {r.status}
                  </Badge>
                  <span>{resolveOrder(r.orderId)?.number}</span>
                  <span className="text-muted-foreground">{resolveVariant(r.variantId)?.skuCode}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {declarations.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold mb-3">Remaining Unit Declarations</h3>
          <div className="space-y-2">
            {declarations.map(d => {
              const bin = resolveBin(d.binId)
              const isVariance = d.damagedPacks > 0
              return (
                <Card key={d.id} className={isVariance ? 'border-amber-500/50' : ''}>
                  <CardContent className="py-3 flex items-center gap-4">
                    {isVariance && <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />}
                    <div className="flex-1 text-sm">
                      <span>Bin: <span className="font-mono">{bin?.code}</span></span>
                      <span className="mx-3 text-muted-foreground">|</span>
                      <span>{d.packsLeft} packs remaining</span>
                      {d.damagedPacks > 0 && (
                        <span className="ml-3 text-amber-500">{d.damagedPacks} damaged</span>
                      )}
                    </div>
                    <Badge className={
                      d.status === 'confirmed' ? 'bg-green-500/15 text-green-500' :
                      d.status === 'variance' ? 'bg-amber-500/15 text-amber-500' :
                      'bg-muted text-muted-foreground'
                    }>
                      {d.status}
                    </Badge>
                    {canApprove && d.status === 'pending' && (
                      <Button size="sm" disabled={acting === d.id} onClick={() => confirmDecl(d.id)}>
                        Confirm
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ——————————————————————————————————————————
// Packing Tab
// ——————————————————————————————————————————
function PackingTab() {
  const { user } = useAuth()
  const [pickLists, setPickLists] = useState<PickList[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [parcelCounts, setParcelCounts] = useState<Record<string, number>>({})
  const [checkedLines, setCheckedLines] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState<string | null>(null)

  const load = useCallback(async () => {
    const [pls, pkgs] = await Promise.all([getPickLists(), getPackages()])
    setPickLists(pls.filter(pl => pl.status === 'picked' || pl.status === 'in-progress'))
    setPackages(pkgs)
  }, [])

  useEffect(() => { load() }, [load])

  const orderGroups = pickLists.reduce((acc, pl) => {
    if (!acc[pl.orderId]) acc[pl.orderId] = []
    acc[pl.orderId].push(pl)
    return acc
  }, {} as Record<string, PickList[]>)

  async function handleMarkPacked(orderId: string, floorId: string, pickList: PickList) {
    if (!user) return
    const count = parcelCounts[`${orderId}-${floorId}`] ?? 1
    setSaving(`${orderId}-${floorId}`)
    const pkg = await createPackage({ orderId, floorId, parcelCount: count, photos: [], packedBy: user.id })
    await markPackagePacked(pkg.id)
    await load()
    setSaving(null)
  }

  if (Object.keys(orderGroups).length === 0) {
    return (
      <div className="py-16 flex flex-col items-center gap-2 text-muted-foreground">
        <Boxes className="w-10 h-10 opacity-30" />
        <p className="text-sm">No orders ready to pack</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {Object.entries(orderGroups).map(([orderId, pls]) => {
        const order = resolveOrder(orderId)
        const orderPackages = packages.filter(p => p.orderId === orderId)
        const totalFloors = pls.length
        const packedFloors = orderPackages.filter(p => p.status === 'packed').length
        const allPacked = packedFloors === totalFloors

        return (
          <Card key={orderId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="font-mono">{order?.number}</span>
                <Badge className={
                  allPacked ? 'bg-green-500/15 text-green-500' :
                  packedFloors > 0 ? 'bg-amber-500/15 text-amber-500' :
                  'bg-muted text-muted-foreground'
                }>
                  {allPacked ? 'Ready for Dispatch' : packedFloors > 0 ? 'Partially Packed' : 'Packing'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pls.map(pl => {
                const floor = resolveFloor(pl.floorId)
                const floorPkg = orderPackages.find(p => p.floorId === pl.floorId)
                const isPacked = floorPkg?.status === 'packed'
                const key = `${orderId}-${pl.floorId}`

                return (
                  <div key={pl.floorId} className={`rounded-lg border p-3 space-y-3 ${isPacked ? 'opacity-60' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{floor?.name}</span>
                      {isPacked && <Badge className="bg-green-500/15 text-green-500 text-xs">Packed</Badge>}
                    </div>

                    <div className="space-y-1.5">
                      {pl.lines.map(line => {
                        const variant = resolveVariant(line.variantId)
                        const lineKey = `${key}-${line.id}`
                        return (
                          <label key={line.id} className="flex items-center gap-2 text-sm cursor-pointer">
                            <Checkbox
                              checked={checkedLines[lineKey] ?? (line.status === 'picked')}
                              onCheckedChange={v => setCheckedLines(prev => ({ ...prev, [lineKey]: !!v }))}
                              disabled={isPacked}
                            />
                            <span>
                              {variant?.flavour} {variant?.packSize}{variant?.packUnit}
                              <span className="text-muted-foreground ml-2 text-xs">
                                {line.pickedCartons ?? line.sealedCartons} carton(s) + {line.pickedPacks ?? line.loosePacks} packs
                              </span>
                            </span>
                            {line.status === 'short' && (
                              <Badge className="bg-destructive/15 text-destructive text-xs ml-auto">Short</Badge>
                            )}
                          </label>
                        )
                      })}
                    </div>

                    {!isPacked && (
                      <div className="flex items-center gap-3 pt-1">
                        <div className="flex items-center gap-2">
                          <Label className="text-xs text-muted-foreground whitespace-nowrap">Parcels:</Label>
                          <Input
                            type="number"
                            min={1}
                            value={parcelCounts[key] ?? 1}
                            onChange={e => setParcelCounts(prev => ({ ...prev, [key]: parseInt(e.target.value) || 1 }))}
                            className="w-16 text-center"
                          />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          disabled={true}
                        >
                          📷 Photo attached
                        </Button>
                        <Button
                          size="sm"
                          className="ml-auto py-3"
                          disabled={saving === key}
                          onClick={() => handleMarkPacked(orderId, pl.floorId, pl)}
                        >
                          {saving === key ? 'Saving…' : 'Mark Floor Packed'}
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}

// ——————————————————————————————————————————
// Main Page
// ——————————————————————————————————————————
export default function PickingPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const searchParams = useSearchParams()
  const defaultTab = searchParams.get('tab') ?? 'pick-lists'

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Picking &amp; Packing</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Pick lists, carton requests, and packing confirmation</p>
      </div>

      <Tabs defaultValue={defaultTab}>
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="pick-lists" className="text-sm">
            <ClipboardList className="w-4 h-4 mr-1.5" />Pick Lists
          </TabsTrigger>
          <TabsTrigger value="carton-requests" className="text-sm">
            <PackageIcon className="w-4 h-4 mr-1.5" />Carton Requests
          </TabsTrigger>
          <TabsTrigger value="packing" className="text-sm">
            <Boxes className="w-4 h-4 mr-1.5" />Packing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pick-lists" className="mt-4">
          <PickListsTab refresh={() => setRefreshKey(k => k + 1)} />
        </TabsContent>
        <TabsContent value="carton-requests" className="mt-4">
          <CartonRequestsTab key={refreshKey} />
        </TabsContent>
        <TabsContent value="packing" className="mt-4">
          <PackingTab key={refreshKey} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
