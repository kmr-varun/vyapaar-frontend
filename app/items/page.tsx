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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, X } from "lucide-react";
import { mockCategories, mockItems, type Item } from "@/lib/data-store";

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>(mockItems);

  useEffect(() => {
    // Load items from localStorage on mount
    const savedItems = localStorage.getItem('items');
    if (savedItems) {
      setItems(JSON.parse(savedItems));
    }
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isProduct, setIsProduct] = useState(true);
  const [itemImage, setItemImage] = useState<string>("");
  const [newItem, setNewItem] = useState({
    name: "",
    code: "",
    category: "",
    unit: "NONE",
    mrp: "",
    salePrice: "",
    stock: "",
  });

  const handleAddItem = () => {
    const item: Item = {
      id: Date.now().toString(),
      name: newItem.name,
      code: newItem.code,
      category: newItem.category,
      unit: newItem.unit,
      mrp: parseFloat(newItem.mrp) || 0,
      salePrice: parseFloat(newItem.salePrice) || 0,
      stock: parseFloat(newItem.stock) || 0,
      type: isProduct ? "product" : "service",
    };
    const updatedItems = [...items, item];
    setItems(updatedItems);
    localStorage.setItem('items', JSON.stringify(updatedItems));
    setIsDialogOpen(false);
    setNewItem({
      name: "",
      code: "",
      category: "",
      unit: "NONE",
      mrp: "",
      salePrice: "",
      stock: "",
    });
    setItemImage("");
  };

  const handleItemImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setItemImage(file.name);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Items</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-[95vw] !w-[1400px] max-h-[95vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl">Add Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 p-6">
              {/* Product/Service Toggle */}
              <div className="flex items-center gap-4 rounded-lg border p-4">
                <span className="text-sm font-medium">Item Type:</span>
                <div className="flex items-center gap-3">
                  <span className={isProduct ? "font-medium" : "text-muted-foreground"}>
                    Product
                  </span>
                  <Switch
                    checked={!isProduct}
                    onCheckedChange={(checked) => setIsProduct(!checked)}
                  />
                  <span className={!isProduct ? "font-medium" : "text-muted-foreground"}>
                    Service
                  </span>
                </div>
              </div>

              <Tabs defaultValue="pricing" className="w-full">
                <TabsList className="grid w-full grid-cols-2 h-12">
                  <TabsTrigger value="pricing" className="text-base">Pricing</TabsTrigger>
                  <TabsTrigger value="stock" className="text-base">Stock</TabsTrigger>
                </TabsList>

                <TabsContent value="pricing" className="space-y-6 pt-6">
                  {/* Basic Information */}
                  <div className="space-y-4 rounded-lg border p-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Basic Information</h3>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" className="gap-2" onClick={() => document.getElementById('item-image-upload')?.click()}>
                          <Plus className="h-4 w-4" />
                          <span>{itemImage ? itemImage : 'Add Item Image'}</span>
                        </Button>
                        <input
                          id="item-image-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleItemImageUpload}
                        />
                        {itemImage && (
                          <Button variant="ghost" size="icon" onClick={() => setItemImage("")}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid gap-6">
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <Label className="text-base">Item Name *</Label>
                          <Input
                            value={newItem.name}
                            onChange={(e) =>
                              setNewItem({ ...newItem, name: e.target.value })
                            }
                            placeholder="Enter item name"
                            className="mt-2 !h-11 w-full"
                          />
                        </div>
                        <div>
                          <Label className="text-base">Category</Label>
                          <Select
                            value={newItem.category}
                            onValueChange={(value) =>
                              setNewItem({ ...newItem, category: value || "" })
                            }
                          >
                            <SelectTrigger className="mt-2 !h-11 w-full">
                              <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                              {mockCategories.map((category) => (
                                <SelectItem key={category.id} value={category.name}>
                                  {category.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <Label className="text-base">Item Code</Label>
                          <div className="mt-2 flex gap-2">
                            <Input
                              value={newItem.code}
                              onChange={(e) =>
                                setNewItem({ ...newItem, code: e.target.value })
                              }
                              placeholder="Enter or generate code"
                              className="h-11 flex-1"
                            />
                            <Button variant="outline" className="h-11 px-6 shrink-0" onClick={() => {
                              const code = 'ITM' + Date.now().toString().slice(-8);
                              setNewItem({ ...newItem, code });
                            }}>Assign Code</Button>
                          </div>
                        </div>
                        <div>
                          <Label className="text-base">Unit of Measurement</Label>
                          <Select
                            value={newItem.unit}
                            onValueChange={(value) =>
                              setNewItem({ ...newItem, unit: value || "NONE" })
                            }
                          >
                            <SelectTrigger className="mt-2 !h-11 w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="NONE">NONE</SelectItem>
                              <SelectItem value="PCS">PCS (Pieces)</SelectItem>
                              <SelectItem value="KG">KG (Kilograms)</SelectItem>
                              <SelectItem value="LTR">LTR (Liters)</SelectItem>
                              <SelectItem value="BOX">BOX</SelectItem>
                              <SelectItem value="DOZEN">DOZEN</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Information */}
                  <div className="space-y-4 rounded-lg border p-6">
                    <h3 className="text-lg font-semibold">Pricing Information</h3>
                    <div className="grid gap-6 md:grid-cols-3">
                      <div>
                        <Label className="text-base">MRP (Maximum Retail Price)</Label>
                        <Input
                          type="number"
                          value={newItem.mrp}
                          onChange={(e) =>
                            setNewItem({ ...newItem, mrp: e.target.value })
                          }
                          placeholder="0.00"
                          className="mt-2 !h-11 w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-base">Sale Price</Label>
                        <Input
                          type="number"
                          value={newItem.salePrice}
                          onChange={(e) =>
                            setNewItem({
                              ...newItem,
                              salePrice: e.target.value,
                            })
                          }
                          placeholder="0.00"
                          className="mt-2 !h-11 w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-base">Purchase Price</Label>
                        <Input
                          type="number"
                          placeholder="0.00"
                          className="mt-2 !h-11 w-full"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Tax Information */}
                  <div className="space-y-4 rounded-lg border p-6">
                    <h3 className="text-lg font-semibold">Tax Information</h3>
                    <div className="grid gap-6 md:grid-cols-2">
                      <div>
                        <Label className="text-base">GST Rate (%)</Label>
                        <Select defaultValue="18">
                          <SelectTrigger className="mt-2 !h-11 w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">0% (Exempt)</SelectItem>
                            <SelectItem value="5">5%</SelectItem>
                            <SelectItem value="12">12%</SelectItem>
                            <SelectItem value="18">18%</SelectItem>
                            <SelectItem value="28">28%</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-base">HSN/SAC Code</Label>
                        <Input
                          placeholder="Enter HSN or SAC code"
                          className="mt-2 !h-11 w-full"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="stock" className="space-y-6 pt-6">
                  {/* Stock Information */}
                  <div className="space-y-4 rounded-lg border p-6">
                    <h3 className="text-lg font-semibold">Stock Information</h3>
                    <div className="grid gap-6 md:grid-cols-3">
                      <div>
                        <Label className="text-base">Opening Stock</Label>
                        <Input
                          type="number"
                          value={newItem.stock}
                          onChange={(e) =>
                            setNewItem({ ...newItem, stock: e.target.value })
                          }
                          placeholder="0"
                          className="mt-2 !h-11 w-full"
                        />
                        <p className="mt-1 text-sm text-muted-foreground">
                          Initial stock quantity
                        </p>
                      </div>
                      <div>
                        <Label className="text-base">Minimum Stock Level</Label>
                        <Input
                          type="number"
                          placeholder="0"
                          className="mt-2 !h-11 w-full"
                        />
                        <p className="mt-1 text-sm text-muted-foreground">
                          Alert when stock falls below this
                        </p>
                      </div>
                      <div>
                        <Label className="text-base">Location/Shelf</Label>
                        <Input
                          placeholder="e.g., Aisle 3, Shelf B"
                          className="mt-2 !h-11 w-full"
                        />
                        <p className="mt-1 text-sm text-muted-foreground">
                          Storage location
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div className="space-y-4 rounded-lg border p-6">
                    <h3 className="text-lg font-semibold">Additional Details</h3>
                    <div className="grid gap-6">
                      <div>
                        <Label className="text-base">Item Description</Label>
                        <Textarea
                          placeholder="Enter item description, specifications, or notes"
                          className="mt-2 min-h-[100px] w-full"
                        />
                      </div>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div>
                          <Label className="text-base">Brand/Manufacturer</Label>
                          <Input
                            placeholder="Enter brand name"
                            className="mt-2 !h-11 w-full"
                          />
                        </div>
                        <div>
                          <Label className="text-base">Barcode</Label>
                          <Input
                            placeholder="Enter barcode"
                            className="mt-2 !h-11 w-full"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 border-t pt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="h-11 px-6"
                >
                  Cancel
                </Button>
                <Button variant="outline" className="h-11 px-6" onClick={() => {
                  handleAddItem();
                  setNewItem({
                    name: "",
                    code: "",
                    category: "",
                    unit: "NONE",
                    mrp: "",
                    salePrice: "",
                    stock: "",
                  });
                }}>
                  Save & Add New
                </Button>
                <Button onClick={handleAddItem} className="h-11 px-6">
                  Save Item
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search Items" className="pl-10" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{items.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.filter((i) => i.type === "product").length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {items.filter((i) => i.type === "service").length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Items</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>MRP</TableHead>
                <TableHead>Sale Price</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.category}</TableCell>
                  <TableCell>{item.unit}</TableCell>
                  <TableCell>₹{item.mrp}</TableCell>
                  <TableCell>₹{item.salePrice}</TableCell>
                  <TableCell>{item.stock}</TableCell>
                  <TableCell className="capitalize">{item.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
