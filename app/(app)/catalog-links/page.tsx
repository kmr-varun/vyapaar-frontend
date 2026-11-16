'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { getCatalogLinks, deactivateCatalogLink } from '@/lib/services/catalog-links'
import type { CatalogLink } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, Copy, CheckCheck, ExternalLink, Trash2, Eye, ShoppingCart } from 'lucide-react'

function timeLeft(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now()
  if (diff <= 0) return 'Expired'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 0) return `${h}h ${m}m left`
  return `${m}m left`
}

export default function CatalogLinksPage() {
  const [links, setLinks] = useState<CatalogLink[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setLinks(await getCatalogLinks())
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function handleDeactivate(id: string) {
    await deactivateCatalogLink(id)
    await load()
  }

  async function handleCopy(link: CatalogLink) {
    const url = `${window.location.origin}/c/${link.token}`
    await navigator.clipboard.writeText(url)
    setCopiedId(link.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const isExpired = (link: CatalogLink) =>
    !link.active || new Date(link.expiresAt) < new Date()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Catalog Links</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Dynamic links for clients — expire after 24 hours
          </p>
        </div>
        <Link href="/catalog-links/new">
          <Button size="sm" className="gap-1.5">
            <Plus className="w-4 h-4" /> Create Link
          </Button>
        </Link>
      </div>

      <div className="rounded-lg border border-border overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            Loading…
          </div>
        ) : links.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-muted-foreground text-sm gap-2">
            <p>No catalog links yet.</p>
            <Link href="/catalog-links/new">
              <Button size="sm" variant="outline" className="gap-1.5">
                <Plus className="w-3.5 h-3.5" /> Create your first link
              </Button>
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-muted/40">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Brands</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expiry</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  <Eye className="w-3.5 h-3.5 inline mr-1" />Views
                </th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">
                  <ShoppingCart className="w-3.5 h-3.5 inline mr-1" />Checkouts
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {links.map(link => {
                const expired = isExpired(link)
                return (
                  <tr
                    key={link.id}
                    className={`border-t border-border hover:bg-muted/20 ${expired ? 'opacity-60' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium">{link.title}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {link.token.slice(0, 12)}…
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-xs text-muted-foreground">
                        {link.brandIds.length} brand{link.brandIds.length !== 1 ? 's' : ''}
                        {link.productIds.length > 0
                          ? `, ${link.productIds.length} SKU${link.productIds.length !== 1 ? 's' : ''}`
                          : ' (all)'}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${expired ? 'text-destructive' : 'text-amber-600 dark:text-amber-400'}`}>
                        {timeLeft(link.expiresAt)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">{link.viewCount}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{link.checkoutCount}</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={expired ? 'secondary' : 'default'}
                        className="text-xs"
                      >
                        {expired ? 'Expired' : 'Active'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {!expired && (
                          <>
                            <button
                              onClick={() => handleCopy(link)}
                              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                              title="Copy link"
                            >
                              {copiedId === link.id
                                ? <><CheckCheck className="w-3.5 h-3.5 text-emerald-500" /> Copied</>
                                : <><Copy className="w-3.5 h-3.5" /> Copy</>}
                            </button>
                            <span className="text-muted-foreground">·</span>
                            <a
                              href={`/c/${link.token}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Preview
                            </a>
                            <span className="text-muted-foreground">·</span>
                          </>
                        )}
                        <button
                          onClick={() => handleDeactivate(link.id)}
                          disabled={expired}
                          className="inline-flex items-center gap-1 text-xs text-destructive hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Deactivate"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Deactivate
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
