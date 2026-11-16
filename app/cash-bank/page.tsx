"use client";

import { useState } from "react";
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
import { Plus, Wallet, CreditCard, Building, ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Account {
  id: string;
  name: string;
  type: "cash" | "bank";
  balance: number;
  accountNumber?: string;
  bankName?: string;
}

interface Transaction {
  id: string;
  date: string;
  type: "in" | "out";
  amount: number;
  account: string;
  category: string;
  description: string;
}

export default function CashBankPage() {
  const [accounts, setAccounts] = useState<Account[]>([
    { id: "1", name: "Cash in Hand", type: "cash", balance: 50000 },
    { id: "2", name: "HDFC Bank", type: "bank", balance: 250000, accountNumber: "XXXX1234", bankName: "HDFC Bank" },
  ]);

  const [transactions, setTransactions] = useState<Transaction[]>([
    { id: "1", date: "2024-11-14T10:00:00.000Z", type: "in", amount: 10000, account: "Cash in Hand", category: "Sales", description: "Customer payment" },
    { id: "2", date: "2024-11-14T11:00:00.000Z", type: "out", amount: 5000, account: "HDFC Bank", category: "Purchase", description: "Supplier payment" },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<"account" | "transaction">("account");
  const [newAccount, setNewAccount] = useState({
    name: "",
    type: "cash" as "cash" | "bank",
    balance: "",
    accountNumber: "",
    bankName: "",
  });

  const [newTransaction, setNewTransaction] = useState({
    type: "in" as "in" | "out",
    amount: "",
    account: "",
    category: "",
    description: "",
  });

  const totalCash = accounts
    .filter((a) => a.type === "cash")
    .reduce((sum, a) => sum + a.balance, 0);

  const totalBank = accounts
    .filter((a) => a.type === "bank")
    .reduce((sum, a) => sum + a.balance, 0);

  const totalBalance = totalCash + totalBank;

  const handleAddAccount = () => {
    const account: Account = {
      id: Date.now().toString(),
      name: newAccount.name,
      type: newAccount.type,
      balance: parseFloat(newAccount.balance) || 0,
      accountNumber: newAccount.accountNumber || undefined,
      bankName: newAccount.bankName || undefined,
    };
    setAccounts([...accounts, account]);
    setIsDialogOpen(false);
    setNewAccount({
      name: "",
      type: "cash",
      balance: "",
      accountNumber: "",
      bankName: "",
    });
  };

  const handleAddTransaction = () => {
    const transaction: Transaction = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      type: newTransaction.type,
      amount: parseFloat(newTransaction.amount) || 0,
      account: newTransaction.account,
      category: newTransaction.category,
      description: newTransaction.description,
    };

    // Update account balance
    const accountIndex = accounts.findIndex(a => a.name === newTransaction.account);
    if (accountIndex !== -1) {
      const updatedAccounts = [...accounts];
      if (newTransaction.type === "in") {
        updatedAccounts[accountIndex].balance += transaction.amount;
      } else {
        updatedAccounts[accountIndex].balance -= transaction.amount;
      }
      setAccounts(updatedAccounts);
    }

    setTransactions([transaction, ...transactions]);
    setIsDialogOpen(false);
    setNewTransaction({
      type: "in",
      amount: "",
      account: "",
      category: "",
      description: "",
    });
  };

  const openDialog = (type: "account" | "transaction") => {
    setDialogType(type);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cash & Bank</h1>
        <div className="flex gap-2">
          <Button className="gap-2" onClick={() => openDialog("account")}>
            <Plus className="h-4 w-4" />
            <span>Add Account</span>
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => openDialog("transaction")}>
            <Plus className="h-4 w-4" />
            <span>Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBalance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {accounts.length} accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash in Hand</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalCash.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {accounts.filter((a) => a.type === "cash").length} cash accounts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Balance</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalBank.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {accounts.filter((a) => a.type === "bank").length} bank accounts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Account Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="text-right">Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accounts.map((account) => (
                <TableRow key={account.id}>
                  <TableCell className="font-medium">{account.name}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      account.type === "cash"
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {account.type === "cash" ? <Wallet className="h-3 w-3" /> : <Building className="h-3 w-3" />}
                      {account.type === "cash" ? "Cash" : "Bank"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {account.type === "bank" && account.bankName && (
                      <div className="text-sm text-muted-foreground">
                        {account.bankName} - {account.accountNumber}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₹{account.balance.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Account</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold ${
                      transaction.type === "in"
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type === "in" ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
                      {transaction.type === "in" ? "Money In" : "Money Out"}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.account}</TableCell>
                  <TableCell>{transaction.category}</TableCell>
                  <TableCell>{transaction.description}</TableCell>
                  <TableCell className={`text-right font-medium ${
                    transaction.type === "in" ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === "in" ? '+' : '-'}₹{transaction.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Account/Transaction Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === "account" ? "Add Account" : "Add Transaction"}
            </DialogTitle>
          </DialogHeader>
          {dialogType === "account" ? (
            <div className="space-y-4">
              <div>
                <Label>Account Name *</Label>
                <Input
                  value={newAccount.name}
                  onChange={(e) => setNewAccount({ ...newAccount, name: e.target.value })}
                  placeholder="e.g., Petty Cash"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Account Type *</Label>
                <Select value={newAccount.type} onValueChange={(val) => setNewAccount({ ...newAccount, type: val as "cash" | "bank" })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue>{(val: string) => val === 'cash' ? 'Cash' : val === 'bank' ? 'Bank' : val}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {newAccount.type === "bank" && (
                <>
                  <div>
                    <Label>Bank Name</Label>
                    <Input
                      value={newAccount.bankName}
                      onChange={(e) => setNewAccount({ ...newAccount, bankName: e.target.value })}
                      placeholder="e.g., HDFC Bank"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label>Account Number</Label>
                    <Input
                      value={newAccount.accountNumber}
                      onChange={(e) => setNewAccount({ ...newAccount, accountNumber: e.target.value })}
                      placeholder="e.g., XXXX1234"
                      className="mt-2"
                    />
                  </div>
                </>
              )}
              <div>
                <Label>Opening Balance</Label>
                <Input
                  type="number"
                  value={newAccount.balance}
                  onChange={(e) => setNewAccount({ ...newAccount, balance: e.target.value })}
                  placeholder="0"
                  className="mt-2"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddAccount}>Add Account</Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label>Transaction Type *</Label>
                <Select value={newTransaction.type} onValueChange={(val) => setNewTransaction({ ...newTransaction, type: val as "in" | "out" })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue>{(val: string) => val === 'in' ? 'Money In' : val === 'out' ? 'Money Out' : val}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Money In</SelectItem>
                    <SelectItem value="out">Money Out</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Account *</Label>
                <Select value={newTransaction.account} onValueChange={(val) => setNewTransaction({ ...newTransaction, account: val || "" })}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((account) => (
                      <SelectItem key={account.id} value={account.name}>
                        {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={newTransaction.amount}
                  onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                  placeholder="0"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Category</Label>
                <Input
                  value={newTransaction.category}
                  onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
                  placeholder="e.g., Sales, Purchase, Expense"
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={newTransaction.description}
                  onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })}
                  placeholder="Add notes..."
                  className="mt-2"
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddTransaction}>Add Transaction</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
