'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getUsers, updateUser, resetUserPassword } from '@/lib/services/auth'
import { getUnits } from '@/lib/services/warehouse'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import { Plus, Search, KeyRound, Pencil } from 'lucide-react'
import type { User, UserRole, Unit } from '@/lib/types'

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

export default function UsersPage() {
  const { user: currentUser, hasRole } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [resetOpen, setResetOpen] = useState<User | null>(null)
  const [resetPassword, setResetPassword] = useState('')
  const [editOpen, setEditOpen] = useState<User | null>(null)
  const [editForm, setEditForm] = useState({ name: '', mobile: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!hasRole('admin', 'sub-admin')) { router.replace('/dashboard'); return }
    Promise.all([getUsers(), getUnits()]).then(([u, un]) => {
      setUsers(u); setUnits(un)
    }).finally(() => setLoading(false))
  }, [hasRole, router])

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.userCode.toLowerCase().includes(search.toLowerCase()) ||
    u.mobile.includes(search)
  )

  async function handleToggle(u: User) {
    const updated = await updateUser(u.id, { status: u.status === 'active' ? 'disabled' : 'active' })
    setUsers(us => us.map(x => x.id === updated.id ? updated : x))
  }

  async function handleEditUser() {
    if (!editOpen || !editForm.name) return
    setSaving(true)
    try {
      const updated = await updateUser(editOpen.id, { name: editForm.name, mobile: editForm.mobile })
      setUsers(us => us.map(x => x.id === updated.id ? updated : x))
      setEditOpen(null)
    } finally {
      setSaving(false)
    }
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
        <Link href="/users/new">
          <Button size="sm">
            <Plus className="w-4 h-4 mr-2" /> Add User
          </Button>
        </Link>
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
              <table className="w-full text-sm min-w-[600px]">
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
                              onClick={() => { setEditOpen(u); setEditForm({ name: u.name, mobile: u.mobile }) }}
                            >
                              <Pencil className="w-3 h-3 mr-1" /> Edit
                            </Button>
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

      {/* Edit User Dialog */}
      <Dialog open={!!editOpen} onOpenChange={() => setEditOpen(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit User — {editOpen?.userCode}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Full name</Label>
              <Input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Mobile</Label>
              <Input type="tel" maxLength={10} value={editForm.mobile} onChange={e => setEditForm(f => ({ ...f, mobile: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setEditOpen(null)}>Cancel</Button>
            <Button size="sm" onClick={handleEditUser} disabled={saving || !editForm.name}>
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetOpen} onOpenChange={() => { setResetOpen(null); setResetPassword('') }}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
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
