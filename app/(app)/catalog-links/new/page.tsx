'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import { createCatalogLink } from '@/lib/services/catalog-links'
import type { Brand, Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, ChevronLeft, Package2, Check, Copy, CheckCheck, ExternalLink } from 'lucide-react'

type Step = 1 | 2 | 3

const BRAND_GRADIENTS = [
  'from-orange-500 to-red-600',
  'from-blue-500 to-indigo-600',
  'from-green-500 to-emerald-600',
  'from-purple-500 to-violet-600',
  'from-yellow-500 to-orange-600',
]

export default function NewCatalogLinkPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [selectedBrandIds, setSelectedBrandIds] = useState<string[]>([])
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([])
  const [title, setTitle] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    Promise.all([getBrands(), getProducts()]).then(([bs, ps]) => {
      setBrands(bs)
      setProducts(ps)
      setLoading(false)
    })
  }, [])

  function toggleBrand(id: string) {
    setSelectedBrandIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    // Clear product selections for deselected brand
    const brand = brands.find(b => b.id === id)
    if (!brand) return
    if (selectedBrandIds.includes(id)) {
      const brandProducts = products.filter(p => p.brandId === id).map(p => p.id)
      setSelectedProductIds(prev => prev.filter(pid => !brandProducts.includes(pid)))
    }
  }

  function toggleProduct(id: string) {
    setSelectedProductIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function selectAllProducts(brandId: string) {
    const brandProductIds = products.filter(p => p.brandId === brandId).map(p => p.id)
    const allSelected = brandProductIds.every(id => selectedProductIds.includes(id))
    if (allSelected) {
      setSelectedProductIds(prev => prev.filter(id => !brandProductIds.includes(id)))
    } else {
      setSelectedProductIds(prev => [...new Set([...prev, ...brandProductIds])])
    }
  }

  async function handleGenerate() {
    if (!title.trim()) return
    setSubmitting(true)
    try {
      const link = await createCatalogLink({
        title: title.trim(),
        brandIds: selectedBrandIds,
        productIds: selectedProductIds,
        createdBy: 'u2',
      })
      setGeneratedToken(link.token)
      setStep(3)
    } catch {
      // ignore
    }
    setSubmitting(false)
  }

  async function handleCopyLink() {
    if (!generatedToken) return
    await navigator.clipboard.writeText(`${window.location.origin}/c/${generatedToken}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
        Loading…
      </div>
    )
  }

  const generatedUrl = generatedToken ? `${typeof window !== 'undefined' ? window.location.origin : ''}/c/${generatedToken}` : ''

  return (
    <div className="p-6 space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/catalog-links" className="hover:text-foreground transition-colors">
          Catalog Links
        </Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">Create New</span>
      </nav>

      {/* Step indicator */}
      {step !== 3 && (
        <div className="flex items-center gap-3">
          {([1, 2] as const).map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${
                step === s
                  ? 'bg-primary text-primary-foreground'
                  : step > s
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
              }`}>
                {step > s ? <Check className="w-3.5 h-3.5" /> : s}
              </div>
              <span className={`text-sm ${step === s ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                {s === 1 ? 'Select Brands & Products' : 'Title & Generate'}
              </span>
              {s < 2 && <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
            </div>
          ))}
        </div>
      )}

      {/* Step 1: Select brands and products */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold">Select Brands</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Choose one or more brands to include in this catalog link.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {brands.map((brand, i) => {
              const isSelected = selectedBrandIds.includes(brand.id)
              return (
                <button
                  key={brand.id}
                  onClick={() => toggleBrand(brand.id)}
                  className={`rounded-xl border-2 overflow-hidden text-left transition-all ${
                    isSelected
                      ? 'border-primary shadow-sm'
                      : 'border-border hover:border-primary/40'
                  }`}
                >
                  <div className={`h-16 bg-gradient-to-br ${BRAND_GRADIENTS[i % BRAND_GRADIENTS.length]} flex items-center justify-center relative`}>
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary" />
                      </div>
                    )}
                    <span className="text-white font-bold text-xl">{brand.name.charAt(0)}</span>
                  </div>
                  <div className="p-2.5">
                    <p className="font-medium text-sm truncate">{brand.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {products.filter(p => p.brandId === brand.id).length} products
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Product selection within selected brands */}
          {selectedBrandIds.length > 0 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-semibold">Select Products</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Optionally pick specific products. Leave all selected to include everything.
                </p>
              </div>

              {selectedBrandIds.map(brandId => {
                const brand = brands.find(b => b.id === brandId)
                const brandProducts = products.filter(p => p.brandId === brandId)
                const selectedCount = brandProducts.filter(p => selectedProductIds.includes(p.id)).length
                const allSelected = selectedCount === brandProducts.length || selectedCount === 0

                return (
                  <div key={brandId} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-medium text-sm">{brand?.name}</p>
                      <button
                        onClick={() => selectAllProducts(brandId)}
                        className="text-xs text-primary hover:underline"
                      >
                        {allSelected ? 'Select all' : 'Deselect all'}
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {brandProducts.map(product => {
                        const isProductSelected = selectedProductIds.includes(product.id) ||
                          !selectedProductIds.some(id => brandProducts.map(p => p.id).includes(id))
                        return (
                          <button
                            key={product.id}
                            onClick={() => toggleProduct(product.id)}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border transition-colors ${
                              isProductSelected
                                ? 'bg-primary/10 border-primary text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/40'
                            }`}
                          >
                            {isProductSelected && <Check className="w-3 h-3" />}
                            {product.name}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex justify-end">
            <Button
              onClick={() => setStep(2)}
              disabled={selectedBrandIds.length === 0}
              className="gap-1.5"
            >
              Next <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Title and generate */}
      {step === 2 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold">Review & Generate</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Give this link a name and generate the 24-hour catalog URL.
            </p>
          </div>

          {/* Summary */}
          <div className="rounded-lg border border-border p-4 space-y-2 bg-muted/20">
            <p className="text-sm font-medium">Selected:</p>
            <div className="flex flex-wrap gap-1.5">
              {selectedBrandIds.map(id => {
                const brand = brands.find(b => b.id === id)
                return <Badge key={id} variant="secondary">{brand?.name}</Badge>
              })}
            </div>
            {selectedProductIds.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {selectedProductIds.length} specific product{selectedProductIds.length !== 1 ? 's' : ''} selected
              </p>
            )}
            {selectedProductIds.length === 0 && (
              <p className="text-xs text-muted-foreground">All products in selected brands</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="title">
              Link title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              placeholder="e.g. MuscleBlaze Range – FitLife Store"
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              This is for your reference — clients won&apos;t see it.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => setStep(1)} className="gap-1.5">
              <ChevronLeft className="w-4 h-4" /> Back
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={!title.trim() || submitting}
              className="gap-1.5"
            >
              {submitting ? 'Generating…' : 'Generate Link'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Generated link */}
      {step === 3 && generatedToken && (
        <div className="space-y-6">
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30 p-5 space-y-1">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold">
              <Check className="w-5 h-5" />
              Catalog link created!
            </div>
            <p className="text-sm text-muted-foreground">
              This link is active for 24 hours. Share it with your client via WhatsApp or copy the URL.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Your catalog link</Label>
            <div className="flex gap-2">
              <Input
                readOnly
                value={generatedUrl}
                className="font-mono text-xs bg-muted/30"
                onClick={e => (e.target as HTMLInputElement).select()}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleCopyLink}
                className="shrink-0"
              >
                {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
            >
              <ExternalLink className="w-4 h-4" /> Preview catalog
            </a>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Hi! Here's your customised catalog link: ${generatedUrl}\n\nValid for 24 hours.`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-md bg-[#25D366] text-white text-sm font-medium hover:bg-[#20b558] transition-colors"
            >
              <Package2 className="w-4 h-4" /> Send on WhatsApp
            </a>
            <Button
              variant="outline"
              onClick={() => router.push('/catalog-links')}
              className="sm:ml-auto"
            >
              Back to Links
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
