'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import { getVariants } from '@/lib/services/variants'
import { getStockDisplay } from '@/lib/services/inventory'
import type { Brand, Product, Variant, CartItem, StockDisplay } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronLeft, ShoppingCart, CheckCircle2, Package2 } from 'lucide-react'

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

function getAvailability(variantId: string, stock: StockDisplay[]): 'in-stock' | 'limited' | 'out-of-stock' {
  const rows = stock.filter(s => s.variantId === variantId)
  const totalAvailable = rows.reduce((sum, s) => sum + s.availablePacks, 0)
  if (totalAvailable > 12) return 'in-stock'
  if (totalAvailable > 0) return 'limited'
  return 'out-of-stock'
}

const AVAILABILITY_STYLES = {
  'in-stock': 'bg-green-500/20 text-green-400',
  'limited': 'bg-amber-500/20 text-amber-400',
  'out-of-stock': 'bg-red-500/20 text-red-400',
}
const AVAILABILITY_LABELS = {
  'in-stock': 'In stock',
  'limited': 'Limited',
  'out-of-stock': 'Out of stock',
}

export default function ProductVariantsPageClient() {
  const { brandSlug, productSlug } = useParams<{ brandSlug: string; productSlug: string }>()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [product, setProduct] = useState<Product | null>(null)
  const [variants, setVariants] = useState<Variant[]>([])
  const [stock, setStock] = useState<StockDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [cartCount, setCartCount] = useState(0)
  const [addedVariant, setAddedVariant] = useState<string | null>(null)
  const [qtys, setQtys] = useState<Record<string, { cartons: number; packs: number }>>({})

  useEffect(() => {
    async function load() {
      const [brands, allProducts, allVariants, stockData] = await Promise.all([
        getBrands(),
        getProducts(),
        getVariants(),
        getStockDisplay(),
      ])
      const b = brands.find(br => br.slug === brandSlug)
      const p = allProducts.find(pr => pr.slug === productSlug)
      if (!b || !p) { setLoading(false); return }
      setBrand(b)
      setProduct(p)
      const pvs = allVariants.filter(v => v.productId === p.id && v.active)
      setVariants(pvs)
      setStock(stockData)
      const initQtys: Record<string, { cartons: number; packs: number }> = {}
      pvs.forEach(v => { initQtys[v.id] = { cartons: 0, packs: 0 } })
      setQtys(initQtys)
      setLoading(false)
    }
    load()
    setCartCount(getCart().length)
  }, [brandSlug, productSlug])

  function addToCart(variant: Variant) {
    const q = qtys[variant.id] ?? { cartons: 0, packs: 0 }
    if (q.cartons === 0 && q.packs === 0) return
    const cart = getCart()
    const existing = cart.findIndex(item => item.variantId === variant.id)
    const item: CartItem = {
      variantId: variant.id,
      skuCode: variant.skuCode,
      variantLabel: `${variant.flavour} ${variant.packSize}${variant.packUnit}`,
      productName: product?.name ?? '',
      brandName: brand?.name ?? '',
      mrp: variant.mrp,
      qtyCartons: q.cartons,
      qtyPacks: q.packs,
      unitsPerCarton: variant.unitsPerCarton,
    }
    if (existing >= 0) {
      cart[existing] = item
    } else {
      cart.push(item)
    }
    saveCart(cart)
    setCartCount(cart.length)
    setAddedVariant(variant.id)
    setTimeout(() => setAddedVariant(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!brand || !product) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Package2 className="w-10 h-10 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Product not found</p>
        <Link href="/catalog" className="text-primary text-sm underline">Back to catalog</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-2">
          <Link href={`/catalog/${brandSlug}`} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            {brand.name}
          </Link>
          <div className="ml-auto">
            <Link href="/checkout" className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium">
              <ShoppingCart className="w-4 h-4" />
              Cart
              {cartCount > 0 && (
                <span className="bg-white text-primary rounded-full text-xs font-bold w-4 h-4 flex items-center justify-center">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <p className="text-xs text-muted-foreground capitalize">{product.category.replace('-', ' ')}</p>
          <h1 className="text-xl font-bold mt-0.5">{product.name}</h1>
          {product.description && (
            <p className="text-sm text-muted-foreground mt-2">{product.description}</p>
          )}
        </div>

        <div className="space-y-3">
          {variants.map(variant => {
            const avail = getAvailability(variant.id, stock)
            const disabled = avail === 'out-of-stock'
            const isAdded = addedVariant === variant.id
            const q = qtys[variant.id] ?? { cartons: 0, packs: 0 }

            return (
              <div key={variant.id} className={`rounded-xl border p-4 transition-all ${disabled ? 'border-border opacity-60' : 'border-border hover:border-primary/40'}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium text-sm">{variant.flavour}</p>
                    <p className="text-xs text-muted-foreground">{variant.packSize}{variant.packUnit} · SKU: {variant.skuCode}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{inr(variant.mrp)}</p>
                    <span className={`inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${AVAILABILITY_STYLES[avail]}`}>
                      {AVAILABILITY_LABELS[avail]}
                    </span>
                  </div>
                </div>

                {!disabled && (
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex items-center gap-1.5">
                      <Input
                        type="number" min={0}
                        placeholder="Ctn"
                        className="w-16 h-8 text-xs text-center"
                        value={q.cartons || ''}
                        onChange={e => setQtys(prev => ({ ...prev, [variant.id]: { ...prev[variant.id], cartons: Math.max(0, +e.target.value) } }))}
                      />
                      <span className="text-xs text-muted-foreground">ctn</span>
                      <Input
                        type="number" min={0}
                        placeholder="Pks"
                        className="w-16 h-8 text-xs text-center"
                        value={q.packs || ''}
                        onChange={e => setQtys(prev => ({ ...prev, [variant.id]: { ...prev[variant.id], packs: Math.max(0, +e.target.value) } }))}
                      />
                      <span className="text-xs text-muted-foreground">pks</span>
                    </div>
                    <Button
                      size="sm"
                      className="h-8 ml-auto"
                      disabled={q.cartons === 0 && q.packs === 0}
                      onClick={() => addToCart(variant)}
                    >
                      {isAdded ? (
                        <><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Added</>
                      ) : 'Add to cart'}
                    </Button>
                  </div>
                )}

                {!disabled && (
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {variant.unitsPerCarton} packs per carton
                    {q.cartons > 0 || q.packs > 0 ? ` · Total: ${q.cartons * variant.unitsPerCarton + q.packs} packs` : ''}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
