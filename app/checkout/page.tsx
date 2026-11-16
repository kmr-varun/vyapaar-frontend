'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createOrderFromCatalog } from '@/lib/services/orders'
import type { CartItem, CheckoutFormData, OrderLine } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { ChevronLeft, ShoppingCart, CheckCircle2, Trash2, Package2 } from 'lucide-react'

const inr = (n: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n)

function getCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem('vyapaar_cart')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem('vyapaar_cart', JSON.stringify(items))
}

function validateGSTIN(gstin: string): boolean {
  if (!gstin) return true
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)
  const [form, setForm] = useState<CheckoutFormData>({
    contactName: '',
    mobile: '',
    businessName: '',
    gstin: '',
    deliveryAddress: '',
    preferredDeliveryDate: '',
    notes: '',
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({})
  const [submitting, setSubmitting] = useState(false)
  const [confirmedOrder, setConfirmedOrder] = useState<{ number: string } | null>(null)

  useEffect(() => {
    setCart(getCart())
    setLoaded(true)
  }, [])

  function removeItem(variantId: string) {
    const updated = cart.filter(item => item.variantId !== variantId)
    setCart(updated)
    saveCart(updated)
  }

  function validate(): boolean {
    const e: typeof errors = {}
    if (!form.contactName.trim()) e.contactName = 'Required'
    if (!form.mobile.match(/^[6-9]\d{9}$/)) e.mobile = 'Enter a valid 10-digit mobile number'
    if (!form.deliveryAddress.trim()) e.deliveryAddress = 'Required'
    if (!form.preferredDeliveryDate) e.preferredDeliveryDate = 'Required'
    if (form.gstin && !validateGSTIN(form.gstin.toUpperCase())) e.gstin = 'Invalid GSTIN format'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    // Honeypot check (always passes for real users)
    const honeypot = (e.target as HTMLFormElement).elements.namedItem('website') as HTMLInputElement
    if (honeypot?.value) return

    if (!validate()) return
    setSubmitting(true)
    try {
      const lines: OrderLine[] = cart.map(item => ({
        id: '',
        orderId: '',
        variantId: item.variantId,
        qtyCartons: item.qtyCartons,
        qtyPacks: item.qtyPacks,
      }))
      const order = await createOrderFromCatalog({ ...form, gstin: form.gstin?.toUpperCase() || undefined }, lines)
      saveCart([])
      setConfirmedOrder({ number: order.number })
    } catch (err: unknown) {
      setErrors({ contactName: err instanceof Error ? err.message : 'Submission failed. Please try again.' })
    } finally {
      setSubmitting(false)
    }
  }

  function setField<K extends keyof CheckoutFormData>(key: K, val: CheckoutFormData[K]) {
    setForm(f => ({ ...f, [key]: val }))
    if (errors[key]) setErrors(e => ({ ...e, [key]: undefined }))
  }

  if (!loaded) return null

  if (confirmedOrder) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-5 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Order Placed!</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Your order <span className="font-mono font-semibold text-foreground">{confirmedOrder.number}</span> has been received.
            </p>
            <p className="text-muted-foreground text-sm mt-1">Our team will contact you shortly to confirm.</p>
          </div>
          <Link href="/catalog">
            <Button className="w-full">Continue Shopping</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center space-y-5">
          <ShoppingCart className="w-12 h-12 text-muted-foreground opacity-30 mx-auto" />
          <div>
            <h1 className="text-lg font-semibold">Your cart is empty</h1>
            <p className="text-sm text-muted-foreground mt-1">Add products from the catalog to get started.</p>
          </div>
          <Link href="/catalog">
            <Button>Browse Catalog</Button>
          </Link>
        </div>
      </div>
    )
  }

  const mrpTotal = cart.reduce((sum, item) => sum + item.mrp * (item.qtyCartons * item.unitsPerCarton + item.qtyPacks), 0)

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/catalog" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" /> Catalog
          </Link>
          <span className="font-medium text-sm ml-2">Checkout</span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Cart Summary */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">Order Summary</span>
          </div>
          <div className="divide-y divide-border">
            {cart.map(item => {
              const totalPacks = item.qtyCartons * item.unitsPerCarton + item.qtyPacks
              return (
                <div key={item.variantId} className="px-4 py-3 flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.brandName} — {item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.variantLabel}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {item.qtyCartons > 0 ? `${item.qtyCartons} ctn` : ''}
                      {item.qtyCartons > 0 && item.qtyPacks > 0 ? ' + ' : ''}
                      {item.qtyPacks > 0 ? `${item.qtyPacks} pks` : ''}
                      {' '}({totalPacks} total packs)
                    </p>
                  </div>
                  <div className="text-right shrink-0 flex flex-col items-end gap-1">
                    <p className="text-sm font-semibold">{inr(item.mrp * totalPacks)}</p>
                    <button onClick={() => removeItem(item.variantId)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="px-4 py-3 bg-muted/20 border-t border-border flex justify-between">
            <span className="text-sm text-muted-foreground">Total MRP (excl. GST)</span>
            <span className="font-semibold">{inr(mrpTotal)}</span>
          </div>
        </div>

        {/* Checkout Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* honeypot */}
          <input name="website" type="text" style={{ display: 'none' }} tabIndex={-1} autoComplete="off" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="contactName" className="text-xs">Contact Name <span className="text-destructive">*</span></Label>
              <Input
                id="contactName"
                value={form.contactName}
                onChange={e => setField('contactName', e.target.value)}
                placeholder="Your name"
              />
              {errors.contactName && <p className="text-xs text-destructive">{errors.contactName}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="mobile" className="text-xs">Mobile <span className="text-destructive">*</span></Label>
              <Input
                id="mobile"
                value={form.mobile}
                onChange={e => setField('mobile', e.target.value)}
                placeholder="10-digit number"
                maxLength={10}
                inputMode="numeric"
              />
              {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="businessName" className="text-xs">Business Name</Label>
              <Input
                id="businessName"
                value={form.businessName ?? ''}
                onChange={e => setField('businessName', e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="gstin" className="text-xs">GSTIN</Label>
              <Input
                id="gstin"
                value={form.gstin ?? ''}
                onChange={e => setField('gstin', e.target.value.toUpperCase())}
                placeholder="e.g. 29ABCDE1234F1Z5"
                maxLength={15}
              />
              {errors.gstin && <p className="text-xs text-destructive">{errors.gstin}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="deliveryAddress" className="text-xs">Delivery Address <span className="text-destructive">*</span></Label>
            <Textarea
              id="deliveryAddress"
              value={form.deliveryAddress}
              onChange={e => setField('deliveryAddress', e.target.value)}
              placeholder="Full delivery address"
              rows={3}
            />
            {errors.deliveryAddress && <p className="text-xs text-destructive">{errors.deliveryAddress}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preferredDate" className="text-xs">Preferred Delivery Date <span className="text-destructive">*</span></Label>
            <Input
              id="preferredDate"
              type="date"
              value={form.preferredDeliveryDate}
              onChange={e => setField('preferredDeliveryDate', e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
            {errors.preferredDeliveryDate && <p className="text-xs text-destructive">{errors.preferredDeliveryDate}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-xs">Notes</Label>
            <Textarea
              id="notes"
              value={form.notes ?? ''}
              onChange={e => setField('notes', e.target.value)}
              placeholder="Any special instructions?"
              rows={2}
            />
          </div>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Placing order…' : `Place Order · ${inr(mrpTotal)}`}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            Our team will call you to confirm pricing. Actual invoice may differ from MRP.
          </p>
        </form>
      </main>
    </div>
  )
}
