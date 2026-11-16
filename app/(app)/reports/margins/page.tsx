'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

const marginRows = [
  { order: 'ORD-2611-00005', client: 'Wellness World', variant: 'MB BPW RC 1KG', qty: 24, revenue: 52864, cost: 45600, margin: 7264, pct: 13.7 },
  { order: 'ORD-2611-00005', client: 'Wellness World', variant: 'AV ISO CHO 5LB', qty: 6, revenue: 38940, cost: 27600, margin: 11340, pct: 29.1 },
  { order: 'ORD-2611-00004', client: 'Gym Zone', variant: 'ON GSW VIC 5LB', qty: 6, revenue: 36816, cost: 25200, margin: 11616, pct: 31.6 },
]

export default function MarginsReportPage() {
  const { can } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!can('view-margin-report')) router.replace('/dashboard')
  }, [can, router])

  if (!can('view-margin-report')) return null

  const totalRevenue = marginRows.reduce((s, r) => s + r.revenue, 0)
  const totalCost = marginRows.reduce((s, r) => s + r.cost, 0)
  const totalMargin = totalRevenue - totalCost
  const avgPct = ((totalMargin / totalRevenue) * 100).toFixed(1)

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Margin Report</h1>
          <p className="text-sm text-muted-foreground">Revenue, cost and margin by order and line</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => alert('Preparing export...')}>
          <Download className="w-4 h-4 mr-2" /> Export Excel
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: inr(totalRevenue) },
          { label: 'Total Cost', value: inr(totalCost) },
          { label: 'Gross Margin', value: inr(totalMargin) },
          { label: 'Margin %', value: `${avgPct}%` },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold mt-1">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Line-level Margins</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {['Order #', 'Client', 'Variant', 'Qty', 'Revenue', 'Cost', 'Margin', 'Margin %'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {marginRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{row.order}</td>
                    <td className="px-4 py-3">{row.client}</td>
                    <td className="px-4 py-3">{row.variant}</td>
                    <td className="px-4 py-3 text-right">{row.qty}</td>
                    <td className="px-4 py-3 text-right">{inr(row.revenue)}</td>
                    <td className="px-4 py-3 text-right">{inr(row.cost)}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-500">{inr(row.margin)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={row.pct >= 20 ? 'text-emerald-500' : 'text-amber-500'}>
                        {row.pct}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
