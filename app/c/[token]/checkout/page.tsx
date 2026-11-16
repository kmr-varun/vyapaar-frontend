'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { getCatalogLinkByToken } from '@/lib/services/catalog-links'
import { getVariants } from '@/lib/services/variants'
import { getProducts } from '@/lib/services/products'
import { createEnquiry } from '@/lib/services/enquiries'
import type { Variant, Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Package2, ChevronLeft, CheckCircle2 } from 'lucide-react'

type CartEntry = { variantId: string; qty: number }

function CheckoutContent() {
  const { token } = useParams<{ token: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [cart, setCart] = useState<CartEntry[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [enquiryNumber, setEnquiryNumber] = useState('')

  const [form, setForm] = useState({ name: '', mobile: '', email: '' })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const rawCart = searchParams.get('cart')
    if (rawCart) {
      try { setCart(JSON.parse(decodeURIComponent(rawCart))) } catch { /* ignore */ }
    }

    async function load() {
      const cl = await getCatalogLinkByToken(token)
      if (!cl) { router.replace(`/c/${token}`); return }
      const [allVariants, allProducts] = await Promise.all([getVariants(), getProducts()])
      setVariants(allVariants)
      setProducts(allProducts)
      setLoading(false)
    }
    load()
  }, [token, searchParams, router])

  function validate() {
    const e: Record<string, string> = {}
    if (!form.name.trim()) e.name = 'Name is required'
    if (!/^\d{10}$/.test(form.mobile)) e.mobile = 'Enter a valid 10-digit mobile number'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Invalid email'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setSubmitting(true)
    try {
      const enq = await createEnquiry({
        contactName: form.name.trim(),
        mobile: form.mobile,
        email: form.email || undefined,
        lines: cart.map(e => ({ variantId: e.variantId, quantity: e.qty })),
      })
      setEnquiryNumber(enq.number)
      setSubmitted(true)
    } catch {
      setErrors({ submit: 'Something went wrong. Please try again.' })
    }
    setSubmitting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h1 className="text-xl font-semibold">Enquiry Submitted!</h1>
          <p className="text-sm text-muted-foreground">
            Your enquiry <span className="font-semibold text-foreground">{enquiryNumber}</span> has been received.
            Our team will call you shortly to confirm your order.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
          <div className="flex items-center gap-2 mx-auto">
            <Package2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Checkout</span>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Order summary */}
        <div className="rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-semibold text-sm">Order Summary</h2>
          <div className="space-y-2">
            {cart.map(item => {
              const variant = variants.find(v => v.id === item.variantId)
              const product = products.find(p => p.id === variant?.productId)
              if (!variant || !product) return null
              return (
                <div key={item.variantId} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{product.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {variant.flavour} · {variant.packSize}{variant.packUnit}
                    </p>
                  </div>
                  <span className="shrink-0 font-semibold">{item.qty} pack{item.qty !== 1 ? 's' : ''}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Contact form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <h2 className="font-semibold text-sm">Your Details</h2>

          <div className="space-y-1.5">
            <Label htmlFor="name">
              Full name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="Your name"
              autoComplete="name"
            />
            {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mobile">
              Mobile number <span className="text-destructive">*</span>
            </Label>
            <Input
              id="mobile"
              type="tel"
              inputMode="numeric"
              maxLength={10}
              value={form.mobile}
              onChange={e => setForm(f => ({ ...f, mobile: e.target.value.replace(/\D/g, '') }))}
              placeholder="10-digit mobile"
              autoComplete="tel"
            />
            {errors.mobile && <p className="text-xs text-destructive">{errors.mobile}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="optional"
              autoComplete="email"
            />
            {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
          </div>

          {errors.submit && <p className="text-sm text-destructive">{errors.submit}</p>}

          <p className="text-xs text-muted-foreground">
            Our team will call you to confirm pricing and delivery details. No payment needed now.
          </p>

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Enquiry'}
          </Button>
        </form>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  )
}
