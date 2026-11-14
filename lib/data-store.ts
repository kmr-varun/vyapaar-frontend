// Shared data store for the application
// In production, this would be replaced with API calls

export interface Party {
  id: string;
  name: string;
  phone: string;
  email: string;
  balance: number;
  type: "customer" | "supplier";
}

export interface Item {
  id: string;
  name: string;
  code: string;
  category: string;
  unit: string;
  mrp: number;
  salePrice: number;
  stock: number;
  type: "product" | "service";
  flavours?: string[];
}

export interface Transport {
  id: string;
  name: string;
}

export interface Category {
  id: string;
  name: string;
}

// Mock data
export const mockParties: Party[] = [
  {
    id: "1",
    name: "ABC Corporation",
    phone: "9876543210",
    email: "abc@example.com",
    balance: 50000,
    type: "customer",
  },
  {
    id: "2",
    name: "XYZ Suppliers",
    phone: "9876543211",
    email: "xyz@example.com",
    balance: -20000,
    type: "supplier",
  },
  {
    id: "3",
    name: "Raj Traders",
    phone: "9876543212",
    email: "raj@example.com",
    balance: 25000,
    type: "customer",
  },
  {
    id: "4",
    name: "Global Wholesale Ltd",
    phone: "9876543213",
    email: "global@example.com",
    balance: -15000,
    type: "supplier",
  },
  {
    id: "5",
    name: "Prime Distributors",
    phone: "9876543214",
    email: "prime@example.com",
    balance: -30000,
    type: "supplier",
  },
  {
    id: "6",
    name: "Metro Enterprises",
    phone: "9876543215",
    email: "metro@example.com",
    balance: 35000,
    type: "customer",
  },
];

export const mockItems: Item[] = [
  {
    id: "1",
    name: "1 UP NUTRITION WHEY 2KG",
    code: "38446968932",
    category: "Supplements",
    unit: "PCS",
    mrp: 3500,
    salePrice: 3200,
    stock: 8,
    type: "product",
    flavours: ["Chocolate", "Vanilla", "Strawberry"],
  },
  {
    id: "2",
    name: "ON Gold Standard Whey 5LB",
    code: "38446968933",
    category: "Supplements",
    unit: "PCS",
    mrp: 5500,
    salePrice: 5200,
    stock: 12,
    type: "product",
    flavours: ["Double Rich Chocolate", "Vanilla Ice Cream", "Extreme Milk Chocolate"],
  },
  {
    id: "3",
    name: "Creatine Monohydrate 300g",
    code: "38446968934",
    category: "Supplements",
    unit: "PCS",
    mrp: 1200,
    salePrice: 1100,
    stock: 20,
    type: "product",
  },
];

export const mockTransports: Transport[] = [
  { id: "1", name: "Delhivery" },
  { id: "2", name: "Blue Dart" },
  { id: "3", name: "DTDC" },
  { id: "4", name: "India Post" },
  { id: "5", name: "Self Pickup" },
];

export const mockCategories: Category[] = [
  { id: "1", name: "Supplements" },
  { id: "2", name: "Groceries" },
  { id: "3", name: "Electronics" },
  { id: "4", name: "Clothing" },
  { id: "5", name: "Books" },
];
