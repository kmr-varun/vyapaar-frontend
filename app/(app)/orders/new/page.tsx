'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getClients, createClient } from '@/lib/services/clients'
import { getVariants } from '@/lib/services/variants'
import { getBrands } from '@/lib/services/brands'
import { getProducts } from '@/lib/services/products'
import { createOrderManual } from '@/lib/services/orders'
import type { Client, Variant, Brand, Product } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight, Plus, Trash2 } from 'lucide-react'

type OrderLine = { variantId: string; qtyCartons: number; qtyPacks: number }

export default function NewOrderPage() {
  const router = useRouter()
  const [clients, setClients] = useState<Client[]>([])
  const [variants, setVariants] = useState<Variant[]>([])
  const [brands, setBrands] = useState<Brand[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  const [clientSearch, setClientSearch] = useState('')
  const [clientFocused, setClientFocused] = useState(false)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [isNewClient, setIsNewClient] = useState(false)
  const [newClientName, setNewClientName] = useState('')
  const [newClientMobile, setNewClientMobile] = useState('')
  const [newClientBusiness, setNewClientBusiness] = useState('')
  const [newClientAddress, setNewClientAddress] = useState('')

  const [lines, setLines] = useState<OrderLine[]>([{ variantId: '', qtyCartons: 0, qtyPacks: 0 }])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getClients(), getVariants(), getBrands(), getProducts()]).then(([c, v, b, p]) => {
      setClients(c); setVariants(v); setBrands(b); setProducts(p); setLoading(false)
    })
  }, [])

  const filteredClients = clients.filter(c => {
    if (!c.active) return false
    if (!clientSearch) return true
    const q = clientSearch.toLowerCase()
    return c.businessName.toLowerCase().includes(q) || c.contactName.toLowerCase().includes(q) || c.mobile.includes(q)
  }).slice(0, 12)

  const variantOptions = variants.map(v => {
    const p = products.find(p => p.id === v.productId)
    const b = p ? brands.find(br => br.id === p.brandId) : undefined
    return { ...v, productName: p?.name ?? '', brandName: b?.name ?? '' }
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClientId && !isNewClient) { setError('Select or create a client.'); return }
    if (isNewClient && (!newClientName || !newClientMobile)) { setError('Contact name and mobile are required for a new client.'); return }
    const validLines = lines.filter(l => l.variantId)
    if (validLines.length === 0) { setError('Add at least one product line.'); return }
    setError('')
    setSaving(true)
    try {
      let clientId = selectedClientId
      if (isNewClient) {
        const c = await createClient({
          businessName: newClientBusiness || newClientName,
          contactName: newClientName,
          mobile: newClientMobile,
          billingAddress: newClientAddress,
          creditLimit: 0,
          creditDays: 0,
          source: 'manual',
        })
        clientId = c.id
      }
      await createOrderManual(clientId, validLines)
      router.push('/orders')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create order.')
    }
    setSaving(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/orders" className="hover:text-foreground transition-colors">Orders</Link>
        <ChevronRight className="w-3.5 h-3.5" />
        <span className="text-foreground font-medium">New Order</span>
      </nav>

      <div>
        <h1 className="text-xl font-semibold">Create Order</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manually create an order for a client</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Client section */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="font-medium text-sm">Client</h2>

          {!isNewClient ? (
            <div className="space-y-2">
              <div className="relative">
                <Input
                  placeholder="Click to browse or type to search…"
                  value={clientSearch}
                  onChange={e => { setClientSearch(e.target.value); setSelectedClientId('') }}
                  onFocus={() => setClientFocused(true)}
                  onBlur={() => setTimeout(() => setClientFocused(false), 150)}
                  autoComplete="off"
                />
                {clientFocused && filteredClients.length > 0 && (
                  <div className="absolute z-20 left-0 right-0 top-full mt-1 border border-border rounded-lg divide-y divide-border max-h-56 overflow-y-auto bg-popover shadow-md">
                    {filteredClients.map(c => (
                      <button
                        key={c.id}
                        type="button"
                        className={`w-full text-left px-3 py-2.5 text-sm hover:bg-muted/40 ${selectedClientId === c.id ? 'bg-primary/10' : ''}`}
                        onMouseDown={e => e.preventDefault()}
                        onClick={() => { setSelectedClientId(c.id); setClientSearch(`${c.businessName} — ${c.mobile}`); setClientFocused(false) }}
                      >
                        <span className="font-medium">{c.businessName}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{c.contactName} · {c.mobile}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedClientId && (
                <p className="text-xs text-emerald-500">✓ Client selected</p>
              )}
              <button type="button" className="text-xs text-primary underline" onClick={() => setIsNewClient(true)}>
                + New client
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-3 bg-muted/20 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">New Client</span>
                <button type="button" className="text-xs text-muted-foreground underline" onClick={() => setIsNewClient(false)}>
                  Choose existing
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Contact name <span className="text-destructive">*</span></Label>
                  <Input placeholder="Name" value={newClientName} onChange={e => setNewClientName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Mobile <span className="text-destructive">*</span></Label>
                  <Input placeholder="10-digit" value={newClientMobile} onChange={e => setNewClientMobile(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Business name</Label>
                  <Input placeholder="Optional" value={newClientBusiness} onChange={e => setNewClientBusiness(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Delivery address</Label>
                  <Input placeholder="Optional" value={newClientAddress} onChange={e => setNewClientAddress(e.target.value)} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Order lines */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h2 className="font-medium text-sm">Products</h2>
          <div className="space-y-2">
            {lines.map((line, i) => (
              <div key={i} className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  {i === 0 && <Label className="text-xs">Variant</Label>}
                  <Select value={line.variantId} onValueChange={v => setLines(ls => ls.map((l, j) => j === i ? { ...l, variantId: v ?? l.variantId } : l))}>
                    <SelectTrigger className="text-xs">
                      <SelectValue>{(val: string) => { if (!val) return 'Select variant'; const v = variantOptions.find(o => o.id === val); return v ? `${v.brandName} / ${v.productName} — ${v.flavour} ${v.packSize}${v.packUnit}` : val }}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {variantOptions.map(v => (
                        <SelectItem key={v.id} value={v.id} className="text-xs">
                          {v.brandName} / {v.productName} — {v.flavour} {v.packSize}{v.packUnit}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-20 space-y-1">
                  {i === 0 && <Label className="text-xs">Cartons</Label>}
                  <Input type="number" min={0} placeholder="0" className="text-xs" value={line.qtyCartons || ''} onChange={e => setLines(ls => ls.map((l, j) => j === i ? { ...l, qtyCartons: +e.target.value } : l))} />
                </div>
                <div className="w-20 space-y-1">
                  {i === 0 && <Label className="text-xs">Packs</Label>}
                  <Input type="number" min={0} placeholder="0" className="text-xs" value={line.qtyPacks || ''} onChange={e => setLines(ls => ls.map((l, j) => j === i ? { ...l, qtyPacks: +e.target.value } : l))} />
                </div>
                {lines.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" className="shrink-0 h-9 w-9 text-muted-foreground hover:text-destructive" onClick={() => setLines(ls => ls.filter((_, j) => j !== i))}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" onClick={() => setLines(ls => [...ls, { variantId: '', qtyCartons: 0, qtyPacks: 0 }])}>
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Add line
          </Button>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
            {saving ? 'Creating…' : 'Create Order'}
          </Button>
          <Link href="/orders">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
