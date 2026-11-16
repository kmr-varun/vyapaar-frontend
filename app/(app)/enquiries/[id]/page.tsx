'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getEnquiry, addCallLog, updateEnquiryLines, updateEnquiryStatus, convertToOrder } from '@/lib/services/enquiries'
import { createOrderFromEnquiry } from '@/lib/services/orders'
import { getVariants } from '@/lib/services/variants'
import { getProducts } from '@/lib/services/products'
import { getBrands } from '@/lib/services/brands'
import type { Enquiry, EnquiryLine, Variant, Product, Brand } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  ChevronRight, Phone, MessageCircle, Clock, User, Package2,
  Plus, Trash2, CheckCircle2, X,
} from 'lucide-react'

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [enq, setEnq] = useState<Enquiry | null>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [loading, setLoading] = useState(true)

  // Call log form
  const [logNote, setLogNote] = useState('')
  const [logOutcome, setLogOutcome] = useState<'reached' | 'not-reachable' | 'confirmed' | 'changes-made'>('reached')
  const [loggingCall, setLoggingCall] = useState(false)
  const [showCallForm, setShowCallForm] = useState(false)

  // Edit lines
  const [editingLines, setEditingLines] = useState(false)
  const [draftLines, setDraftLines] = useState<EnquiryLine[]>([])

  // Confirm order
  const [confirmingOrder, setConfirmingOrder] = useState(false)
  const [paymentType, setPaymentType] = useState<'cash' | 'credit'>('cash')

  const load = useCallback(async () => {
    const [e, allVariants, allProducts, allBrands] = await Promise.all([
      getEnquiry(id), getVariants(), getProducts(), getBrands()
    ])
    if (!e) { router.replace('/enquiries'); return }
    setEnq(e)
    setVariants(allVariants)
    setProducts(allProducts)
    setBrands(allBrands)
    setLoading(false)
  }, [id, router])

  useEffect(() => { load() }, [load])

  function getVariantLabel(variantId: string): string {
    const v = variants.find(v => v.id === variantId)
    const p = products.find(p => p.id === v?.productId)
    const b = brands.find(b => b.id === p?.brandId)
    if (!v || !p) return variantId
    return `${b?.name ?? ''} · ${p.name} · ${v.flavour} ${v.packSize}${v.packUnit}`
  }

  async function handleLogCall() {
    if (!logNote.trim() || !enq) return
    setLoggingCall(true)
    const updated = await addCallLog(enq.id, {
      note: logNote.trim(),
      outcome: logOutcome,
      by: 'u2',
      byName: 'Raj Sharma',
    })
    setEnq(updated)
    setLogNote('')
    setShowCallForm(false)
    setLoggingCall(false)
  }

  function startEditLines() {
    if (!enq) return
    setDraftLines(enq.lines.map(l => ({ ...l })))
    setEditingLines(true)
  }

  async function saveLines() {
    if (!enq) return
    const updated = await updateEnquiryLines(enq.id, draftLines.filter(l => l.quantity > 0))
    setEnq(updated)
    setEditingLines(false)
  }

  function updateDraftLine(variantId: string, qty: number) {
    setDraftLines(prev => prev.map(l => l.variantId === variantId ? { ...l, quantity: qty } : l))
  }

  function removeDraftLine(variantId: string) {
    setDraftLines(prev => prev.filter(l => l.variantId !== variantId))
  }

  function addDraftLine(variantId: string) {
    if (draftLines.some(l => l.variantId === variantId)) return
    setDraftLines(prev => [...prev, { variantId, quantity: 1 }])
  }

  async function handleConfirmOrder() {
    if (!enq) return
    setConfirmingOrder(true)
    try {
      const order = await createOrderFromEnquiry(enq)
      await convertToOrder(enq.id, order.id)
      if (paymentType !== 'cash') await updateEnquiryStatus(enq.id, 'confirmed', paymentType)
      router.push(`/orders/${order.id}`)
    } catch {
      setConfirmingOrder(false)
    }
  }

  async function handleCancel() {
    if (!enq) return
    const updated = await updateEnquiryStatus(enq.id, 'cancelled')
    setEnq(updated)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading…
      </div>
    )
  }

  if (!enq) return null

  const isClosed = enq.status === 'confirmed' || enq.status === 'cancelled'

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/enquiries" className="hover:text-foreground transition-colors">
          Enquiries
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">{enq.number}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold">{enq.number}</h1>
            <Badge variant={enq.status === 'new' ? 'default' : enq.status === 'called' ? 'secondary' : enq.status === 'confirmed' ? 'outline' : 'destructive'}>
              {enq.status.charAt(0).toUpperCase() + enq.status.slice(1)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Received {relativeTime(enq.createdAt)}
            {enq.catalogLinkId && ' · From catalog link'}
          </p>
        </div>
        {!isClosed && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive hover:text-destructive"
              onClick={handleCancel}
            >
              <X className="w-3.5 h-3.5" /> Cancel
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: Contact + Lines */}
        <div className="lg:col-span-2 space-y-4">
          {/* Contact info */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <h2 className="font-semibold text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" /> Contact
            </h2>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Name</p>
                <p className="font-medium">{enq.contactName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Mobile</p>
                <a href={`tel:${enq.mobile}`} className="font-medium text-primary hover:underline">
                  {enq.mobile}
                </a>
              </div>
              {enq.businessName && (
                <div>
                  <p className="text-muted-foreground text-xs">Business</p>
                  <p className="font-medium">{enq.businessName}</p>
                </div>
              )}
              {enq.email && (
                <div>
                  <p className="text-muted-foreground text-xs">Email</p>
                  <p className="font-medium">{enq.email}</p>
                </div>
              )}
              {enq.deliveryAddress && (
                <div className="col-span-2">
                  <p className="text-muted-foreground text-xs">Delivery address</p>
                  <p className="font-medium">{enq.deliveryAddress}</p>
                </div>
              )}
              {enq.preferredDate && (
                <div>
                  <p className="text-muted-foreground text-xs">Preferred date</p>
                  <p className="font-medium">{enq.preferredDate}</p>
                </div>
              )}
            </div>
            {enq.notes && (
              <div className="text-sm rounded-md bg-muted/30 px-3 py-2">
                <p className="text-muted-foreground text-xs mb-0.5">Notes</p>
                <p>{enq.notes}</p>
              </div>
            )}

            {/* Quick actions */}
            {!isClosed && (
              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${enq.mobile}`}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
                <span className="text-muted-foreground">·</span>
                <a
                  href={`https://wa.me/91${enq.mobile}?text=${encodeURIComponent(`Hi ${enq.contactName}, this is regarding your order enquiry ${enq.number}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              </div>
            )}
          </div>

          {/* Order lines */}
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Package2 className="w-4 h-4 text-muted-foreground" /> Products
              </h2>
              {!isClosed && !editingLines && (
                <Button variant="outline" size="sm" onClick={startEditLines} className="h-7 px-2 text-xs">
                  Edit
                </Button>
              )}
            </div>

            {!editingLines ? (
              <div className="space-y-2">
                {enq.lines.map(line => (
                  <div key={line.variantId} className="flex items-center justify-between gap-2 text-sm">
                    <p className="text-muted-foreground text-xs">{getVariantLabel(line.variantId)}</p>
                    <span className="shrink-0 font-semibold">{line.quantity} packs</span>
                  </div>
                ))}
                {enq.lines.length === 0 && (
                  <p className="text-sm text-muted-foreground">No lines</p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {draftLines.map(line => (
                  <div key={line.variantId} className="flex items-center gap-2">
                    <p className="text-xs text-muted-foreground flex-1">{getVariantLabel(line.variantId)}</p>
                    <Input
                      type="number"
                      min="1"
                      value={line.quantity}
                      onChange={e => updateDraftLine(line.variantId, parseInt(e.target.value) || 1)}
                      className="w-20 h-8 text-xs text-right"
                    />
                    <span className="text-xs text-muted-foreground">packs</span>
                    <button
                      onClick={() => removeDraftLine(line.variantId)}
                      className="text-destructive hover:opacity-80"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {/* Add line */}
                <div className="pt-1">
                  <Label className="text-xs text-muted-foreground">Add product</Label>
                  <Select onValueChange={(v: string | null) => { if (v) addDraftLine(v) }}>
                    <SelectTrigger className="h-8 text-xs mt-1">
                      <SelectValue placeholder="Select variant…" />
                    </SelectTrigger>
                    <SelectContent>
                      {variants.filter(v => !draftLines.some(l => l.variantId === v.id)).map(v => (
                        <SelectItem key={v.id} value={v.id} className="text-xs">
                          {getVariantLabel(v.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" onClick={saveLines} className="h-7 px-3 text-xs">Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingLines(false)} className="h-7 px-3 text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Confirm order */}
          {!isClosed && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary" /> Confirm Order
              </h2>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment type</Label>
                <Select value={paymentType} onValueChange={v => setPaymentType(v as 'cash' | 'credit')}>
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue>{(val: string) => val === 'cash' ? 'Cash' : val === 'credit' ? 'Credit' : val || 'Cash'}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="credit">Credit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleConfirmOrder}
                disabled={confirmingOrder || enq.lines.length === 0}
                className="gap-1.5"
              >
                {confirmingOrder ? 'Confirming…' : 'Confirm & Send to Admin'}
              </Button>
              <p className="text-xs text-muted-foreground">
                Confirmed orders go to the admin queue for pricing and invoice generation.
              </p>
            </div>
          )}

          {enq.status === 'confirmed' && (
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold text-sm">
                <CheckCircle2 className="w-4 h-4" /> Order confirmed
              </div>
              <p className="text-xs text-muted-foreground">
                Payment: <span className="font-medium capitalize">{enq.paymentType ?? 'cash'}</span>
              </p>
              {enq.orderId && (
                <Link href={`/orders/${enq.orderId}`}>
                  <Button size="sm" className="h-7 px-3 text-xs gap-1.5">
                    View Order <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right: Call log */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" /> Call Log
              </h2>
              {!isClosed && !showCallForm && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  onClick={() => setShowCallForm(true)}
                >
                  <Plus className="w-3 h-3" /> Add
                </Button>
              )}
            </div>

            {showCallForm && (
              <div className="space-y-2 pb-2 border-b border-border">
                <div className="space-y-1">
                  <Label className="text-xs">Outcome</Label>
                  <Select value={logOutcome} onValueChange={v => setLogOutcome(v as typeof logOutcome)}>
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue>{(val: string) => ({ reached: 'Reached', 'not-reachable': 'Not reachable', confirmed: 'Confirmed order', 'changes-made': 'Changes made' }[val] ?? (val || 'Reached'))}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="reached">Reached</SelectItem>
                      <SelectItem value="not-reachable">Not reachable</SelectItem>
                      <SelectItem value="confirmed">Confirmed order</SelectItem>
                      <SelectItem value="changes-made">Changes made</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Note</Label>
                  <Textarea
                    rows={2}
                    className="text-xs"
                    placeholder="What was discussed…"
                    value={logNote}
                    onChange={e => setLogNote(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleLogCall} disabled={loggingCall || !logNote.trim()} className="h-7 px-3 text-xs">
                    {loggingCall ? 'Saving…' : 'Log'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowCallForm(false)} className="h-7 px-3 text-xs">
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {enq.callLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No calls logged yet.</p>
            ) : (
              <div className="space-y-3">
                {[...enq.callLogs].reverse().map((log, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium capitalize">{log.outcome.replace(/-/g, ' ')}</span>
                      <span className="text-muted-foreground">{relativeTime(log.at)}</span>
                    </div>
                    <p className="text-muted-foreground">{log.note}</p>
                    <p className="text-muted-foreground">— {log.byName}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
