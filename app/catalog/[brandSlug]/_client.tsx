'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import { getVariants } from '@/lib/services/variants'
import type { Brand, Product, Variant } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, Package2, ShoppingCart } from 'lucide-react'

function getCartCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem('vyapaar_cart')
    if (!raw) return 0
    const items = JSON.parse(raw)
    return Array.isArray(items) ? items.length : 0
  } catch { return 0 }
}

const CATEGORY_COLORS: Record<string, string> = {
  whey: 'bg-blue-500/20 text-blue-400',
  isolate: 'bg-purple-500/20 text-purple-400',
  gainer: 'bg-green-500/20 text-green-400',
  'pre-workout': 'bg-red-500/20 text-red-400',
  creatine: 'bg-orange-500/20 text-orange-400',
  amino: 'bg-cyan-500/20 text-cyan-400',
  vitamins: 'bg-yellow-500/20 text-yellow-400',
  'fat-burner': 'bg-pink-500/20 text-pink-400',
  other: 'bg-muted text-muted-foreground',
}

export default function BrandPageClient() {
  const { brandSlug } = useParams<{ brandSlug: string }>()
  const [brand, setBrand] = useState<Brand | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [variantCounts, setVariantCounts] = useState<Record<string, number>>({})
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [brands, allProducts, allVariants] = await Promise.all([
        getBrands(),
        getProducts(),
        getVariants(),
      ])
      const b = brands.find(br => br.slug === brandSlug)
      if (!b) { setLoading(false); return }
      setBrand(b)
      const brandProducts = allProducts.filter(p => p.brandId === b.id && p.active)
      setProducts(brandProducts)
      const counts: Record<string, number> = {}
      for (const p of brandProducts) {
        counts[p.id] = allVariants.filter(v => v.productId === p.id && v.active).length
      }
      setVariantCounts(counts)
      setLoading(false)
    }
    load()
    setCartCount(getCartCount())
  }, [brandSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <Package2 className="w-10 h-10 text-muted-foreground opacity-30" />
        <p className="text-muted-foreground">Brand not found</p>
        <Link href="/catalog" className="text-primary text-sm underline">Back to catalog</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/catalog" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
            Catalog
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="font-medium text-sm">{brand.name}</span>
          <div className="ml-auto">
            <Link href="/checkout" className="relative flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium">
              <ShoppingCart className="w-4 h-4" />
              Cart
              {cartCount > 0 && (
                <span className="bg-white text-primary rounded-full text-xs font-bold w-4 h-4 flex items-center justify-center">{cartCount}</span>
              )}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{brand.name}</h1>
          <p className="text-muted-foreground mt-1">{products.length} product{products.length !== 1 ? 's' : ''}</p>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No products available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map(product => (
              <Link key={product.id} href={`/catalog/${brandSlug}/${product.slug}`}>
                <div className="group rounded-xl border border-border bg-card p-4 hover:border-primary/50 hover:shadow-md transition-all cursor-pointer h-full">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium capitalize ${CATEGORY_COLORS[product.category] ?? CATEGORY_COLORS.other}`}>
                      {product.category.replace('-', ' ')}
                    </span>
                  </div>
                  <h2 className="font-semibold text-sm group-hover:text-primary transition-colors leading-snug">{product.name}</h2>
                  {product.description && (
                    <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{product.description}</p>
                  )}
                  <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{variantCounts[product.id] ?? 0} variant{variantCounts[product.id] !== 1 ? 's' : ''}</span>
                    <span className="text-xs text-primary font-medium">View →</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
