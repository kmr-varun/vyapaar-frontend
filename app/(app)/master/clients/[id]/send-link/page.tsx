'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getClients } from '@/lib/services/clients'
import { getBrands } from '@/lib/services/brands'
import { getCatalogLinks } from '@/lib/services/catalog-links'
import type { Client, Brand, CatalogLink } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronRight, Copy, CheckCheck, MessageCircle, Share2 } from 'lucide-react'

export default function SendCatalogLinkPage() {
  const { id } = useParams<{ id: string }>()
  const [client, setClient] = useState<Client | null>(null)
  const [brands, setBrands] = useState<Brand[]>([])
  const [catalogLinks, setCatalogLinks] = useState<CatalogLink[]>([])
  const [loading, setLoading] = useState(true)
  const [mode, setMode] = useState<'catalog-link' | 'brand'>('catalog-link')
  const [selectedLinkId, setSelectedLinkId] = useState('')
  const [selectedBrandId, setSelectedBrandId] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    async function load() {
      const [clients, bs, links] = await Promise.all([getClients(true), getBrands(), getCatalogLinks()])
      const found = clients.find(c => c.id === id)
      setClient(found ?? null)
      setBrands(bs)
      setCatalogLinks(links.filter(l => l.active && new Date(l.expiresAt) > new Date()))
      setLoading(false)
    }
    load()
  }, [id])

  function getUrl(): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    if (mode === 'catalog-link' && selectedLinkId) {
      const link = catalogLinks.find(l => l.id === selectedLinkId)
      return link ? `${origin}/c/${link.token}` : ''
    }
    if (mode === 'brand') {
      if (!selectedBrandId) return `${origin}/catalog`
      const brand = brands.find(b => b.id === selectedBrandId)
      return brand ? `${origin}/catalog/${brand.slug}` : `${origin}/catalog`
    }
    return ''
  }

  function getWhatsAppMsg(): string {
    if (!client) return ''
    const url = getUrl()
    if (!url) return ''
    if (mode === 'catalog-link') {
      const link = catalogLinks.find(l => l.id === selectedLinkId)
      return `Hi ${client.contactName}, here is your personalised catalog link for ${link?.title ?? 'Royal Nutrition'}. Browse products and place your enquiry directly:\n${url}\n\nThis link is valid for 24 hours.`
    }
    const brand = brands.find(b => b.id === selectedBrandId)
    const brandLine = brand ? ` for *${brand.name}*` : ''
    return `Hi ${client.contactName}, here's the Royal Nutrition catalog${brandLine}. Browse products and place your order directly:\n${url}`
  }

  async function handleCopy() {
    const url = getUrl()
    if (!url) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading…</div>
  if (!client) return <div className="p-6 text-muted-foreground">Client not found.</div>

  const url = getUrl()
  const waMsg = getWhatsAppMsg()
  const waUrl = url ? `https://wa.me/91${client.mobile}?text=${encodeURIComponent(waMsg)}` : '#'

  return (
    <div className="p-6 space-y-6">
      <div>
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
          <Link href="/master/clients" className="hover:text-foreground transition-colors">Clients</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">{client.businessName}</span>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-foreground font-medium">Send Link</span>
        </nav>
        <h1 className="text-xl font-semibold flex items-center gap-2">
          <Share2 className="w-5 h-5" /> Send Catalog Link
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">{client.businessName} · {client.contactName} · +91 {client.mobile}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="md:col-span-2 space-y-1.5">
          <Label>Link type</Label>
          <div className="flex gap-2">
            <button
              onClick={() => setMode('catalog-link')}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${mode === 'catalog-link' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
            >
              Personalised Link (expires 24h)
            </button>
            <button
              onClick={() => setMode('brand')}
              className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${mode === 'brand' ? 'border-primary bg-primary/5 text-primary' : 'border-border text-muted-foreground hover:bg-muted'}`}
            >
              Brand Catalog
            </button>
          </div>
        </div>

        {mode === 'catalog-link' && (
          <div className="md:col-span-2 space-y-1.5">
            <Label>Select catalog link</Label>
            {catalogLinks.length === 0 ? (
              <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                No active catalog links. <Link href="/catalog-links/new" className="text-primary underline">Create one first.</Link>
              </div>
            ) : (
              <Select value={selectedLinkId} onValueChange={v => v && setSelectedLinkId(v)}>
                <SelectTrigger><SelectValue>{(val: string) => { const l = catalogLinks.find(o => o.id === val); return l ? l.title : (val || 'Select a link…') }}</SelectValue></SelectTrigger>
                <SelectContent>
                  {catalogLinks.map(l => (
                    <SelectItem key={l.id} value={l.id}>{l.title} ({l.brandIds.length} brand{l.brandIds.length !== 1 ? 's' : ''})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        {mode === 'brand' && (
          <div className="md:col-span-2 space-y-1.5">
            <Label>Filter by brand <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Select value={selectedBrandId || '__all__'} onValueChange={v => setSelectedBrandId(v === '__all__' ? '' : (v ?? ''))}>
              <SelectTrigger><SelectValue>{(val: string) => { if (!val || val === '__all__') return 'All products'; return brands.find(b => b.id === val)?.name ?? val }}</SelectValue></SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All products</SelectItem>
                {brands.filter(b => b.active).map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {url && (
          <>
            <div className="md:col-span-2 space-y-1.5">
              <Label>Catalog link</Label>
              <div className="flex gap-2">
                <Input readOnly value={url} className="text-xs font-mono bg-muted/30" onClick={e => (e.target as HTMLInputElement).select()} />
                <Button type="button" variant="outline" size="icon" onClick={handleCopy} className="shrink-0">
                  {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label className="text-muted-foreground">WhatsApp message preview</Label>
              <div className="rounded-lg bg-muted/30 border border-border px-3 py-2.5 text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {waMsg}
              </div>
            </div>
          </>
        )}
      </div>

      {url && (
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={handleCopy} className="gap-1.5">
            {copied ? <CheckCheck className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied!' : 'Copy Link'}
          </Button>
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            <MessageCircle className="w-4 h-4" /> Open WhatsApp
          </a>
        </div>
      )}
    </div>
  )
}
