'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { createUser } from '@/lib/services/auth'
import { getUnits, getFloors } from '@/lib/services/warehouse'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight } from 'lucide-react'
import type { UserRole, Unit, Floor } from '@/lib/types'

const roleLabels: Record<UserRole, string> = {
  'admin': 'Admin',
  'sub-admin': 'Sub-Admin',
  'floor-manager': 'Floor Manager',
  'delivery-manager': 'Delivery Manager',
  'delivery-team': 'Delivery Team',
  'accountant': 'Accountant',
}

export default function NewUserPage() {
  const { user: currentUser, hasRole } = useAuth()
  const router = useRouter()
  const [units, setUnits] = useState<Unit[]>([])
  const [floors, setFloors] = useState<Floor[]>([])

  const [form, setForm] = useState({
    userCode: '', name: '', mobile: '', role: 'floor-manager' as UserRole,
    unitId: '', floorIds: [] as string[], password: '', confirmPassword: '',
    revisePricePermission: false,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getUnits(), getFloors()]).then(([u, f]) => { setUnits(u); setFloors(f) })
  }, [])

  const availableRoles: UserRole[] = hasRole('admin')
    ? ['admin', 'sub-admin', 'floor-manager', 'delivery-manager', 'delivery-team', 'accountant']
    : ['floor-manager', 'delivery-manager', 'delivery-team', 'accountant']

  const unitFloors = floors.filter(f => f.unitId === form.unitId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.userCode || !form.name || !form.mobile || !form.unitId || !form.password) {
      setError('Please fill all required fields.'); return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.'); return
    }
    setError('')
    setSaving(true)
    try {
      await createUser({
        userCode: form.userCode.toUpperCase(),
        name: form.name,
        mobile: form.mobile,
        role: form.role,
        unitId: form.unitId,
        floorIds: form.floorIds,
        status: 'active',
        mustChangePassword: true,
        revisePricePermission: form.role === 'sub-admin' ? form.revisePricePermission : undefined,
        createdBy: currentUser?.id ?? '',
        password: form.password,
      })
      router.push('/users')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create user.')
    }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/users" className="hover:text-foreground transition-colors">Users</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">New User</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Add User</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Create a new staff account</p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label>User code <span className="text-destructive">*</span></Label>
          <Input
            placeholder="e.g. FLMGR03"
            value={form.userCode}
            onChange={e => setForm(f => ({ ...f, userCode: e.target.value.toUpperCase() }))}
            maxLength={20}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label>Role <span className="text-destructive">*</span></Label>
          <Select value={form.role} onValueChange={v => setForm(f => ({ ...f, role: v as UserRole }))}>
            <SelectTrigger>
              <SelectValue>{(val: string) => val ? (roleLabels[val as UserRole] ?? val) : 'Select role'}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label>Full name <span className="text-destructive">*</span></Label>
          <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Mobile <span className="text-destructive">*</span></Label>
          <Input type="tel" maxLength={10} value={form.mobile} onChange={e => setForm(f => ({ ...f, mobile: e.target.value }))} />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <Label>Unit <span className="text-destructive">*</span></Label>
          <Select value={form.unitId} onValueChange={v => setForm(f => ({ ...f, unitId: v ?? f.unitId, floorIds: [] }))}>
            <SelectTrigger>
              <SelectValue>{(val: string) => val ? (units.find(u => u.id === val)?.name ?? val) : 'Select unit'}</SelectValue>
            </SelectTrigger>
            <SelectContent>{units.map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {unitFloors.length > 0 && (
          <div className="md:col-span-2 space-y-2">
            <Label>Floor assignment</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {unitFloors.map(fl => (
                <div key={fl.id} className="flex items-center gap-2">
                  <Checkbox
                    id={fl.id}
                    checked={form.floorIds.includes(fl.id)}
                    onCheckedChange={checked => setForm(f => ({
                      ...f,
                      floorIds: checked ? [...f.floorIds, fl.id] : f.floorIds.filter(id => id !== fl.id),
                    }))}
                  />
                  <label htmlFor={fl.id} className="text-sm cursor-pointer">{fl.name} ({fl.code})</label>
                </div>
              ))}
            </div>
          </div>
        )}

        {form.role === 'sub-admin' && (
          <div className="md:col-span-2 flex items-center gap-2">
            <Checkbox
              id="revise-price"
              checked={form.revisePricePermission}
              onCheckedChange={checked => setForm(f => ({ ...f, revisePricePermission: !!checked }))}
            />
            <label htmlFor="revise-price" className="text-sm cursor-pointer">Grant "Revise Price" permission</label>
          </div>
        )}

        <div className="space-y-1.5">
          <Label>Initial password <span className="text-destructive">*</span></Label>
          <Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
        </div>
        <div className="space-y-1.5">
          <Label>Confirm password <span className="text-destructive">*</span></Label>
          <Input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} />
        </div>

        {error && <p className="md:col-span-2 text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}

        <div className="md:col-span-2 flex gap-3 pt-2">
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create User'}
          </Button>
          <Link href="/users">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
