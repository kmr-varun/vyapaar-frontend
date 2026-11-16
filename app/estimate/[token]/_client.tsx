'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { format, formatDistanceToNow, isPast } from 'date-fns'
import { getEstimateByToken } from '@/lib/services/estimates'
import { getOrder } from '@/lib/services/orders'
import { getClient } from '@/lib/services/clients'
import { getVariant } from '@/lib/services/variants'
import { getSettings } from '@/lib/services/settings'
import { submitPayment } from '@/lib/services/payments'
import type { Estimate, Order, Client, Variant, AppSettings, PaymentMode } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { Package2, Upload, MessageSquare, AlertTriangle } from 'lucide-react'

function inr(n: number) {
  return '₹' + n.toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

export default function PublicEstimatePageClient() {
  const params = useParams()
  const token = params.token as string

  const [estimate, setEstimate] = useState<Estimate | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [variants, setVariants] = useState<Record<string, Variant>>({})
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [paymentOpen, setPaymentOpen] = useState(false)
  const [payMode, setPayMode] = useState<PaymentMode>('upi')
  const [payAmount, setPayAmount] = useState('')
  const [payUtr, setPayUtr] = useState('')
  const [payFile, setPayFile] = useState<File | null>(null)
  const [payLoading, setPayLoading] = useState(false)
  const [paySuccess, setPaySuccess] = useState(false)
  const [payError, setPayError] = useState('')

  const [changeOpen, setChangeOpen] = useState(false)
  const [changeNote, setChangeNote] = useState('')
  const [changeSent, setChangeSent] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const est = await getEstimateByToken(token)
        setEstimate(est)
        const [ord, s] = await Promise.all([getOrder(est.orderId), getSettings()])
        setOrder(ord)
        setSettings(s)
        const cl = await getClient(ord.clientId)
        setClient(cl)
        setPayMode(est.paymentMode)
        const varMap: Record<string, Variant> = {}
        await Promise.all(est.lines.map(async l => {
          const v = await getVariant(l.variantId)
          varMap[l.variantId] = v
        }))
        setVariants(varMap)
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Could not load estimate.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [token])

  async function handlePaymentSubmit() {
    if (!estimate || !order) return
    setPayError('')
    setPayLoading(true)
    try {
      await submitPayment({
        orderId: order.id,
        estimateId: estimate.id,
        amount: parseFloat(payAmount),
        mode: payMode,
        utrReference: payUtr || undefined,
        proofFileUrl: payFile ? URL.createObjectURL(payFile) : undefined,
      })
      setPaySuccess(true)
    } catch (e: unknown) {
      setPayError(e instanceof Error ? e.message : 'Payment submission failed.')
    } finally {
      setPayLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (error || !estimate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-sm w-full">
          <CardContent className="py-10 text-center space-y-2">
            <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
            <p className="font-medium">Estimate not found</p>
            <p className="text-sm text-muted-foreground">{error || 'This link may be invalid or expired.'}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const expired = isPast(new Date(estimate.validUntil))
  const replaced = estimate.status === 'replaced'
  const subtotal = estimate.totalAmount - estimate.totalGst

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-4">

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Package2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">{settings?.businessName ?? 'Royal Nutrition'}</p>
            <p className="text-xs text-muted-foreground">GSTIN: 27AABCR1234C1Z4 · Mumbai</p>
          </div>
        </div>

        {replaced && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-sm text-amber-700 dark:text-amber-400">
            <strong>This estimate has been replaced.</strong> A newer version may have been sent to you.
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-base">{estimate.number}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Issued {format(new Date(estimate.createdAt), 'dd MMM yyyy')}</p>
              </div>
              <div className="text-right">
                {expired ? (
                  <span className="text-xs text-destructive font-medium">Expired</span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    Valid for {formatDistanceToNow(new Date(estimate.validUntil))}
                  </span>
                )}
                <p className="text-xs text-muted-foreground">Until {format(new Date(estimate.validUntil), 'dd MMM yyyy')}</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {client && (
              <div className="text-sm space-y-0.5">
                <p className="font-medium">{client.businessName}</p>
                <p className="text-muted-foreground">{client.contactName} · {client.mobile}</p>
                <p className="text-muted-foreground text-xs">{client.billingAddress}</p>
                {client.gstin && <p className="text-muted-foreground text-xs">GSTIN: {client.gstin}</p>}
              </div>
            )}

            <Separator />

            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Items</p>
              <div className="space-y-2">
                {estimate.lines.map(line => {
                  const v = variants[line.variantId]
                  const taxable = line.lineTotal - line.gstAmount
                  return (
                    <div key={line.id} className="flex items-start justify-between gap-4 py-2 border-b border-border last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{v ? `${v.flavour} ${v.packSize}${v.packUnit}` : line.variantId}</p>
                        <p className="text-xs text-muted-foreground">
                          {line.qtyPacks} packs × {inr(line.pricePerPack ?? 0)}
                          {line.discount ? ` − ${inr(line.discount)} disc.` : ''}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Taxable: {inr(taxable)} · GST {line.gstRate}%: {inr(line.gstAmount)}
                        </p>
                      </div>
                      <p className="text-sm font-semibold shrink-0">{inr(line.lineTotal)}</p>
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator />

            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span><span>{inr(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>Total GST</span><span>{inr(estimate.totalGst)}</span>
              </div>
              <div className="flex justify-between font-bold text-base pt-1">
                <span>Grand Total</span><span>{inr(estimate.totalAmount)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {!expired && !replaced && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {estimate.paymentMode === 'upi' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">UPI ID</span>
                    <span className="font-mono font-medium">{settings?.upiId}</span>
                  </div>
                  <div className="border border-dashed border-border rounded-lg p-6 text-center text-muted-foreground text-xs">
                    QR Code · {inr(estimate.totalAmount)}<br />
                    <span className="font-mono">{estimate.number}</span>
                  </div>
                </div>
              )}
              {estimate.paymentMode === 'bank' && (
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-muted-foreground">Bank</span><span>{settings?.bankName}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Account</span><span className="font-mono">{settings?.bankAccountNumber}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">IFSC</span><span className="font-mono">{settings?.bankIfsc}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{settings?.bankAccountName}</span></div>
                  <p className="text-xs text-muted-foreground pt-1">Please use your order number <strong>{order?.number}</strong> as the payment reference.</p>
                </div>
              )}
              {estimate.paymentMode === 'cash' && (
                <p className="text-muted-foreground">Please pay cash at the time of delivery. Keep this estimate as your reference.</p>
              )}
              {estimate.paymentMode === 'credit' && (
                <p className="text-muted-foreground">This order is on credit. No payment is required at this time.</p>
              )}

              {(estimate.paymentMode === 'upi' || estimate.paymentMode === 'bank') && !paySuccess && (
                <Button className="w-full mt-2" onClick={() => setPaymentOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" /> Upload Payment Proof
                </Button>
              )}
              {paySuccess && (
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-sm text-green-700 dark:text-green-400 text-center">
                  Payment proof submitted. We will verify and confirm shortly.
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {!expired && !replaced && (
          <div className="text-center">
            <button
              onClick={() => setChangeOpen(true)}
              className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
            >
              <MessageSquare className="w-3 h-3 inline mr-1" />
              Request a change
            </button>
          </div>
        )}
      </div>

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Upload Payment Proof</DialogTitle>
          </DialogHeader>
          {paySuccess ? (
            <div className="py-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                <Upload className="w-6 h-6 text-green-500" />
              </div>
              <p className="font-medium">Payment proof submitted!</p>
              <p className="text-sm text-muted-foreground">We will verify and confirm shortly.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Amount Paid (₹)</Label>
                <Input type="number" placeholder="0" value={payAmount} onChange={e => setPayAmount(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Payment Mode</Label>
                <Select value={payMode} onValueChange={v => setPayMode(v as PaymentMode)}>
                  <SelectTrigger><SelectValue>{(val: string) => ({ upi: 'UPI', bank: 'Bank Transfer', cash: 'Cash' }[val] ?? val)}</SelectValue></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">UTR / Reference Number</Label>
                <Input placeholder="Transaction reference" value={payUtr} onChange={e => setPayUtr(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Proof (JPG, PNG or PDF, max 5 MB)</Label>
                <Input type="file" accept="image/jpeg,image/png,application/pdf"
                  onChange={e => setPayFile(e.target.files?.[0] ?? null)} />
              </div>
              {payError && <p className="text-xs text-destructive">{payError}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setPaymentOpen(false)}>Cancel</Button>
                <Button disabled={payLoading || !payAmount} onClick={handlePaymentSubmit}>
                  {payLoading ? 'Submitting…' : 'Submit'}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={changeOpen} onOpenChange={setChangeOpen}>
        <DialogContent className="max-w-lg max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Request a Change</DialogTitle>
          </DialogHeader>
          {changeSent ? (
            <div className="py-6 text-center">
              <p className="font-medium">Your request has been noted.</p>
              <p className="text-sm text-muted-foreground mt-1">Our team will reach out shortly.</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Textarea
                placeholder="Describe the change you'd like…"
                rows={4}
                value={changeNote}
                onChange={e => setChangeNote(e.target.value)}
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setChangeOpen(false)}>Cancel</Button>
                <Button disabled={!changeNote.trim()} onClick={() => setChangeSent(true)}>Send Request</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
