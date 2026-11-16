'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Download } from 'lucide-react'

const inr = (v: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(v)

const salesRows = [
  { date: '14 Nov 2026', order: 'ORD-2611-00005', client: 'Wellness World', variant: 'MB BPW RC 1KG', qty: 24, unitPrice: 2200, taxable: 44800, gstPct: 18, gstAmt: 8064, total: 52864 },
  { date: '14 Nov 2026', order: 'ORD-2611-00005', client: 'Wellness World', variant: 'AV ISO CHO 5LB', qty: 6, unitPrice: 5500, taxable: 33000, gstPct: 18, gstAmt: 5940, total: 38940 },
  { date: '13 Nov 2026', order: 'ORD-2611-00004', client: 'Gym Zone', variant: 'ON GSW VIC 5LB', qty: 6, unitPrice: 5200, taxable: 31200, gstPct: 18, gstAmt: 5616, total: 36816 },
]

const gstBreakdown = [
  { rate: '5%', taxable: 0, gst: 0, total: 0 },
  { rate: '12%', taxable: 0, gst: 0, total: 0 },
  { rate: '18%', taxable: 109000, gst: 19620, total: 128620 },
  { rate: '28%', taxable: 0, gst: 0, total: 0 },
]

export default function SalesReportPage() {
  const [from, setFrom] = useState('2026-11-01')
  const [to, setTo] = useState('2026-11-16')
  const [unit, setUnit] = useState('all')
  const [brand, setBrand] = useState('all')
  const [mode, setMode] = useState('all')

  const totalSales = salesRows.reduce((s, r) => s + r.total, 0)
  const totalGst = salesRows.reduce((s, r) => s + r.gstAmt, 0)
  const netAmount = totalSales - totalGst

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Sales Report</h1>
          <p className="text-sm text-muted-foreground">All sales with GST breakdown</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => alert('Preparing export...')}>
          <Download className="w-4 h-4 mr-2" /> Export Excel
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">From</Label>
              <Input type="date" value={from} onChange={e => setFrom(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">To</Label>
              <Input type="date" value={to} onChange={e => setTo(e.target.value)} className="h-8 text-sm" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Unit</Label>
              <Select value={unit} onValueChange={(v) => v && setUnit(v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue>{(val: string) => ({ all: 'All units', unit1: 'Unit 1 — Andheri', unit2: 'Unit 2 — Bhiwandi' }[val] ?? val)}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All units</SelectItem>
                  <SelectItem value="unit1">Unit 1 — Andheri</SelectItem>
                  <SelectItem value="unit2">Unit 2 — Bhiwandi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Brand</Label>
              <Select value={brand} onValueChange={(v) => v && setBrand(v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue>{(val: string) => ({ all: 'All brands', br1: 'Optimum Nutrition', br2: 'MuscleBlaze', br4: 'Avatar Nutrition' }[val] ?? val)}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All brands</SelectItem>
                  <SelectItem value="br1">Optimum Nutrition</SelectItem>
                  <SelectItem value="br2">MuscleBlaze</SelectItem>
                  <SelectItem value="br4">Avatar Nutrition</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Payment Mode</Label>
              <Select value={mode} onValueChange={(v) => v && setMode(v)}>
                <SelectTrigger className="h-8 text-sm"><SelectValue>{(val: string) => ({ all: 'All modes', upi: 'UPI', bank: 'Bank Transfer', cash: 'Cash', credit: 'Credit' }[val] ?? val)}</SelectValue></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All modes</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Sales', value: inr(totalSales) },
          { label: 'Total GST', value: inr(totalGst) },
          { label: 'Net (ex. GST)', value: inr(netAmount) },
          { label: 'Order Count', value: '3' },
        ].map(c => (
          <Card key={c.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className="text-xl font-bold mt-1">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sales Table */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Line Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  {['Date', 'Order #', 'Client', 'Variant', 'Qty', 'Unit Price', 'Taxable', 'GST %', 'GST Amt', 'Total'].map(h => (
                    <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {salesRows.map((row, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="px-4 py-3 whitespace-nowrap">{row.date}</td>
                    <td className="px-4 py-3 font-medium">{row.order}</td>
                    <td className="px-4 py-3">{row.client}</td>
                    <td className="px-4 py-3">{row.variant}</td>
                    <td className="px-4 py-3 text-right">{row.qty}</td>
                    <td className="px-4 py-3 text-right">{inr(row.unitPrice)}</td>
                    <td className="px-4 py-3 text-right">{inr(row.taxable)}</td>
                    <td className="px-4 py-3 text-center">{row.gstPct}%</td>
                    <td className="px-4 py-3 text-right">{inr(row.gstAmt)}</td>
                    <td className="px-4 py-3 text-right font-medium">{inr(row.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* GST Breakdown */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">GST Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="border-b border-border">
              <tr className="text-muted-foreground">
                <th className="text-left pb-2">GST Rate</th>
                <th className="text-right pb-2">Taxable Amount</th>
                <th className="text-right pb-2">GST</th>
                <th className="text-right pb-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {gstBreakdown.map(row => (
                <tr key={row.rate} className="border-b border-border/50 last:border-0">
                  <td className="py-2">{row.rate}</td>
                  <td className="text-right">{row.taxable ? inr(row.taxable) : '—'}</td>
                  <td className="text-right">{row.gst ? inr(row.gst) : '—'}</td>
                  <td className="text-right font-medium">{row.total ? inr(row.total) : '—'}</td>
                </tr>
              ))}
              <tr className="font-semibold">
                <td className="pt-2">Total</td>
                <td className="text-right pt-2">{inr(109000)}</td>
                <td className="text-right pt-2">{inr(19620)}</td>
                <td className="text-right pt-2">{inr(128620)}</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
