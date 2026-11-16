'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { getSettings, updateSettings } from '@/lib/services/settings'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle2 } from 'lucide-react'
import type { AppSettings } from '@/lib/types'

function SavedToast() {
  return (
    <div className="flex items-center gap-2 text-emerald-500 text-sm">
      <CheckCircle2 className="w-4 h-4" /> Saved
    </div>
  )
}

export default function SettingsPage() {
  const { can } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<AppSettings | null>(null)
  const [saved, setSaved] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!can('edit-settings')) { router.replace('/dashboard'); return }
    getSettings().then(s => { setSettings(s) }).finally(() => setLoading(false))
  }, [can, router])

  async function saveSection(section: string, data: Partial<AppSettings>) {
    if (!settings) return
    const updated = await updateSettings(data)
    setSettings(updated)
    setSaved(section)
    setTimeout(() => setSaved(null), 2000)
  }

  if (loading || !settings) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure business and operational defaults</p>
      </div>

      {/* Business */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Business</CardTitle>
              <CardDescription className="text-xs mt-0.5">Name and branding</CardDescription>
            </div>
            {saved === 'business' && <SavedToast />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Business Name</Label>
            <Input
              value={settings.businessName}
              onChange={e => setSettings(s => s ? { ...s, businessName: e.target.value } : s)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Logo URL (optional)</Label>
            <Input placeholder="https://…" value={settings.logoUrl ?? ''} onChange={e => setSettings(s => s ? { ...s, logoUrl: e.target.value } : s)} />
          </div>
          <Button size="sm" onClick={() => saveSection('business', { businessName: settings.businessName, logoUrl: settings.logoUrl })}>Save</Button>
        </CardContent>
      </Card>

      {/* Number Prefixes */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Number Prefixes</CardTitle>
              <CardDescription className="text-xs mt-0.5">Document numbering</CardDescription>
            </div>
            {saved === 'prefixes' && <SavedToast />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'orderPrefix', label: 'Order Prefix' },
            { key: 'estimatePrefix', label: 'Estimate Prefix' },
            { key: 'invoicePrefix', label: 'Invoice Prefix' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input
                value={(settings as unknown as Record<string, string>)[key]}
                onChange={e => setSettings(s => s ? { ...s, [key]: e.target.value } : s)}
                className="max-w-xs"
              />
            </div>
          ))}
          <Button size="sm" onClick={() => saveSection('prefixes', { orderPrefix: settings.orderPrefix, estimatePrefix: settings.estimatePrefix, invoicePrefix: settings.invoicePrefix })}>Save</Button>
        </CardContent>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Payment Details</CardTitle>
              <CardDescription className="text-xs mt-0.5">Shown on estimate and invoice pages</CardDescription>
            </div>
            {saved === 'payment' && <SavedToast />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'upiId', label: 'UPI ID' },
            { key: 'bankName', label: 'Bank Name' },
            { key: 'bankAccountNumber', label: 'Account Number' },
            { key: 'bankIfsc', label: 'IFSC Code' },
            { key: 'bankAccountName', label: 'Account Name' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input
                value={(settings as unknown as Record<string, string>)[key]}
                onChange={e => setSettings(s => s ? { ...s, [key]: e.target.value } : s)}
              />
            </div>
          ))}
          <Button size="sm" onClick={() => saveSection('payment', {
            upiId: settings.upiId, bankName: settings.bankName,
            bankAccountNumber: settings.bankAccountNumber, bankIfsc: settings.bankIfsc,
            bankAccountName: settings.bankAccountName,
          })}>Save</Button>
        </CardContent>
      </Card>

      {/* Operational Defaults */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm">Operational Defaults</CardTitle>
              <CardDescription className="text-xs mt-0.5">SLA, validity and stock thresholds</CardDescription>
            </div>
            {saved === 'ops' && <SavedToast />}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { key: 'estimateValidityDays', label: 'Estimate Validity (days)' },
            { key: 'confirmationSlaHours', label: 'Confirmation SLA (hours)' },
            { key: 'expiryAlertWindowDays', label: 'Expiry Alert Window (days)' },
            { key: 'lowStockDefaultThreshold', label: 'Low Stock Threshold (packs)' },
          ].map(({ key, label }) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-xs">{label}</Label>
              <Input
                type="number"
                value={(settings as unknown as Record<string, number>)[key]}
                onChange={e => setSettings(s => s ? { ...s, [key]: Number(e.target.value) } : s)}
                className="max-w-xs"
              />
            </div>
          ))}
          <Button size="sm" onClick={() => saveSection('ops', {
            estimateValidityDays: settings.estimateValidityDays,
            confirmationSlaHours: settings.confirmationSlaHours,
            expiryAlertWindowDays: settings.expiryAlertWindowDays,
            lowStockDefaultThreshold: settings.lowStockDefaultThreshold,
          })}>Save</Button>
        </CardContent>
      </Card>
    </div>
  )
}
