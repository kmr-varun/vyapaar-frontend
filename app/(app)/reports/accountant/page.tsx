'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Download } from 'lucide-react'

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

const gstSummary = [
  { rate: '5%',  taxable: 0,       gst: 0,     total: 0 },
  { rate: '12%', taxable: 0,       gst: 0,     total: 0 },
  { rate: '18%', taxable: 109000,  gst: 19620, total: 128620 },
  { rate: '28%', taxable: 0,       gst: 0,     total: 0 },
]

const invoices = [
  { number: 'INV-U1-2611-00001', date: '14 Nov 2026', client: 'Wellness World', order: 'ORD-2611-00005', gross: 85800, gst: 15192, net: 70608 },
  { number: 'INV-U1-2611-00002', date: '13 Nov 2026', client: 'Gym Zone',       order: 'ORD-2611-00004', gross: 36816, gst: 5616,  net: 31200 },
]

const payments = [
  { date: '14 Nov 2026', order: 'ORD-2611-00005', client: 'Wellness World', mode: 'bank', amount: 85800, utr: 'UTR001234567890', verifiedBy: 'Meena Patel' },
]

export default function AccountantPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Accountant View</h1>
          <p className="text-sm text-muted-foreground">Invoices, payments, and GST summary</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => alert('Preparing Tally export...')}>
            <Download className="w-4 h-4 mr-2" /> Tally Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => alert('Preparing export...')}>
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </Button>
        </div>
      </div>

      {/* Date Range */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex gap-3 items-end">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" defaultValue="2026-11-01" className="h-8 text-sm w-36" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" defaultValue="2026-11-16" className="h-8 text-sm w-36" />
            </div>
            <Button size="sm" variant="secondary">Apply</Button>
          </div>
        </CardContent>
      </Card>

      {/* GST Summary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">GST Summary by Rate</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-muted-foreground">
                <th className="text-left pb-2">GST Rate</th>
                <th className="text-right pb-2">Taxable Amount</th>
                <th className="text-right pb-2">GST Collected</th>
                <th className="text-right pb-2">Invoice Total</th>
              </tr>
            </thead>
            <tbody>
              {gstSummary.map(row => (
                <tr key={row.rate} className="border-b border-border/50 last:border-0">
                  <td className="py-2">{row.rate}</td>
                  <td className="text-right">{row.taxable ? inr(row.taxable) : '—'}</td>
                  <td className="text-right">{row.gst ? inr(row.gst) : '—'}</td>
                  <td className="text-right font-medium">{row.total ? inr(row.total) : '—'}</td>
                </tr>
              ))}
              <tr className="font-semibold border-t border-border">
                <td className="pt-2">Total</td>
                <td className="text-right pt-2">{inr(109000)}</td>
                <td className="text-right pt-2">{inr(19620)}</td>
                <td className="text-right pt-2">{inr(128620)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Tax Invoices</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {['Invoice #', 'Date', 'Client', 'Order #', 'Gross', 'GST', 'Net (ex. GST)'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => (
                  <tr key={inv.number} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 font-mono font-medium">{inv.number}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{inv.date}</td>
                    <td className="px-4 py-3">{inv.client}</td>
                    <td className="px-4 py-3">{inv.order}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(inv.gross)}</td>
                    <td className="px-4 py-3 text-right">{inr(inv.gst)}</td>
                    <td className="px-4 py-3 text-right">{inr(inv.net)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payments */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Payments Received</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {['Date', 'Order #', 'Client', 'Mode', 'Amount', 'UTR / Reference', 'Verified By'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap">{p.date}</td>
                    <td className="px-4 py-3">{p.order}</td>
                    <td className="px-4 py-3">{p.client}</td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-[10px] capitalize">{p.mode}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{inr(p.amount)}</td>
                    <td className="px-4 py-3 font-mono text-muted-foreground">{p.utr}</td>
                    <td className="px-4 py-3">{p.verifiedBy}</td>
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
