'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getAuditLogs } from '@/lib/services/audit'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { AuditLog } from '@/lib/types'
import { format } from 'date-fns'

const PAGE_SIZE = 20

const actionColors: Record<string, string> = {
  create: 'bg-emerald-500/10 text-emerald-500',
  update: 'bg-blue-500/10 text-blue-500',
  approve: 'bg-purple-500/10 text-purple-500',
  reject: 'bg-destructive/10 text-destructive',
  'status-change': 'bg-amber-500/10 text-amber-500',
  delete: 'bg-destructive/10 text-destructive',
}

const roleColors: Record<string, string> = {
  admin: 'bg-primary/10 text-primary',
  'sub-admin': 'bg-blue-500/10 text-blue-500',
  'floor-manager': 'bg-emerald-500/10 text-emerald-500',
  accountant: 'bg-purple-500/10 text-purple-500',
  'delivery-manager': 'bg-amber-500/10 text-amber-500',
  'delivery-team': 'bg-muted text-muted-foreground',
}

export default function AuditLogPage() {
  const { can } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [filtered, setFiltered] = useState<AuditLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('all')
  const [page, setPage] = useState(0)

  useEffect(() => {
    if (!can('view-audit-log')) { router.replace('/dashboard'); return }
    getAuditLogs().then(l => { setLogs(l); setFiltered(l) }).finally(() => setLoading(false))
  }, [can, router])

  useEffect(() => {
    setFiltered(logs.filter(l => {
      const matchSearch = !search ||
        l.entity.toLowerCase().includes(search.toLowerCase()) ||
        l.userName.toLowerCase().includes(search.toLowerCase()) ||
        l.entityId.includes(search)
      const matchAction = actionFilter === 'all' || l.action === actionFilter
      return matchSearch && matchAction
    }))
    setPage(0)
  }, [search, actionFilter, logs])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageRows = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Audit Log</h1>
        <p className="text-sm text-muted-foreground">Read-only record of all system actions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search entity, user, ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 h-8 text-sm"
          />
        </div>
        <div className="w-40">
          <Select value={actionFilter} onValueChange={(v) => v && setActionFilter(v)}>
            <SelectTrigger className="h-8 text-sm"><SelectValue placeholder="All actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All actions</SelectItem>
              <SelectItem value="create">Create</SelectItem>
              <SelectItem value="update">Update</SelectItem>
              <SelectItem value="approve">Approve</SelectItem>
              <SelectItem value="reject">Reject</SelectItem>
              <SelectItem value="status-change">Status change</SelectItem>
              <SelectItem value="delete">Delete</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : pageRows.length === 0 ? (
            <p className="text-center text-muted-foreground py-12 text-sm">No audit records found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border bg-muted/40">
                  <tr>
                    {['Timestamp', 'User', 'Role', 'Action', 'Entity', 'Entity ID', 'Change'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(log => (
                    <tr key={log.id} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {format(new Date(log.createdAt), 'dd MMM yyyy HH:mm')}
                      </td>
                      <td className="px-4 py-3 font-medium">{log.userName}</td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] capitalize ${roleColors[log.userRole] ?? ''}`}>
                          {log.userRole.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={`text-[10px] capitalize ${actionColors[log.action] ?? ''}`}>
                          {log.action.replace('-', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">{log.entity}</td>
                      <td className="px-4 py-3 font-mono text-muted-foreground text-[10px]">{log.entityId}</td>
                      <td className="px-4 py-3 max-w-xs">
                        {log.before || log.after ? (
                          <span className="text-muted-foreground">
                            {log.before && Object.entries(log.before).map(([k, v]) => `${k}: ${v}`).join(', ')}
                            {log.before && log.after ? ' → ' : ''}
                            {log.after && Object.entries(log.after).map(([k, v]) => `${k}: ${v}`).join(', ')}
                          </span>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of {filtered.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 0}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
