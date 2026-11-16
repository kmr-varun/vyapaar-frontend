'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { getCatalogLinkByToken, incrementViewCount } from '@/lib/services/catalog-links'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import { getVariants } from '@/lib/services/variants'
import { mockStockBalances } from '@/lib/mock-data'
import type { CatalogLink, Brand, Product, Variant } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Package2, ShoppingCart, Search, AlertTriangle, Plus, Minus, ChevronRight } from 'lucide-react'

type CartEntry = { variantId: string; qty: number }

function getAvailability(variantId: string): 'in-stock' | 'limited' | 'out-of-stock' {
  const rows = mockStockBalances.filter(b => b.variantId === variantId)
  const avail = rows.reduce((sum, r) => sum + r.sealedPacks + r.loosePacks - r.reservedPacks, 0)
  if (avail <= 0) return 'out-of-stock'
  if (avail < 12) return 'limited'
  return 'in-stock'
}

const AVAILABILITY_STYLES = {
  'in-stock': 'text-emerald-600 dark:text-emerald-400',
  'limited': 'text-amber-600 dark:text-amber-400',
  'out-of-stock': 'text-destructive',
}

const BRAND_GRADIENTS = [
  'from-orange-500 to-red-600',
  'from-blue-500 to-indigo-600',
  'from-green-500 to-emerald-600',
  'from-purple-500 to-violet-600',
  'from-yellow-500 to-orange-600',
]

export default function TokenCatalogClient() {
  const { token } = useParams<{ token: string }>()
  const router = useRouter()
  const [link, setLink] = useState<CatalogLink | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [loading, setLoading] = useState(true)
  const [expired, setExpired] = useState(false)

  const [search, setSearch] = useState('')
  const [cart, setCart] = useState<CartEntry[]>([])
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null)

  const load = useCallback(async () => {
    const cl = await getCatalogLinkByToken(token)
    if (!cl) { setExpired(true); setLoading(false); return }
    setLink(cl)
    incrementViewCount(cl.id)

    const [allBrands, allProducts, allVariants] = await Promise.all([
      getBrands(), getProducts(), getVariants()
    ])

    const filteredBrands = allBrands.filter(b => cl.brandIds.includes(b.id))

    let filteredProducts = allProducts.filter(p =>
      cl.brandIds.includes(p.brandId) && p.active
    )
    if (cl.productIds.length > 0) {
      filteredProducts = filteredProducts.filter(p => cl.productIds.includes(p.id))
    }

    const productIds = new Set(filteredProducts.map(p => p.id))
    const filteredVariants = allVariants.filter(v => productIds.has(v.productId) && v.active)

    setBrands(filteredBrands)
    setProducts(filteredProducts)
    setVariants(filteredVariants)
    setLoading(false)
  }, [token])

  useEffect(() => { load() }, [load])

  function updateCart(variantId: string, delta: number) {
    setCart(prev => {
      const existing = prev.find(e => e.variantId === variantId)
      if (!existing) {
        if (delta > 0) return [...prev, { variantId, qty: delta }]
        return prev
      }
      const newQty = existing.qty + delta
      if (newQty <= 0) return prev.filter(e => e.variantId !== variantId)
      return prev.map(e => e.variantId === variantId ? { ...e, qty: newQty } : e)
    })
  }

  function getCartQty(variantId: string) {
    return cart.find(e => e.variantId === variantId)?.qty ?? 0
  }

  const totalItems = cart.reduce((sum, e) => sum + e.qty, 0)

  const filteredProducts = search
    ? products.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        brands.find(b => b.id === p.brandId)?.name.toLowerCase().includes(search.toLowerCase())
      )
    : products

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (expired) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-xl font-semibold">Link Expired</h1>
          <p className="text-sm text-muted-foreground">
            This catalog link has expired or is no longer active. Please contact us for a fresh link.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <Package2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Royal Nutrition</span>
          </div>
          <div className="relative max-w-xs w-full hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9 text-sm"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          {totalItems > 0 && (
            <Button
              size="sm"
              className="gap-1.5 shrink-0"
              onClick={() => router.push(`/c/${token}/checkout?cart=${encodeURIComponent(JSON.stringify(cart))}`)}
            >
              <ShoppingCart className="w-4 h-4" />
              Checkout
              <span className="bg-white text-primary rounded-full text-xs font-bold w-4 h-4 flex items-center justify-center">
                {totalItems}
              </span>
            </Button>
          )}
        </div>
        {/* Mobile search */}
        <div className="sm:hidden px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9 text-sm"
              placeholder="Search products…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {brands.map((brand, i) => {
          const brandProducts = filteredProducts.filter(p => p.brandId === brand.id)
          if (brandProducts.length === 0) return null
          return (
            <div key={brand.id} className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${BRAND_GRADIENTS[i % BRAND_GRADIENTS.length]} flex items-center justify-center`}>
                  <span className="text-white font-bold text-sm">{brand.name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="font-semibold">{brand.name}</h2>
                  <p className="text-xs text-muted-foreground">
                    {brandProducts.length} product{brandProducts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {brandProducts.map(product => {
                  const productVariants = variants.filter(v => v.productId === product.id)
                  const isExpanded = expandedProduct === product.id

                  return (
                    <div key={product.id} className="rounded-xl border border-border bg-card overflow-hidden">
                      <button
                        className="w-full text-left p-4 hover:bg-muted/20 transition-colors"
                        onClick={() => setExpandedProduct(isExpanded ? null : product.id)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="font-medium text-sm">{product.name}</p>
                            {product.description && (
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {product.description}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {productVariants.length} variant{productVariants.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                        </div>
                        {cart.some(e => productVariants.some(v => v.id === e.variantId)) && (
                          <Badge variant="secondary" className="mt-2 text-xs">
                            In cart
                          </Badge>
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-border divide-y divide-border">
                          {productVariants.map(variant => {
                            const avail = getAvailability(variant.id)
                            const qty = getCartQty(variant.id)
                            const isOOS = avail === 'out-of-stock'

                            return (
                              <div key={variant.id} className={`px-4 py-3 flex items-center gap-3 ${isOOS ? 'opacity-50' : ''}`}>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium">{variant.flavour}</p>
                                  <p className="text-xs text-muted-foreground">
                                    {variant.packSize}{variant.packUnit} · {variant.skuCode}
                                  </p>
                                  <p className={`text-xs font-medium mt-0.5 ${AVAILABILITY_STYLES[avail]}`}>
                                    {avail === 'in-stock' ? 'In stock' : avail === 'limited' ? 'Limited stock' : 'Out of stock'}
                                  </p>
                                </div>
                                {!isOOS && (
                                  <div className="flex items-center gap-2 shrink-0">
                                    {qty > 0 ? (
                                      <>
                                        <button
                                          onClick={() => updateCart(variant.id, -1)}
                                          className="w-7 h-7 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
                                        >
                                          <Minus className="w-3.5 h-3.5" />
                                        </button>
                                        <span className="text-sm font-semibold w-5 text-center">{qty}</span>
                                        <button
                                          onClick={() => updateCart(variant.id, 1)}
                                          className="w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors"
                                        >
                                          <Plus className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <button
                                        onClick={() => updateCart(variant.id, 1)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                                      >
                                        <Plus className="w-3.5 h-3.5" /> Add
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Package2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No products found</p>
          </div>
        )}
      </main>

      {/* Sticky cart bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t border-border">
          <div className="max-w-4xl mx-auto">
            <Button
              className="w-full gap-2"
              onClick={() => router.push(`/c/${token}/checkout?cart=${encodeURIComponent(JSON.stringify(cart))}`)}
            >
              <ShoppingCart className="w-4 h-4" />
              Proceed to checkout · {totalItems} item{totalItems !== 1 ? 's' : ''}
              <ChevronRight className="w-4 h-4 ml-auto" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
