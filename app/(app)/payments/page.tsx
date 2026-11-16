'use client'

import { useEffect, useState, useCallback } from 'react'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { getPayments, verifyPayment, rejectPayment, approveCreditOrder, getClientOutstanding } from '@/lib/services/payments'
import { getOrders } from '@/lib/services/orders'
import { getClients } from '@/lib/services/clients'
import type { Payment, Order, Client } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react'

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

const statusBadge: Record<string, { label: string; className: string }> = {
  submitted: { label: 'Pending',  className: 'bg-amber-500/15 text-amber-600' },
  verified:  { label: 'Verified', className: 'bg-green-500/15 text-green-500' },
  rejected:  { label: 'Rejected', className: 'bg-destructive/15 text-destructive' },
}

const modeBadge: Record<string, string> = {
  upi: 'bg-purple-500/15 text-purple-500',
  bank: 'bg-blue-500/15 text-blue-400',
  cash: 'bg-green-500/15 text-green-500',
  credit: 'bg-orange-500/15 text-orange-500',
}

export default function PaymentsPage() {
  const { user, can } = useAuth()
  const [payments, setPayments] = useState<Payment[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [outstanding, setOutstanding] = useState<Array<{ client: Client; outstanding: number; overdueDays: number }>>([])
  const [loading, setLoading] = useState(true)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectId, setRejectId] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [ledgerClientId, setLedgerClientId] = useState('')
  const [creditOrderId, setCreditOrderId] = useState('')
  const [creditAmount, setCreditAmount] = useState('')
  const [creditOverride, setCreditOverride] = useState('')
  const [creditLoading, setCreditLoading] = useState(false)
  const [creditSuccess, setCreditSuccess] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [pays, ords, cls, out] = await Promise.all([
      getPayments(),
      getOrders(),
      getClients(),
      getClientOutstanding(),
    ])
    setPayments(pays.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()))
    setOrders(ords)
    setClients(cls)
    setOutstanding(out as Array<{ client: Client; outstanding: number; overdueDays: number }>)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function getOrderNumber(orderId: string) {
    return orders.find(o => o.id === orderId)?.number ?? orderId.slice(0, 8)
  }

  function getClientName(orderId: string) {
    const order = orders.find(o => o.id === orderId)
    if (!order) return '—'
    return clients.find(c => c.id === order.clientId)?.businessName ?? '—'
  }

  function isDupeUtr(payment: Payment) {
    if (!payment.utrReference) return false
    return payments.some(p => p.id !== payment.id && p.utrReference === payment.utrReference && p.status !== 'rejected')
  }

  async function handleVerify(id: string) {
    if (!user) return
    setActionLoading(id)
    try {
      const updated = await verifyPayment(id, user.id)
      setPayments(prev => prev.map(p => p.id === id ? updated : p))
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject() {
    if (!rejectId || !rejectReason.trim()) return
    setActionLoading(rejectId)
    try {
      const updated = await rejectPayment(rejectId, rejectReason)
      setPayments(prev => prev.map(p => p.id === rejectId ? updated : p))
      setRejectOpen(false)
      setRejectId('')
      setRejectReason('')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCreditApproval() {
    if (!user || !creditOrderId || !creditAmount) return
    setCreditLoading(true)
    try {
      const order = orders.find(o => o.id === creditOrderId)
      await approveCreditOrder({
        orderId: creditOrderId,
        clientId: order?.clientId ?? '',
        amount: parseFloat(creditAmount),
        overrideReason: creditOverride || undefined,
        approvedBy: user.id,
      })
      setCreditSuccess(true)
    } finally {
      setCreditLoading(false)
    }
  }

  const pending = payments.filter(p => p.status === 'submitted')
  const ledgerClient = clients.find(c => c.id === ledgerClientId)

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading payments…</div>

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Payments</h1>
        <p className="text-sm text-muted-foreground">{pending.length} pending verification</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending Verification
            {pending.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-600 text-[10px] font-bold">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="all">All Payments</TabsTrigger>
          <TabsTrigger value="ledger">Client Ledger</TabsTrigger>
        </TabsList>

        {/* Pending tab */}
        <TabsContent value="pending" className="space-y-3 mt-4">
          {pending.length === 0 ? (
            <Card><CardContent className="py-10 text-center text-muted-foreground">No payments pending verification.</CardContent></Card>
          ) : (
            pending.map(pay => (
              <Card key={pay.id}>
                <CardContent className="pt-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{getClientName(pay.orderId)}</span>
                        <span className="text-xs text-muted-foreground">{getOrderNumber(pay.orderId)}</span>
                        {isDupeUtr(pay) && (
                          <span className="inline-flex items-center gap-1 text-xs bg-amber-500/15 text-amber-600 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" /> Duplicate UTR
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="font-semibold">{inr(pay.amount)}</span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${modeBadge[pay.mode]}`}>
                          {pay.mode.toUpperCase()}
                        </span>
                        {pay.utrReference && (
                          <span className="text-xs text-muted-foreground font-mono">{pay.utrReference}</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Submitted {format(new Date(pay.submittedAt), 'dd MMM yyyy, hh:mm a')}
                      </p>
                      {pay.proofFileUrl && (
                        <a href={pay.proofFileUrl} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-primary underline underline-offset-2">
                          View proof
                        </a>
                      )}
                    </div>
                    {can('verify-payment') && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm" variant="outline"
                          className="h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
                          disabled={actionLoading === pay.id}
                          onClick={() => { setRejectId(pay.id); setRejectOpen(true) }}
                        >
                          <XCircle className="w-3.5 h-3.5 mr-1" /> Reject
                        </Button>
                        <Button
                          size="sm"
                          className="h-8 text-xs"
                          disabled={actionLoading === pay.id}
                          onClick={() => handleVerify(pay.id)}
                        >
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          {actionLoading === pay.id ? 'Verifying…' : 'Verify'}
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* All payments tab */}
        <TabsContent value="all" className="mt-4">
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Client / Order</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Mode</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Amount</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">UTR</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Submitted</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Verified By</th>
                </tr>
              </thead>
              <tbody>
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center px-4 py-8 text-muted-foreground">No payments yet.</td>
                  </tr>
                ) : payments.map(pay => (
                  <tr key={pay.id} className="border-t border-border hover:bg-muted/20">
                    <td className="px-4 py-3">
                      <p className="font-medium">{getClientName(pay.orderId)}</p>
                      <p className="text-xs text-muted-foreground">{getOrderNumber(pay.orderId)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${modeBadge[pay.mode]}`}>
                        {pay.mode.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{inr(pay.amount)}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{pay.utrReference ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusBadge[pay.status]?.className}`}>
                        {statusBadge[pay.status]?.label}
                      </span>
                      {pay.rejectionReason && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">{pay.rejectionReason}</p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {format(new Date(pay.submittedAt), 'dd MMM yyyy')}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {pay.verifiedBy
                        ? <span>{pay.verifiedBy} · {pay.verifiedAt ? format(new Date(pay.verifiedAt), 'dd MMM') : ''}</span>
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Client Ledger tab */}
        <TabsContent value="ledger" className="mt-4 space-y-5">
          {/* Ageing overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: '0 – 30 days', amount: 45000, color: 'text-green-500' },
              { label: '31 – 60 days', amount: 28000, color: 'text-amber-500' },
              { label: '61 – 90 days', amount: 15000, color: 'text-orange-500' },
              { label: '90+ days', amount: 8000, color: 'text-destructive' },
            ].map(b => (
              <Card key={b.label}>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground">{b.label}</p>
                  <p className={`text-lg font-bold mt-1 ${b.color}`}>{inr(b.amount)}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Client selector */}
          <div className="max-w-xs">
            <Label className="text-xs">Select Client</Label>
            <Select value={ledgerClientId} onValueChange={(v) => v && setLedgerClientId(v)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.businessName}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {ledgerClient && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">{ledgerClient.businessName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Credit Limit</p>
                    <p className="font-semibold">{inr(ledgerClient.creditLimit)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Credit Days</p>
                    <p className="font-semibold">{ledgerClient.creditDays}d</p>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">
                  Ledger entries will appear here once backend is connected.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Credit Approval (admin only) */}
          {can('approve-credit') && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Credit Approval</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {creditSuccess ? (
                  <div className="py-4 text-center text-green-500 font-medium">Credit approved successfully.</div>
                ) : (
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Order</Label>
                      <Select value={creditOrderId} onValueChange={(v) => v && setCreditOrderId(v)}>
                        <SelectTrigger><SelectValue placeholder="Select order…" /></SelectTrigger>
                        <SelectContent>
                          {orders.filter(o => o.status === 'payment-pending').map(o => (
                            <SelectItem key={o.id} value={o.id}>{o.number}</SelectItem>
                          ))}
                          {orders.filter(o => o.status === 'payment-pending').length === 0 && (
                            <SelectItem value="_none" disabled>No orders pending payment</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Credit Amount (₹)</Label>
                      <Input type="number" placeholder="0" value={creditAmount} onChange={e => setCreditAmount(e.target.value)} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Override Reason (required if above credit limit)</Label>
                      <Textarea rows={2} placeholder="Reason for override…" value={creditOverride} onChange={e => setCreditOverride(e.target.value)} />
                    </div>
                    <Button
                      disabled={creditLoading || !creditOrderId || !creditAmount}
                      onClick={handleCreditApproval}
                      size="sm"
                    >
                      {creditLoading ? 'Approving…' : 'Approve Credit'}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Label className="text-xs">Reason for rejection</Label>
            <Textarea
              rows={3}
              placeholder="Describe the issue (UTR mismatch, incorrect amount, etc.)"
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={!rejectReason.trim() || actionLoading === rejectId}
              onClick={handleReject}
            >
              {actionLoading === rejectId ? 'Rejecting…' : 'Reject Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
