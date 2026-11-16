'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import type { Brand, Product, ProductCategory } from '@/lib/types'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ShoppingCart, Search, Package2 } from 'lucide-react'

const CATEGORIES: { value: ProductCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'whey', label: 'Whey' },
  { value: 'isolate', label: 'Isolate' },
  { value: 'gainer', label: 'Gainer' },
  { value: 'pre-workout', label: 'Pre-Workout' },
  { value: 'creatine', label: 'Creatine' },
  { value: 'amino', label: 'Amino' },
  { value: 'vitamins', label: 'Vitamins' },
  { value: 'fat-burner', label: 'Fat Burner' },
]

const BRAND_GRADIENTS = [
  'from-orange-500 to-red-600',
  'from-blue-500 to-indigo-600',
  'from-green-500 to-emerald-600',
  'from-purple-500 to-violet-600',
  'from-yellow-500 to-orange-600',
]

function getCartCount(): number {
  if (typeof window === 'undefined') return 0
  try {
    const raw = localStorage.getItem('vyapaar_cart')
    if (!raw) return 0
    const items = JSON.parse(raw)
    return Array.isArray(items) ? items.length : 0
  } catch { return 0 }
}

export default function CatalogPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | 'all'>('all')
  const [cartCount, setCartCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getBrands(), getProducts()]).then(([bs, ps]) => {
      setBrands(bs)
      setProducts(ps)
      setLoading(false)
    })
    setCartCount(getCartCount())
  }, [])

  function getProductsForBrand(brandId: string) {
    return products.filter(p => p.brandId === brandId &&
      (categoryFilter === 'all' || p.category === categoryFilter)
    )
  }

  const filteredBrands = brands.filter(b => {
    const matchSearch = !search || b.name.toLowerCase().includes(search.toLowerCase())
    const matchCategory = categoryFilter === 'all' || getProductsForBrand(b.id).length > 0
    return matchSearch && matchCategory
  })

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 mr-auto">
            <Package2 className="w-5 h-5 text-primary" />
            <span className="font-semibold text-sm">Royal Nutrition</span>
          </div>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9 h-9 text-sm"
              placeholder="Search brands…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Link href="/checkout" className="relative">
            <div className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-lg px-3 py-1.5 text-sm font-medium">
              <ShoppingCart className="w-4 h-4" />
              Cart
              {cartCount > 0 && (
                <span className="bg-white text-primary rounded-full text-xs font-bold w-4 h-4 flex items-center justify-center">{cartCount}</span>
              )}
            </div>
          </Link>
        </div>

        {/* Category filters */}
        <div className="max-w-6xl mx-auto px-4 pb-3 overflow-x-auto">
          <div className="flex gap-2 w-max">
            {CATEGORIES.map(cat => (
              <button
                key={cat.value}
                onClick={() => setCategoryFilter(cat.value)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                  categoryFilter === cat.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          </div>
        ) : filteredBrands.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <Package2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No brands found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredBrands.map((brand, i) => {
              const brandProducts = getProductsForBrand(brand.id)
              return (
                <Link key={brand.id} href={`/catalog/${brand.slug}`}>
                  <div className="group rounded-xl border border-border overflow-hidden hover:border-primary/50 hover:shadow-md transition-all bg-card cursor-pointer">
                    <div className={`h-24 bg-gradient-to-br ${BRAND_GRADIENTS[i % BRAND_GRADIENTS.length]} flex items-center justify-center`}>
                      <span className="text-white font-bold text-xl">{brand.name.charAt(0)}</span>
                    </div>
                    <div className="p-3">
                      <p className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{brand.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{brandProducts.length} product{brandProducts.length !== 1 ? 's' : ''}</p>
                      {categoryFilter !== 'all' && (
                        <Badge variant="outline" className="mt-1.5 text-[10px] capitalize">{categoryFilter.replace('-', ' ')}</Badge>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
