"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Users,
  Package,
  ShoppingCart,
  ShoppingBag,
  Wallet,
  FileText,
  RefreshCw,
  Command,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Parties", href: "/parties", icon: Users },
  { name: "Items", href: "/items", icon: Package },
  { name: "Sale", href: "/sale", icon: ShoppingCart },
  { name: "Purchase & Expense", href: "/purchase", icon: ShoppingBag },
  { name: "Cash & Bank", href: "/cash-bank", icon: Wallet },
  { name: "Reports", href: "/reports", icon: FileText },
  { name: "Sync, Share & Backup", href: "/sync", icon: RefreshCw },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const searchItems = [
    { name: "Dashboard", path: "/" },
    { name: "Parties", path: "/parties" },
    { name: "Items", path: "/items" },
    { name: "Sale", path: "/sale" },
    { name: "Purchase & Expense", path: "/purchase" },
    { name: "Cash & Bank", path: "/cash-bank" },
    { name: "Reports", path: "/reports" },
    { name: "Sync, Share & Backup", path: "/sync" },
  ];

  const filteredItems = searchItems.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchSelect = (path: string) => {
    setSearchOpen(false);
    setSearchQuery("");
    router.push(path);
  };

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-background">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">Vyapaar</h1>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link key={item.name} href={item.href} className="block">
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start gap-2"
              >
                <Icon className="h-4 w-4" />
                <span>{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </nav>
      <Separator />
      <div className="p-4 space-y-3">
        <Button variant="outline" className="w-full gap-2" onClick={() => setSearchOpen(true)}>
          <Command className="h-4 w-4" />
          <span>Open Anything (Ctrl+F)</span>
        </Button>

        {/* Business Name Footer */}
        <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-sm">
            R
          </div>
          <div className="flex-1 text-sm font-medium">ROYAL NUTRITION</div>
        </div>
      </div>

      {/* Quick Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Quick Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
            <div className="space-y-1">
              {filteredItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleSearchSelect(item.path)}
                  className="w-full rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                >
                  {item.name}
                </button>
              ))}
              {filteredItems.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No results found
                </p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
