'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getEnquiries } from '@/lib/services/enquiries'
import type { Enquiry, EnquiryStatus } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Phone, ChevronRight } from 'lucide-react'

const STATUS_LABELS: Record<EnquiryStatus, string> = {
  new: 'New',
  called: 'Called',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
}

const STATUS_VARIANTS: Record<EnquiryStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  new: 'default',
  called: 'secondary',
  confirmed: 'outline',
  cancelled: 'destructive',
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<EnquiryStatus | 'all'>('all')

  const load = useCallback(async () => {
    setLoading(true)
    setEnquiries(await getEnquiries())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = enquiries.filter(e => {
    if (statusFilter !== 'all' && e.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        e.contactName.toLowerCase().includes(q) ||
        e.mobile.includes(search) ||
        e.businessName?.toLowerCase().includes(q) ||
        e.number.toLowerCase().includes(q)
      )
    }
    return true
  })

  const counts = enquiries.reduce((acc, e) => {
    acc[e.status] = (acc[e.status] ?? 0) + 1
    return acc
  }, {} as Record<EnquiryStatus, number>)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Enquiries</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Catalog checkouts awaiting confirmation
          </p>
        </div>
      </div>

      {/* Status filter chips */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:text-foreground'
          }`}
        >
          All ({enquiries.length})
        </button>
        {(['new', 'called', 'confirmed', 'cancelled'] as EnquiryStatus[]).map(s => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === s
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            }`}
          >
            {STATUS_LABELS[s]} ({counts[s] ?? 0})
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, mobile, or #…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            No enquiries found.
          </div>
        ) : (
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Enquiry</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Items</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Payment</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Received</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(enq => (
                <tr key={enq.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    <p className="font-medium font-mono text-xs">{enq.number}</p>
                    {enq.businessName && (
                      <p className="text-xs text-muted-foreground mt-0.5">{enq.businessName}</p>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{enq.contactName}</p>
                    <a
                      href={`tel:${enq.mobile}`}
                      className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-0.5"
                    >
                      <Phone className="w-3 h-3" /> {enq.mobile}
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm">{enq.lines.length} line{enq.lines.length !== 1 ? 's' : ''}</span>
                    <p className="text-xs text-muted-foreground">
                      {enq.lines.reduce((s, l) => s + l.quantity, 0)} packs total
                    </p>
                  </td>
                  <td className="px-4 py-3">
                    {enq.paymentType ? (
                      <Badge variant="outline" className="text-xs capitalize">{enq.paymentType}</Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANTS[enq.status]} className="text-xs">
                      {STATUS_LABELS[enq.status]}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {relativeTime(enq.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/enquiries/${enq.id}`}>
                      <Button size="sm" variant="ghost" className="gap-1 h-7 px-2 text-xs">
                        Process <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
