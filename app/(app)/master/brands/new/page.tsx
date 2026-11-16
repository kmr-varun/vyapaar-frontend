'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrand } from '@/lib/services/brands'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronRight } from 'lucide-react'

export default function NewBrandPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('Brand name is required.'); return }
    setError('')
    setSaving(true)
    try {
      await createBrand({ name: name.trim() })
      router.push('/master/brands')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create brand.')
    }
    setSaving(false)
  }

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/master/brands" className="hover:text-foreground transition-colors">Brands</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">New Brand</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Add Brand</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Create a new supplement brand</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="name">Brand name <span className="text-destructive">*</span></Label>
          <Input
            id="name"
            placeholder="e.g. Optimum Nutrition"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={saving}
            autoFocus
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Saving…' : 'Add Brand'}
          </Button>
          <Link href="/master/brands">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
