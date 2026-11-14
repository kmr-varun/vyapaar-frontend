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
import { CalendarIcon, Plus, Trash2, Search, FileText } from "lucide-react";
import { format } from "date-fns";
import { mockParties, mockItems, type Item } from "@/lib/data-store";

interface LineItem {
  id: string;
  itemId: string;
  item: string;
  qty: string;
  unit: string;
  pricePerUnit: string;
  amount: number;
}

export default function PurchasePage() {
  const [savedPurchases, setSavedPurchases] = useState<any[]>([]);
  const [parties, setParties] = useState(mockParties);
  const [items, setItems] = useState(mockItems);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Form state
  const [isCreditPurchase, setIsCreditPurchase] = useState(true);
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(undefined);
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    {
      id: "1",
      itemId: "",
      item: "",
      qty: "",
      unit: "NONE",
      pricePerUnit: "",
      amount: 0,
    },
  ]);
  const [shipping, setShipping] = useState("0");
  const [roundOff, setRoundOff] = useState(true);
  const [description, setDescription] = useState("");

  const suppliers = parties.filter(p => p.type === "supplier");

  useEffect(() => {
    setPurchaseDate(new Date());

    // Load saved data
    const savedParties = localStorage.getItem('parties');
    if (savedParties) {
      setParties(JSON.parse(savedParties));
    }

    const savedItems = localStorage.getItem('items');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }

    const purchases = localStorage.getItem('purchases');
    if (purchases) {
      setSavedPurchases(JSON.parse(purchases));
    }
  }, []);

  const handleSupplierChange = (supplierId: string | null) => {
    if (!supplierId) return;
    setSelectedSupplierId(supplierId);
    const supplier = suppliers.find((p) => p.id === supplierId);
    if (supplier) {
      setSupplierPhone(supplier.phone);
    }
  };

  const handleItemChange = (index: number, itemId: string | null) => {
    if (!itemId) return;
    const selectedItem = items.find((i) => i.id === itemId);
    if (selectedItem) {
      const newItems = [...lineItems];
      newItems[index].itemId = itemId;
      newItems[index].item = selectedItem.name;
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
    const shippingCost = parseFloat(shipping) || 0;
    const total = subtotal + shippingCost;
    return roundOff ? Math.round(total) : total;
  };

  const handleSave = () => {
    const purchaseData = {
      supplier: suppliers.find((p) => p.id === selectedSupplierId),
      purchaseDate,
      isCreditPurchase,
      invoiceNumber,
      lineItems: lineItems.filter(item => item.item),
      shipping,
      description,
      total: calculateTotal(),
    };

    const existingPurchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    const newPurchase = { ...purchaseData, id: Date.now(), date: new Date().toISOString() };
    existingPurchases.push(newPurchase);
    localStorage.setItem('purchases', JSON.stringify(existingPurchases));
    setSavedPurchases(existingPurchases);

    // Reset and close
    resetForm();
    setIsDialogOpen(false);
  };

  const resetForm = () => {
    setSelectedSupplierId("");
    setSupplierPhone("");
    setPurchaseDate(new Date());
    setIsCreditPurchase(true);
    setInvoiceNumber("");
    setShipping("0");
    setDescription("");
    setLineItems([
      {
        id: "1",
        itemId: "",
        item: "",
        qty: "",
        unit: "NONE",
        pricePerUnit: "",
        amount: 0,
      },
    ]);
  };

  const handleDeletePurchase = (id: number) => {
    const updatedPurchases = savedPurchases.filter(p => p.id !== id);
    setSavedPurchases(updatedPurchases);
    localStorage.setItem('purchases', JSON.stringify(updatedPurchases));
  };

  const totalPurchases = savedPurchases.reduce((sum, purchase) => sum + (purchase.total || 0), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Purchase & Expense</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Purchase</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-[95vw] !w-[1400px] max-h-[95vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl">Add Purchase</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-6">
              {/* Form content */}
              <div className="flex items-center gap-4">
                <span className="text-sm">Cash Purchase</span>
                <Switch
                  checked={isCreditPurchase}
                  onCheckedChange={setIsCreditPurchase}
                />
                <span className="text-sm font-medium">Credit Purchase</span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label>Supplier Name *</Label>
                  <Select value={selectedSupplierId} onValueChange={handleSupplierChange}>
                    <SelectTrigger className="mt-2 !h-11 w-full">
                      <SelectValue placeholder="Select Supplier">
                        {selectedSupplierId ? suppliers.find(s => s.id === selectedSupplierId)?.name : "Select Supplier"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Phone Number</Label>
                  <Input
                    value={supplierPhone}
                    readOnly
                    className="mt-2 !h-11 bg-muted"
                  />
                </div>
                <div>
                  <Label>Invoice Number</Label>
                  <Input
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="Enter invoice number"
                    className="mt-2 !h-11"
                  />
                </div>
              </div>

              <div>
                <Label>Purchase Date</Label>
                <Popover>
                  <PopoverTrigger>
                    <Button
                      variant="outline"
                      className="mt-2 w-full !h-11 justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {purchaseDate ? format(purchaseDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={purchaseDate}
                      onSelect={setPurchaseDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Line Items Table */}
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Item</TableHead>
                      <TableHead className="w-[100px]">Qty</TableHead>
                      <TableHead className="w-[100px]">Unit</TableHead>
                      <TableHead className="w-[120px]">Price/Unit</TableHead>
                      <TableHead className="w-[120px]">Amount</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lineItems.map((item, index) => (
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
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Button variant="outline" onClick={addRow} className="gap-2">
                <Plus className="h-4 w-4" />
                ADD ROW
              </Button>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Shipping Charges</Label>
                  <Input
                    type="number"
                    value={shipping}
                    onChange={(e) => setShipping(e.target.value)}
                    className="mt-2 !h-11"
                  />
                </div>
                <div className="flex items-end justify-between">
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
                    <div className="text-2xl font-bold">
                      ₹{calculateTotal().toLocaleString()}
                    </div>
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
                  Save Purchase
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search Purchases" className="pl-10" />
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{totalPurchases.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            {savedPurchases.length} transactions
          </p>
        </CardContent>
      </Card>

      {/* Purchases Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Purchases</CardTitle>
        </CardHeader>
        <CardContent>
          {savedPurchases.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savedPurchases.map((purchase, index) => (
                  <TableRow key={purchase.id}>
                    <TableCell>
                      {purchase.date ? new Date(purchase.date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>{purchase.invoiceNumber || '#' + (index + 1)}</TableCell>
                    <TableCell>{purchase.supplier?.name || 'N/A'}</TableCell>
                    <TableCell>{purchase.lineItems?.length || 0} items</TableCell>
                    <TableCell>
                      <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                        purchase.isCreditPurchase
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {purchase.isCreditPurchase ? 'Credit' : 'Cash'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ₹{purchase.total?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeletePurchase(purchase.id)}
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
              <p className="text-lg font-medium text-muted-foreground mb-2">No purchases yet</p>
              <p className="text-sm text-muted-foreground mb-4">Create your first purchase to see it here</p>
              <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Your First Purchase
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
