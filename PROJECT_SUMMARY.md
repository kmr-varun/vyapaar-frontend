# Vyapaar Business Management Application

## ✅ What's Implemented

### Pages & Features

1. **Dashboard (/)** 
   - Total Receivable/Payable summary cards
   - Sales graph with time filter
   - Quick access to reports
   - Search transactions
   - Add Sale/Purchase buttons

2. **Sales Invoice (/sale)**
   - Credit/Cash toggle
   - Customer selection
   - Invoice date picker
   - Line items table with:
     - Item, Flavour, EXP, MFG Date, MRP, QTY, Unit, Price/Unit, Amount
   - Add/Remove rows dynamically
   - Transport details
   - Terms & Conditions
   - Shipping charges
   - Round off toggle
   - **PDF Generation** - Click "Print" to download invoice as PDF
   - Total calculation

3. **Parties Management (/parties)**
   - Add new parties (customers/suppliers)
   - Tabbed interface:
     - Address tab
     - Credit & Balance tab (with NEW badge)
     - Additional Fields tab
   - Opening balance
   - Credit limit (No Limit/Custom)
   - Billing & Shipping addresses
   - Parties table with balance display
   - Summary cards

4. **Items Management (/items)**
   - Product/Service toggle
   - Add new items
   - Tabbed interface:
     - Pricing tab
     - Stock tab
   - Item details: Name, Code, Category, Unit
   - MRP and Sale Price
   - Opening stock
   - Items table

5. **Sidebar Navigation**
   - Home, Parties, Items, Sale, Purchase & Expense
   - Grow Your Business, Cash & Bank, Reports
   - Sync, Share & Backup
   - "Open Anything (Ctrl+F)" button

### Technologies Used

- **Next.js 16** with App Router
- **TypeScript**
- **Tailwind CSS 4**
- **shadcn/ui components** (NO custom styling)
- **Lucide React** for icons
- **jsPDF** for PDF generation
- **date-fns** for date handling
- **Bun** as package manager

## 🚀 Running the Application

The dev server is already running at:
- **Local**: http://localhost:3000
- **Network**: http://192.168.31.247:3000

To start it manually:
```bash
bun run dev
```

To build for production:
```bash
bun run build
bun run start
```

## 📁 Project Structure

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout with sidebar
│   ├── page.tsx            # Dashboard
│   ├── sale/page.tsx       # Sales invoice
│   ├── parties/page.tsx    # Party management
│   ├── items/page.tsx      # Items management
│   ├── purchase/page.tsx   # Placeholder
│   └── reports/page.tsx    # Placeholder
├── components/
│   ├── sidebar.tsx         # Main navigation
│   └── ui/                 # shadcn components
└── lib/
    └── utils.ts            # Utility functions
```

## ✨ Key Features

### PDF Generation
The sale invoice page has a working PDF generator. When you click "Print", it creates a PDF with:
- Invoice header
- Invoice date and sale type
- Line items table
- Total amount

### Dynamic Forms
- Add/remove line items in invoice
- Real-time total calculation
- Unit selection (NONE, KG, PCS, LTR)
- Auto-calculate amount from qty × price

### Data Management
All data is currently stored in component state (mock data). For production:
- Add backend API integration
- Use database (PostgreSQL/MongoDB)
- Add authentication
- Implement real-time sync

## 🎨 Design System

Using **shadcn/ui base-nova theme** with:
- Neutral base color
- Default styling (no customization)
- Responsive layouts
- Consistent spacing and typography

## 📝 Notes

- All styling uses default shadcn components
- No custom colors or theme modifications
- Fully functional UI ready for demo
- PDF generation works out of the box
- Mobile responsive design
- Type-safe with TypeScript

## 🔜 Next Steps (for full production)

1. Add backend API
2. Database integration
3. User authentication
4. Real-time data sync
5. Advanced reporting
6. Multi-currency support
7. Tax calculations (GST)
8. Email/WhatsApp integration
9. Inventory tracking
10. Godown management (warehouse)
