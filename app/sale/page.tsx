"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2, Search, FileText, Eye, X } from "lucide-react";
import { format } from "date-fns";
import { mockParties, mockItems, mockTransports, type Item } from "@/lib/data-store";

interface LineItem {
  id: string;
  itemId: string;
  item: string;
  flavour: string;
  exp: string;
  mfgDate: string;
  mrp: string;
  qty: string;
  unit: string;
  pricePerUnit: string;
  amount: number;
}

export default function SalePage() {
  const [savedSales, setSavedSales] = useState<any[]>([]);
  const [parties, setParties] = useState(mockParties);
  const [items, setItems] = useState(mockItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [isCreditSale, setIsCreditSale] = useState(true);
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(undefined);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      itemId: "",
      item: "",
      flavour: "",
      exp: "",
      mfgDate: "",
      mrp: "",
      qty: "",
      unit: "NONE",
      pricePerUnit: "",
      amount: 0,
    },
  ]);
  const [roundOff, setRoundOff] = useState(true);

  useEffect(() => {
    setInvoiceDate(new Date());

    // Load saved data
    const savedParties = localStorage.getItem('parties');
    if (savedParties) {
      setParties(JSON.parse(savedParties));
    }

    const savedItems = localStorage.getItem('items');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }

    const sales = localStorage.getItem('sales');
    if (sales) {
      setSavedSales(JSON.parse(sales));
    }
  }, []);

  const handleCustomerChange = (customerId: string | null) => {
    if (!customerId) return;
    setSelectedCustomerId(customerId);
    const customer = parties.find((p) => p.id === customerId);
    if (customer) {
      setCustomerPhone(customer.phone);
    }
  };

  const handleItemChange = (index: number, itemId: string | null) => {
    if (!itemId) return;
    const selectedItem = items.find((i) => i.id === itemId);
    if (selectedItem) {
      const newItems = [...lineItems];
      newItems[index].itemId = itemId;
      newItems[index].item = selectedItem.name;
      newItems[index].mrp = selectedItem.mrp.toString();
      newItems[index].pricePerUnit = selectedItem.salePrice.toString();
      newItems[index].unit = selectedItem.unit;
      const qty = parseFloat(newItems[index].qty) || 0;
      newItems[index].amount = qty * selectedItem.salePrice;
      setLineItems(newItems);
    }
  };

  const handleQtyChange = (index: number, qty: string) => {
    const newItems = [...lineItems];
    newItems[index].qty = qty;
    const qtyNum = parseFloat(qty) || 0;
    const price = parseFloat(newItems[index].pricePerUnit) || 0;
    newItems[index].amount = qtyNum * price;
    setLineItems(newItems);
  };

  const handlePriceChange = (index: number, price: string) => {
    const newItems = [...lineItems];
    newItems[index].pricePerUnit = price;
    const priceNum = parseFloat(price) || 0;
    const qty = parseFloat(newItems[index].qty) || 0;
    newItems[index].amount = qty * priceNum;
    setLineItems(newItems);
  };

  const addRow = () => {
    setLineItems([
      ...lineItems,
      {
        id: Date.now().toString(),
        itemId: "",
        item: "",
        flavour: "",
        exp: "",
        mfgDate: "",
        mrp: "",
        qty: "",
        unit: "NONE",
        pricePerUnit: "",
        amount: 0,
      },
    ]);
  };

  const removeRow = (id: string) => {
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const calculateTotal = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
    return roundOff ? Math.round(subtotal) : subtotal;
  };

  const handleSave = () => {
    const saleData = {
      customer: parties.find((p) => p.id === selectedCustomerId),
      invoiceDate,
      isCreditSale,
      lineItems: lineItems.filter(item => item.item),
      total: calculateTotal(),
    };

    const existingSales = JSON.parse(localStorage.getItem('sales') || '[]');
    const newSale = { ...saleData, id: Date.now(), date: new Date().toISOString() };
    existingSales.push(newSale);
    localStorage.setItem('sales', JSON.stringify(existingSales));
    setSavedSales(existingSales);

    // Reset and close
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setSelectedCustomerId("");
    setCustomerPhone("");
    setInvoiceDate(new Date());
    setIsCreditSale(true);
    setLineItems([
      {
        id: "1",
        itemId: "",
        item: "",
        flavour: "",
        exp: "",
        mfgDate: "",
        mrp: "",
        qty: "",
        unit: "NONE",
        pricePerUnit: "",
        amount: 0,
      },
    ]);
  };

  const getAvailableFlavours = (itemId: string): string[] => {
    const item = items.find((i) => i.id === itemId);
    return item?.flavours || [];
  };

  const handleDeleteSale = (id: number) => {
    const updatedSales = savedSales.filter(s => s.id !== id);
    setSavedSales(updatedSales);
    localStorage.setItem('sales', JSON.stringify(updatedSales));
  };

  const totalSales = savedSales.reduce((sum, sale) => sum + (sale.total || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Sales</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Sale</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-[95vw] !w-[1400px] max-h-[95vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl">Add Sale</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-6">
              {/* Credit/Cash Toggle */}
              <div className="flex items-center gap-4">
                <span className="text-sm">Cash Sale</span>
                <Switch
                  checked={isCreditSale}
                  onCheckedChange={setIsCreditSale}
                />
                <span className="text-sm font-medium">Credit Sale</span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Customer Name *</Label>
                  <Select value={selectedCustomerId} onValueChange={handleCustomerChange}>
                    <SelectTrigger className="mt-2 !h-11 w-full">
                      <SelectValue placeholder="Select Customer">
                        {selectedCustomerId ? parties.find(p => p.id === selectedCustomerId)?.name : "Select Customer"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {parties
                        .filter((p) => p.type === "customer")
                        .map((party) => (
                          <SelectItem key={party.id} value={party.id}>
                            {party.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone No.</Label>
                  <Input
                    value={customerPhone}
                    readOnly
                    className="mt-2 !h-11 bg-muted"
                  />
                </div>
              </div>

              <div>
                <Label>Invoice Date</Label>
                <Popover>
                  <PopoverTrigger>
                    <Button variant="outline" className="w-full justify-start gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      <span>{invoiceDate ? format(invoiceDate, "dd/MM/yyyy") : "Select Date"}</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={invoiceDate}
                      onSelect={(date) => date && setInvoiceDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Line Items Table */}
              <div className="rounded-lg border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Item</TableHead>
                      <TableHead className="w-[120px]">Flavour</TableHead>
                      <TableHead className="w-[100px]">Exp</TableHead>
                      <TableHead className="w-[100px]">Mfg Date</TableHead>
                      <TableHead className="w-[80px]">MRP</TableHead>
                      <TableHead className="w-[80px]">Qty</TableHead>
                      <TableHead className="w-[80px]">Unit</TableHead>
                      <TableHead className="w-[100px]">Price/Unit</TableHead>
                      <TableHead className="w-[100px]">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => {
                      const availableFlavours = getAvailableFlavours(item.itemId);
                      return (
                        <TableRow key={item.id}>
                          <TableCell>
                            <Select
                              value={item.itemId}
                              onValueChange={(val) => handleItemChange(index, val)}
                            >
                              <SelectTrigger className="!h-10 w-full">
                                <SelectValue placeholder="Select Item">
                                  {item.item || "Select Item"}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent>
                                {items.map((itm) => (
                                  <SelectItem key={itm.id} value={itm.id}>
                                    {itm.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            {availableFlavours.length > 0 ? (
                              <Select
                                value={item.flavour}
                                onValueChange={(val) => {
                                  const newItems = [...lineItems];
                                  newItems[index].flavour = val || "";
                                  setLineItems(newItems);
                                }}
                              >
                                <SelectTrigger className="!h-10 w-full">
                                  <SelectValue placeholder="Select" />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableFlavours.map((flavour) => (
                                    <SelectItem key={flavour} value={flavour}>
                                      {flavour}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={item.flavour}
                                onChange={(e) => {
                                  const newItems = [...lineItems];
                                  newItems[index].flavour = e.target.value;
                                  setLineItems(newItems);
                                }}
                                placeholder="Flavour"
                                className="!h-10"
                              />
                            )}
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={item.exp}
                              onChange={(e) => {
                                const newItems = [...lineItems];
                                newItems[index].exp = e.target.value;
                                setLineItems(newItems);
                              }}
                              className="!h-10"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="date"
                              value={item.mfgDate}
                              onChange={(e) => {
                                const newItems = [...lineItems];
                                newItems[index].mfgDate = e.target.value;
                                setLineItems(newItems);
                              }}
                              className="!h-10"
                            />
                          </TableCell>
                          <TableCell>
                            <Input value={item.mrp} readOnly className="!h-10 bg-muted" />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.qty}
                              onChange={(e) => handleQtyChange(index, e.target.value)}
                              className="!h-10"
                            />
                          </TableCell>
                          <TableCell>
                            <Input value={item.unit} readOnly className="!h-10 bg-muted" />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.pricePerUnit}
                              onChange={(e) => handlePriceChange(index, e.target.value)}
                              className="!h-10"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              value={item.amount.toFixed(2)}
                              readOnly
                              className="!h-10 bg-muted"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRow(item.id)}
                              className="h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <Button variant="outline" onClick={addRow} className="gap-2">
                <Plus className="h-4 w-4" />
                ADD ROW
              </Button>

              <div className="flex items-center justify-between border-t pt-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={roundOff}
                    onCheckedChange={(checked) =>
                      setRoundOff(checked as boolean)
                    }
                  />
                  <Label>Round Off</Label>
                </div>
                <div className="text-right">
                  <div className="text-sm text-muted-foreground">Total</div>
                  <div className="text-3xl font-bold">
                    ₹{calculateTotal().toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-11 px-6"
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} className="h-11 px-6">
                  Save Sale
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search Sales" className="pl-10" />
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalSales.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {savedSales.length} transactions
          </p>
        </CardContent>
      </Card>

      {/* Sales Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Sales</CardTitle>
        </CardHeader>
        <CardContent>
          {savedSales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedSales.map((sale, index) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {sale.date ? new Date(sale.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>#{index + 1}</TableCell>
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
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSale(sale.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">No sales yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first sale to see it here</p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Sale
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
