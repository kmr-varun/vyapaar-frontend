import { mockCatalogLinks } from '../mock-data'
import type { CatalogLink } from '../types'

const LS_KEY = 'vyapaar_catalog_links'

function loadStore(): CatalogLink[] {
  const base = [...mockCatalogLinks]
  if (typeof window === 'undefined') return base
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return base
    const persisted: CatalogLink[] = JSON.parse(raw)
    // Merge: mock links first, then any created links not already in base
    const mockIds = new Set(base.map(l => l.id))
    const extra = persisted.filter(l => !mockIds.has(l.id))
    return [...extra, ...base]
  } catch {
    return base
  }
}

function saveCreated(link: CatalogLink): void {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(LS_KEY)
    const existing: CatalogLink[] = raw ? JSON.parse(raw) : []
    // Replace if exists, otherwise prepend
    const idx = existing.findIndex(l => l.id === link.id)
    if (idx >= 0) existing[idx] = link
    else existing.unshift(link)
    localStorage.setItem(LS_KEY, JSON.stringify(existing))
  } catch { /* ignore */ }
}

function generateToken(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function getCatalogLinks(): Promise<CatalogLink[]> {
  return loadStore().sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getCatalogLinkByToken(token: string): Promise<CatalogLink | null> {
  const store = loadStore()
  const link = store.find(l => l.token === token)
  if (!link) return null
  if (!link.active) return null
  if (new Date(link.expiresAt) < new Date()) return null
  return link
}

export async function createCatalogLink(data: {
  title: string
  brandIds: string[]
  productIds: string[]
  createdBy: string
}): Promise<CatalogLink> {
  const link: CatalogLink = {
    id: `cl-link${Date.now()}`,
    token: generateToken(),
    title: data.title,
    brandIds: data.brandIds,
    productIds: data.productIds,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    createdBy: data.createdBy,
    createdAt: new Date().toISOString(),
    viewCount: 0,
    checkoutCount: 0,
    active: true,
  }
  saveCreated(link)
  return link
}

export async function incrementViewCount(id: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const links: CatalogLink[] = JSON.parse(raw)
    const link = links.find(l => l.id === id)
    if (link) {
      link.viewCount++
      localStorage.setItem(LS_KEY, JSON.stringify(links))
    }
  } catch { /* ignore */ }
}

export async function deactivateCatalogLink(id: string): Promise<void> {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) return
    const links: CatalogLink[] = JSON.parse(raw)
    const link = links.find(l => l.id === id)
    if (link) {
      link.active = false
      localStorage.setItem(LS_KEY, JSON.stringify(links))
    }
  } catch { /* ignore */ }
}
