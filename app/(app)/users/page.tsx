'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getUsers, createUser, updateUser, resetUserPassword } from '@/lib/services/auth'
import { getUnits } from '@/lib/services/warehouse'
import { getFloors } from '@/lib/services/warehouse'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, KeyRound } from 'lucide-react'
import type { User, UserRole, Unit, Floor } from '@/lib/types'

const roleLabels: Record<UserRole, string> = {
  'admin': 'Admin',
  'sub-admin': 'Sub-Admin',
  'floor-manager': 'Floor Manager',
  'delivery-manager': 'Delivery Manager',
  'delivery-team': 'Delivery Team',
  'accountant': 'Accountant',
}

const roleColors: Record<UserRole, string> = {
  'admin': 'bg-primary/10 text-primary',
  'sub-admin': 'bg-blue-500/10 text-blue-500',
  'floor-manager': 'bg-emerald-500/10 text-emerald-500',
  'delivery-manager': 'bg-amber-500/10 text-amber-500',
  'delivery-team': 'bg-orange-500/10 text-orange-500',
  'accountant': 'bg-purple-500/10 text-purple-500',
}

const defaultForm = {
  userCode: '', name: '', mobile: '', role: 'floor-manager' as UserRole,
  unitId: '', floorIds: [] as string[], password: '', confirmPassword: '',
  revisePricePermission: false,
}

export default function UsersPage() {
  const { user: currentUser, hasRole } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [floors, setFloors] = useState<Floor[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [addOpen, setAddOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState<User | null>(null)
  const [form, setForm] = useState(defaultForm)
  const [resetPassword, setResetPassword] = useState('')
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!hasRole('admin', 'sub-admin')) { router.replace('/dashboard'); return }
    Promise.all([getUsers(), getUnits(), getFloors()]).then(([u, un, fl]) => {
      setUsers(u); setUnits(un); setFloors(fl)
    }).finally(() => setLoading(false))
  }, [hasRole, router])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.userCode.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile.includes(search)
  )

  const availableRoles: UserRole[] = hasRole('admin')
    ? ['admin', 'sub-admin', 'floor-manager', 'delivery-manager', 'delivery-team', 'accountant']
    : ['floor-manager', 'delivery-manager', 'delivery-team', 'accountant']

  const unitFloors = floors.filter(f => f.unitId === form.unitId)

  async function handleCreate() {
    setFormError('')
    if (!form.userCode || !form.name || !form.mobile || !form.unitId || !form.password) {
      setFormError('Please fill all required fields.'); return
    }
    if (form.password !== form.confirmPassword) {
      setFormError('Passwords do not match.'); return
    }
    setSaving(true)
    try {
      const created = await createUser({
        userCode: form.userCode.toUpperCase(),
        name: form.name, mobile: form.mobile, role: form.role,
        unitId: form.unitId, floorIds: form.floorIds,
        status: 'active', mustChangePassword: true,
        revisePricePermission: form.role === 'sub-admin' ? form.revisePricePermission : undefined,
        createdBy: currentUser?.id ?? '',
        password: form.password,
      })
      setUsers(u => [...u, created])
      setAddOpen(false)
      setForm(defaultForm)
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Failed to create user.')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(u: User) {
    const updated = await updateUser(u.id, { status: u.status === 'active' ? 'disabled' : 'active' })
    setUsers(us => us.map(x => x.id === updated.id ? updated : x))
  }

  async function handleResetPassword() {
    if (!resetOpen || !resetPassword) return
    setSaving(true)
    try {
      await resetUserPassword(resetOpen.id, resetPassword)
      setResetOpen(null)
      setResetPassword('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">User Management</h1>
          <p className="text-sm text-muted-foreground">Manage staff accounts and permissions</p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add User
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <Input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    {['User Code', 'Name', 'Mobile', 'Role', 'Unit', 'Status', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const unit = units.find(un => un.id === u.unitId)
                    return (
                      <tr key={u.id} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="px-4 py-3 font-mono font-medium">{u.userCode}</td>
                        <td className="px-4 py-3 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-muted-foreground">{u.mobile}</td>
                        <td className="px-4 py-3">
                          <Badge className={`text-[10px] ${roleColors[u.role]}`}>{roleLabels[u.role]}</Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{unit?.name ?? '—'}</td>
                        <td className="px-4 py-3">
                          <Badge variant={u.status === 'active' ? 'default' : 'secondary'} className="text-[10px] capitalize">
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Switch
                              checked={u.status === 'active'}
                              onCheckedChange={() => handleToggle(u)}
                              disabled={u.id === currentUser?.id}
                            />
                            <Button
                              variant="ghost" size="sm"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => setResetOpen(u)}
                            >
                              <KeyRound className="w-3 h-3 mr-1" /> Reset
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add User Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add User</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">User Code *</Label>
                <Input
                  placeholder="e.g. FLMGR03"
                  value={form.userCode}
                  onChange={e => setForm(f => ({ ...f, userCode: e.target.value.toUpperCase() }))}
                  maxLength={20}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Role *</Label>
                <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as UserRole }))}>
                  <SelectTrigger className="text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableRoles.map(r => (
                      <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Full Name *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mobile *</Label>
              <Input value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} type="tel" maxLength={10} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Unit *</Label>
              <Select value={form.unitId} onValueChange={v => setForm(f => ({ ...f, unitId: v ?? f.unitId, floorIds: [] }))}>
                <SelectTrigger className="text-sm"><SelectValue placeholder="Select unit" /></SelectTrigger>
                <SelectContent>
                  {units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {unitFloors.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs">Floor Assignment</Label>
                <div className="space-y-1.5">
                  {unitFloors.map(fl => (
                    <div key={fl.id} className="flex items-center gap-2">
                      <Checkbox
                        id={fl.id}
                        checked={form.floorIds.includes(fl.id)}
                        onCheckedChange={checked => setForm(f => ({
                          ...f,
                          floorIds: checked
                            ? [...f.floorIds, fl.id]
                            : f.floorIds.filter(id => id !== fl.id),
                        }))}
                      />
                      <label htmlFor={fl.id} className="text-xs cursor-pointer">{fl.name} ({fl.code})</label>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {form.role === 'sub-admin' && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="revise-price"
                  checked={form.revisePricePermission}
                  onCheckedChange={checked => setForm(f => ({ ...f, revisePricePermission: !!checked }))}
                />
                <label htmlFor="revise-price" className="text-xs cursor-pointer">Grant "Revise Price" permission</label>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Initial Password *</Label>
              <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Confirm Password *</Label>
              <Input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
            </div>
            {formError && <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1.5">{formError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => { setAddOpen(false); setForm(defaultForm); setFormError('') }}>Cancel</Button>
            <Button size="sm" onClick={handleCreate} disabled={saving}>{saving ? 'Creating…' : 'Create User'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetOpen} onOpenChange={() => { setResetOpen(null); setResetPassword('') }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reset Password — {resetOpen?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">New Password</Label>
              <Input type="password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} />
            </div>
            <p className="text-xs text-muted-foreground">The user will be required to change this password on next login.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setResetOpen(null)}>Cancel</Button>
            <Button size="sm" onClick={handleResetPassword} disabled={saving || !resetPassword}>
              {saving ? 'Resetting…' : 'Reset Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
