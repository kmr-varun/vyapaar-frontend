import { Suspense } from 'react'
import ProductVariantsPageClient from './_client'

export const instant = false

export default function ProductVariantsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>}>
      <ProductVariantsPageClient />
    </Suspense>
  )
}
