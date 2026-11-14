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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search } from "lucide-react";
import { mockParties, type Party } from "@/lib/data-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PartiesPage() {
  const [parties, setParties] = useState<Party[]>(mockParties);

  useEffect(() => {
    // Load parties from localStorage on mount
    const savedParties = localStorage.getItem('parties');
    if (savedParties) {
      setParties(JSON.parse(savedParties));
    }
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [shippingEnabled, setShippingEnabled] = useState(false);
  const [detailedAddressEnabled, setDetailedAddressEnabled] = useState(false);
  const [newParty, setNewParty] = useState({
    name: "",
    phone: "",
    email: "",
    openingBalance: "",
    creditLimit: "no-limit",
    billingAddress: "",
    shippingAddress: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const handleAddParty = () => {
    const party: Party = {
      id: Date.now().toString(),
      name: newParty.name,
      phone: newParty.phone,
      email: newParty.email,
      balance: parseFloat(newParty.openingBalance) || 0,
      type: "customer",
    };
    const updatedParties = [...parties, party];
    setParties(updatedParties);
    localStorage.setItem('parties', JSON.stringify(updatedParties));
    setIsDialogOpen(false);
    setNewParty({
      name: "",
      phone: "",
      email: "",
      openingBalance: "",
      creditLimit: "no-limit",
      billingAddress: "",
      shippingAddress: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    });
    setShippingEnabled(false);
    setDetailedAddressEnabled(false);
  };

  const totalReceivable = parties
    .filter((p) => p.balance > 0)
    .reduce((sum, p) => sum + p.balance, 0);

  const totalPayable = parties
    .filter((p) => p.balance < 0)
    .reduce((sum, p) => sum + Math.abs(p.balance), 0);

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Parties</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add Party</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="!max-w-[95vw] !w-[1000px] max-h-[95vh] overflow-y-auto">
            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-2xl">Add Party</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 p-6">
              {/* Party Name and Phone ABOVE tabs */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-base">Party Name *</Label>
                  <Input
                    value={newParty.name}
                    onChange={(e) =>
                      setNewParty({ ...newParty, name: e.target.value })
                    }
                    placeholder="Party Name"
                    className="mt-2 !h-11 w-full"
                  />
                </div>
                <div>
                  <Label className="text-base">Phone Number</Label>
                  <Input
                    value={newParty.phone}
                    onChange={(e) =>
                      setNewParty({ ...newParty, phone: e.target.value })
                    }
                    placeholder="Phone Number"
                    className="mt-2 !h-11 w-full"
                  />
                </div>
              </div>

              <div className="space-y-4">
              <Tabs defaultValue="address" className="w-full">
                <TabsList className="grid w-full grid-cols-3 h-12">
                  <TabsTrigger value="address" className="text-base">Address</TabsTrigger>
                  <TabsTrigger value="credit" className="text-base">
                    Credit & Balance
                    <span className="ml-2 rounded-sm bg-red-500 px-2 py-0.5 text-xs text-white">
                      New
                    </span>
                  </TabsTrigger>
                  <TabsTrigger value="additional" className="text-base">
                    Additional Fields
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="address" className="space-y-4 pt-6">
                  <div>
                    <Label className="text-base">Email ID</Label>
                    <Input
                      type="email"
                      value={newParty.email}
                      onChange={(e) =>
                        setNewParty({ ...newParty, email: e.target.value })
                      }
                      placeholder="Email ID"
                      className="mt-2 !h-11 w-full"
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-base">Billing Address</Label>
                      <Textarea
                        value={newParty.billingAddress}
                        onChange={(e) =>
                          setNewParty({
                            ...newParty,
                            billingAddress: e.target.value,
                          })
                        }
                        placeholder="Billing Address"
                        className="mt-2 min-h-[100px] w-full"
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-base">Shipping Address</Label>
                      {!shippingEnabled ? (
                        <Button
                          variant="link"
                          className="mt-2 h-auto p-0 text-blue-600"
                          onClick={() => setShippingEnabled(true)}
                        >
                          + Enable Shipping Address
                        </Button>
                      ) : (
                        <Textarea
                          value={newParty.shippingAddress}
                          onChange={(e) =>
                            setNewParty({
                              ...newParty,
                              shippingAddress: e.target.value,
                            })
                          }
                          placeholder="Shipping Address"
                          className="mt-2 min-h-[100px] w-full"
                          rows={3}
                        />
                      )}
                    </div>
                  </div>

                  <Button
                    variant="link"
                    className="h-auto p-0 text-blue-600"
                    onClick={() => setDetailedAddressEnabled(!detailedAddressEnabled)}
                  >
                    {detailedAddressEnabled ? 'Hide Detailed Address' : 'Show Detailed Address'}
                  </Button>

                  {detailedAddressEnabled && (
                    <div className="grid gap-4 md:grid-cols-2 pt-4">
                      <div>
                        <Label className="text-base">City</Label>
                        <Input
                          value={newParty.city}
                          onChange={(e) =>
                            setNewParty({ ...newParty, city: e.target.value })
                          }
                          placeholder="City"
                          className="mt-2 !h-11 w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-base">State</Label>
                        <Input
                          value={newParty.state}
                          onChange={(e) =>
                            setNewParty({ ...newParty, state: e.target.value })
                          }
                          placeholder="State"
                          className="mt-2 !h-11 w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-base">Pincode</Label>
                        <Input
                          value={newParty.pincode}
                          onChange={(e) =>
                            setNewParty({ ...newParty, pincode: e.target.value })
                          }
                          placeholder="Pincode"
                          className="mt-2 !h-11 w-full"
                        />
                      </div>
                      <div>
                        <Label className="text-base">Country</Label>
                        <Input
                          value={newParty.country}
                          onChange={(e) =>
                            setNewParty({ ...newParty, country: e.target.value })
                          }
                          placeholder="Country"
                          className="mt-2 !h-11 w-full"
                        />
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="credit" className="space-y-4 pt-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-base">Opening Balance</Label>
                      <Input
                        type="number"
                        value={newParty.openingBalance}
                        onChange={(e) =>
                          setNewParty({
                            ...newParty,
                            openingBalance: e.target.value,
                          })
                        }
                        placeholder="Opening Balance"
                        className="mt-2 !h-11 w-full"
                      />
                    </div>
                    <div>
                      <Label className="text-base">As Of Date</Label>
                      <Input
                        type="date"
                        placeholder="As Of Date"
                        className="mt-2 !h-11 w-full"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-base mb-2 block">Credit Limit</Label>
                    <div className="flex items-center gap-4">
                      <span>No Limit</span>
                      <Switch />
                      <span>Custom Limit</span>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="additional" className="space-y-3 pt-6">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Checkbox id={`field-${i}`} />
                      <Input
                        placeholder={`Additional Field ${i} Name`}
                        className="!h-11 w-full"
                      />
                    </div>
                  ))}
                </TabsContent>
              </Tabs>
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
                <Button variant="outline" className="h-11 px-6" onClick={() => {
                  handleAddParty();
                  setNewParty({
                    name: "",
                    phone: "",
                    email: "",
                    openingBalance: "",
                    creditLimit: "no-limit",
                    billingAddress: "",
                    shippingAddress: "",
                    city: "",
                    state: "",
                    pincode: "",
                    country: "India",
                  });
                  setShippingEnabled(false);
                  setDetailedAddressEnabled(false);
                }}>
                  Save & Add New
                </Button>
                <Button onClick={handleAddParty} className="h-11 px-6">
                  Save Party
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Search Parties" className="pl-10" />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Total Receivable
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {totalReceivable.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {parties.filter((p) => p.balance > 0).length} Parties
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Payable</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹ {totalPayable.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              From {parties.filter((p) => p.balance < 0).length} Parties
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Parties Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Parties</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Type</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parties.map((party) => (
                <TableRow key={party.id}>
                  <TableCell className="font-medium">{party.name}</TableCell>
                  <TableCell>{party.phone}</TableCell>
                  <TableCell>{party.email}</TableCell>
                  <TableCell>
                    <span
                      className={
                        party.balance >= 0 ? "text-green-600" : "text-red-600"
                      }
                    >
                      ₹ {Math.abs(party.balance).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell className="capitalize">{party.type}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
