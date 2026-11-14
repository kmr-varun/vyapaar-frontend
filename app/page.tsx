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
  ArrowDown,
  ArrowUp,
  ArrowRight,
  Plus,
  Search,
  Printer,
  MoreVertical,
} from "lucide-react";
import Link from "next/link";

export default function Dashboard() {
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);

  useEffect(() => {
    // Load connection status from localStorage
    const whatsapp = localStorage.getItem('whatsappConnected') === 'true';
    const google = localStorage.getItem('googleConnected') === 'true';
    setWhatsappConnected(whatsapp);
    setGoogleConnected(google);
  }, []);

  const handleWhatsAppConnect = () => {
    const newStatus = !whatsappConnected;
    setWhatsappConnected(newStatus);
    localStorage.setItem('whatsappConnected', String(newStatus));
  };

  const handleGoogleConnect = () => {
    const newStatus = !googleConnected;
    setGoogleConnected(newStatus);
    localStorage.setItem('googleConnected', String(newStatus));
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search Transactions" className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <Link href="/sale">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Sale</span>
            </Button>
          </Link>
          <Link href="/purchase">
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Purchase</span>
            </Button>
          </Link>
          <Link href="/items">
            <Button variant="outline" size="icon" title="Quick Add Item">
              <Plus className="h-4 w-4" />
            </Button>
          </Link>
          <Button variant="outline" size="icon" onClick={() => window.print()}>
            <Printer className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={() => window.location.href = '/reports'} title="More Options">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Receivable
            </CardTitle>
            <div className="rounded-full bg-green-100 p-2">
              <ArrowDown className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ 21,91,393</div>
            <p className="text-xs text-muted-foreground">From 33 Parties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
            <div className="rounded-full bg-red-100 p-2">
              <ArrowUp className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ 6,900</div>
            <p className="text-xs text-muted-foreground">From 2 Parties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
                <span className="text-lg text-white">💬</span>
              </div>
              <CardTitle className="text-sm font-medium">
                WhatsApp Connect
              </CardTitle>
            </div>
            <span className={`text-xs font-semibold ${whatsappConnected ? 'text-green-600' : 'text-red-600'}`}>
              {whatsappConnected ? 'CONNECTED' : 'LOGGED OUT'}
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <p className="text-xs text-muted-foreground">
                90% of Indians check WhatsApp within 3 minutes
              </p>
              <Button variant="outline" onClick={handleWhatsAppConnect}>
                {whatsappConnected ? 'Disconnect WhatsApp' : 'Connect WhatsApp'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Google Profile Manager Card */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-sm font-medium">
            Google Profile Manager
          </CardTitle>
          {googleConnected && (
            <span className="text-xs font-semibold text-green-600">CONNECTED</span>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            <p className="text-xs text-muted-foreground">
              Google profiles with photos receive 42% more direction requests
            </p>
            <Button variant="outline" onClick={handleGoogleConnect}>
              {googleConnected ? 'Disconnect' : 'Connect Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sales Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Total Sale</CardTitle>
          <Select defaultValue="this-month">
            <SelectTrigger className="w-32 !h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this-month">This Month</SelectItem>
              <SelectItem value="last-month">Last Month</SelectItem>
              <SelectItem value="this-year">This Year</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">₹ 0</div>
          <div className="mt-4 h-64 rounded-md border bg-muted/10 flex items-center justify-center">
            <p className="text-muted-foreground">No sales data</p>
          </div>
        </CardContent>
      </Card>

      {/* Reports Section */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Most Used Reports</h2>
          <Link href="/reports"><Button variant="link">View All</Button></Link>
        </div>
        <div className="grid gap-4 md:grid-cols-5">
          <Card className="cursor-pointer hover:bg-accent">
            <CardContent className="pt-6">
              <Link href="/reports/sale" className="flex items-center justify-between">
                <h3 className="font-medium">Sale Report</h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent">
            <CardContent className="pt-6">
              <Link href="/reports/transactions" className="flex items-center justify-between">
                <h3 className="font-medium">All Transactions</h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent">
            <CardContent className="pt-6">
              <Link href="/reports/daybook" className="flex items-center justify-between">
                <h3 className="font-medium">Daybook Report</h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent">
            <CardContent className="pt-6">
              <Link href="/reports/party-statement" className="flex items-center justify-between">
                <h3 className="font-medium">Party Statement</h3>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </Link>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:bg-accent border-dashed" onClick={() => alert('Add widget')}>
            <CardContent className="pt-6">
              <div className="flex flex-col items-center justify-center gap-2 text-center">
                <Plus className="h-6 w-6 text-muted-foreground" />
                <h3 className="text-sm font-medium">Add Widget of Your Choice</h3>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
