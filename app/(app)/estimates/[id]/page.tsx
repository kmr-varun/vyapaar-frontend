'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { useAuth } from '@/lib/auth-context'
import { getEstimates, sendEstimate, reviseEstimate, refreshExpiredEstimate } from '@/lib/services/estimates'
import { getOrders } from '@/lib/services/orders'
import { getVariants } from '@/lib/services/variants'
import { getVendorPriceRules } from '@/lib/services/vendors'
import { getLots } from '@/lib/services/inventory'
import type { Estimate, Order, Variant, VendorPriceRule, Lot } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { ChevronLeft, Copy, ExternalLink, RefreshCw, Send, FilePen, FileText as FilePdf, MessageCircle } from 'lucide-react'

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

const statusConfig: Record<string, { label: string; className: string }> = {
  draft:    { label: 'Draft',    className: 'bg-muted text-muted-foreground' },
  priced:   { label: 'Priced',   className: 'bg-blue-500/15 text-blue-500' },
  sent:     { label: 'Sent',     className: 'bg-green-500/15 text-green-500' },
  expired:  { label: 'Expired',  className: 'bg-amber-500/15 text-amber-600' },
  replaced: { label: 'Replaced', className: 'bg-muted/60 text-muted-foreground line-through' },
}

const modeConfig: Record<string, { label: string; className: string }> = {
  upi:    { label: 'UPI',    className: 'bg-purple-500/15 text-purple-500' },
  bank:   { label: 'Bank',   className: 'bg-blue-500/15 text-blue-400' },
  cash:   { label: 'Cash',   className: 'bg-green-500/15 text-green-500' },
  credit: { label: 'Credit', className: 'bg-orange-500/15 text-orange-500' },
}

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { can, user } = useAuth()
  const router = useRouter()
  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [priceRules, setPriceRules] = useState<VendorPriceRule[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    const [ests, ords, vars, rules, lotsData] = await Promise.all([
      getEstimates(),
      getOrders(),
      getVariants(),
      getVendorPriceRules(),
      getLots(),
    ])
    setEstimate(ests.find(e => e.id === id) ?? null)
    setOrders(ords)
    setVariants(vars)
    setPriceRules(rules)
    setLots(lotsData)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  function getVariant(variantId: string) { return variants.find(v => v.id === variantId) }
  function getNearestExpiry(variantId: string) {
    const variantLots = lots.filter(l => l.variantId === variantId)
    if (variantLots.length === 0) return undefined
    return variantLots.reduce((min, l) => l.expiry < min ? l.expiry : min, variantLots[0].expiry)
  }

  function bestCostPrice(variantId: string): number | null {
    const active = priceRules.filter(r => r.variantId === variantId && r.active)
    if (!active.length) return null
    return Math.min(...active.map(r => r.pricePerPack))
  }

  function marginPct(price: number, cost: number | null) {
    if (!cost || !price) return null
    return (((price - cost) / price) * 100).toFixed(1) + '%'
  }

  const isExpired = (e: Estimate) => e.status === 'sent' && new Date(e.validUntil) < new Date()

  async function handleSend() {
    if (!estimate) return
    setActionLoading('send')
    try {
      await sendEstimate(estimate.id, user?.id)
      await load()
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error')
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRevise() {
    if (!estimate) return
    setActionLoading('revise')
    try {
      const revised = await reviseEstimate(estimate.id)
      router.push(`/estimates/${revised.id}`)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRefresh() {
    if (!estimate) return
    setActionLoading('refresh')
    try {
      await refreshExpiredEstimate(estimate.id)
      await load()
    } finally {
      setActionLoading(null)
    }
  }

  function copyLink() {
    if (!estimate) return
    const url = `${window.location.origin}/estimate/${estimate.token}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>
  if (!estimate) return <div className="p-6 text-muted-foreground">Estimate not found.</div>

  const exp = isExpired(estimate)
  const statusKey = exp ? 'expired' : estimate.status
  const orderNum = orders.find(o => o.id === estimate.orderId)?.number ?? estimate.orderId.slice(0, 8)
  const estimateUrl = typeof window !== 'undefined' ? `${window.location.origin}/estimate/${estimate.token}` : `/estimate/${estimate.token}`

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/estimates" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Link href="/estimates" className="hover:text-foreground">Estimates</Link>
            <span>/</span>
            <span>{estimate.number}</span>
          </div>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            {estimate.number}
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${statusConfig[statusKey]?.className}`}>
              {statusConfig[statusKey]?.label}
            </span>
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div><span className="text-muted-foreground">Order:</span> <Link href={`/orders/${estimate.orderId}`} className="font-medium font-mono text-primary hover:underline">{orderNum}</Link></div>
        <div><span className="text-muted-foreground">Payment Mode:</span> <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ml-1 ${modeConfig[estimate.paymentMode]?.className}`}>{modeConfig[estimate.paymentMode]?.label}</span></div>
        <div><span className="text-muted-foreground">Tax:</span> <span className="font-medium">{estimate.taxInclusive ? 'Inclusive' : 'Exclusive'}</span></div>
        <div><span className="text-muted-foreground">Valid Until:</span> <span className="font-medium">{format(new Date(estimate.validUntil), 'dd MMM yyyy')}</span></div>
        <div><span className="text-muted-foreground">Version:</span> <span className="font-medium">v{estimate.version}</span></div>
        <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{format(new Date(estimate.createdAt), 'dd MMM yyyy')}</span></div>
        {estimate.sentAt && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Sent by:</span>{' '}
            <span className="font-medium">{estimate.sentByName ?? estimate.sentBy ?? 'Unknown'}</span>
            <span className="text-muted-foreground"> · </span>
            <span className="font-medium">{format(new Date(estimate.sentAt), 'dd MMM yyyy, HH:mm')}</span>
          </div>
        )}
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-muted/40">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Item</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Flavour</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expiry</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Qty</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Price/unit</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Discount</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">GST</th>
              <th className="text-right px-4 py-3 font-medium text-muted-foreground">Total</th>
            </tr>
          </thead>
          <tbody>
            {estimate.lines.map(line => {
              const v = getVariant(line.variantId)
              return (
                <tr key={line.id} className="border-t border-border hover:bg-muted/20">
                  <td className="px-4 py-3">
                    {v ? `${v.packSize}${v.packUnit}` : line.variantId}
                    {can('view-cost-prices') && (() => {
                      const cost = bestCostPrice(line.variantId)
                      const margin = line.pricePerPack ? marginPct(line.pricePerPack, cost) : null
                      return cost ? (
                        <div className="text-[10px] text-muted-foreground">Cost: {inr(cost)} · Margin: {margin ?? '—'}</div>
                      ) : null
                    })()}
                  </td>
                  <td className="px-4 py-3 text-sm">{v?.flavour ?? '—'}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {(() => { const exp = getNearestExpiry(line.variantId); return exp ? format(new Date(exp), 'MMM yyyy') : '—' })()}
                  </td>
                  <td className="px-4 py-3 text-right">{line.qtyPacks}</td>
                  <td className="px-4 py-3 text-right">{line.pricePerPack ? inr(line.pricePerPack) : '—'}</td>
                  <td className="px-4 py-3 text-right">{line.discount ? inr(line.discount) : '—'}</td>
                  <td className="px-4 py-3 text-right">{line.gstRate}%</td>
                  <td className="px-4 py-3 text-right font-medium">{inr(line.lineTotal)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="border-t border-border pt-3 space-y-1 text-sm max-w-xs ml-auto">
        <div className="flex justify-between text-muted-foreground">
          <span>Subtotal</span>
          <span>{inr(estimate.totalAmount - estimate.totalGst)}</span>
        </div>
        <div className="flex justify-between text-muted-foreground">
          <span>GST</span>
          <span>{inr(estimate.totalGst)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base">
          <span>Total</span>
          <span>{inr(estimate.totalAmount)}</span>
        </div>
      </div>

      <div className="bg-muted/40 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Public Estimate Link</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-xs bg-background px-2 py-1.5 rounded border border-border truncate">
            {estimateUrl}
          </code>
          <Button size="sm" variant="outline" className="h-7 shrink-0" onClick={copyLink}>
            <Copy className="w-3 h-3 mr-1" /> {copied ? 'Copied!' : 'Copy'}
          </Button>
          <a href={`/estimate/${estimate.token}`} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="h-7"><ExternalLink className="w-3 h-3" /></Button>
          </a>
        </div>
      </div>

      <div className="bg-muted/40 rounded-lg p-3 space-y-2">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Generate Invoices</p>
        <p className="text-xs text-muted-foreground">Two PDFs: one for GST-applicable items, one for non-GST items.</p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            <FilePdf className="w-3.5 h-3.5" /> GST Invoice PDF
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
            <FilePdf className="w-3.5 h-3.5" /> Non-GST Invoice PDF
          </Button>
          <Button size="sm" className="h-7 text-xs gap-1.5 bg-[#25D366] hover:bg-[#20b558] text-white border-0">
            <MessageCircle className="w-3.5 h-3.5" /> Send Both on WhatsApp
          </Button>
        </div>
      </div>

      <div className="flex gap-2 pt-1">
        {estimate.status === 'priced' && (
          <Button size="sm" disabled={actionLoading === 'send'} onClick={handleSend}>
            <Send className="w-4 h-4 mr-1.5" /> Send to Client
          </Button>
        )}
        {estimate.status === 'sent' && !exp && can('send-estimate') && (
          <Button size="sm" variant="outline" disabled={actionLoading === 'revise'} onClick={handleRevise}>
            <FilePen className="w-4 h-4 mr-1.5" /> Revise Estimate
          </Button>
        )}
        {exp && (
          <Button size="sm" variant="outline" disabled={actionLoading === 'refresh'} onClick={handleRefresh}>
            <RefreshCw className="w-4 h-4 mr-1.5" /> Refresh &amp; Resend
          </Button>
        )}
      </div>
    </div>
  )
}
