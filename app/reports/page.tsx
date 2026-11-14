"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Search, Download, FileText, TrendingUp, Users } from "lucide-react";

export default function ReportsPage() {
  const [salesData, setSalesData] = useState<any[]>([]);
  const [purchasesData, setPurchasesData] = useState<any[]>([]);
  const [dateRange, setDateRange] = useState("this-month");

  useEffect(() => {
    // Load data from localStorage
    const sales = JSON.parse(localStorage.getItem('sales') || '[]');
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    setSalesData(sales);
    setPurchasesData(purchases);
  }, []);

  const totalSales = salesData.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const totalPurchases = purchasesData.reduce((sum, purchase) => sum + (purchase.total || 0), 0);
  const profit = totalSales - totalPurchases;

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Reports</h1>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={(val) => val && setDateRange(val)}>
            <SelectTrigger className="w-40 !h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this-week">This Week</SelectItem>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalSales.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {salesData.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalPurchases.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {purchasesData.length} transactions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{profit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {profit >= 0 ? 'Profit' : 'Loss'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reports Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sales" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="sales">Sales</TabsTrigger>
              <TabsTrigger value="purchases">Purchases</TabsTrigger>
              <TabsTrigger value="parties">Parties</TabsTrigger>
              <TabsTrigger value="items">Items</TabsTrigger>
            </TabsList>

            <TabsContent value="sales" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search sales..." className="pl-10" />
              </div>
              {salesData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Customer</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salesData.map((sale) => (
                      <TableRow key={sale.id}>
                        <TableCell>
                          {new Date(sale.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{sale.customer?.name || 'N/A'}</TableCell>
                        <TableCell>{sale.lineItems?.length || 0} items</TableCell>
                        <TableCell>
                          <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                            sale.isCreditSale
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {sale.isCreditSale ? 'Credit' : 'Cash'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{sale.total?.toLocaleString() || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No sales data yet</p>
                  <p className="text-sm text-muted-foreground">Create your first sale to see it here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="purchases" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search purchases..." className="pl-10" />
              </div>
              {purchasesData.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Items</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purchasesData.map((purchase) => (
                      <TableRow key={purchase.id}>
                        <TableCell>
                          {new Date(purchase.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell>{purchase.supplier?.name || 'N/A'}</TableCell>
                        <TableCell>{purchase.invoiceNumber || '-'}</TableCell>
                        <TableCell>{purchase.lineItems?.length || 0} items</TableCell>
                        <TableCell className="text-right font-medium">
                          ₹{purchase.total?.toLocaleString() || 0}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No purchase data yet</p>
                  <p className="text-sm text-muted-foreground">Create your first purchase to see it here</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="parties" className="space-y-4">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Party-wise report</p>
                <p className="text-sm text-muted-foreground">View detailed party transactions</p>
              </div>
            </TabsContent>

            <TabsContent value="items" className="space-y-4">
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Item-wise report</p>
                <p className="text-sm text-muted-foreground">View item stock and sales</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
