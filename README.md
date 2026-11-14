# Vyapaar - Business Management Application

A comprehensive business management system built with Next.js 16, TypeScript, and shadcn/ui components.

## 🚀 Live Repository

**GitHub:** https://github.com/kmr-varun/vyapaar-frontend

## ✨ Features

### 📊 Dashboard
- Sales & purchase summary cards
- WhatsApp & Google integration toggles
- Quick action buttons (Add Sale, Add Purchase)
- Most used reports shortcuts

### 💰 Sales Management
- Create and manage sales invoices
- Customer selection with auto-fill phone
- Line items table (Item, Flavour, Exp, Mfg Date, MRP, Qty, Unit, Price, Amount)
- Auto-calculation of totals
- Credit/Cash sale toggle
- Table view of all saved sales with delete option

### 🛒 Purchase Management
- Supplier-based purchase entry
- Invoice number tracking
- Line item management
- Table view of all purchases

### 👥 Parties Management
- Add customers and suppliers
- Balance tracking (Receivables & Payables)
- Detailed forms with 3 tabs
- Shipping address toggle
- Summary cards

### 📦 Items Catalog
- Product and service management
- Categories and units
- Pricing (MRP, Sale Price, Purchase Price)
- Stock tracking
- Item codes (auto-generate)
- Image upload

### 📈 Reports
- Sales report
- Purchase report
- Total sales vs purchases
- Profit/loss calculations

### 💵 Cash & Bank
- Account management (Cash/Bank)
- Transaction tracking
- Balance summaries

### 🔄 Sync & Backup
- Sync status
- Connected devices
- Backup/restore UI

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript  
- **Styling:** Tailwind CSS 4
- **UI:** shadcn/ui (base-nova theme)
- **Icons:** lucide-react
- **Dates:** date-fns
- **PDF:** jsPDF
- **Package Manager:** bun

## 📦 Installation

```bash
# Clone repository
git clone https://github.com/kmr-varun/vyapaar-frontend.git
cd vyapaar-frontend

# Install dependencies
bun install

# Development server
bun run dev

# Build for production
bun run build
```

## 🌐 Access

Open [http://localhost:3000](http://localhost:3000)

## 📱 Pages

- `/` - Dashboard
- `/sale` - Sales
- `/purchase` - Purchases
- `/parties` - Customers & Suppliers
- `/items` - Item Catalog
- `/reports` - Reports
- `/cash-bank` - Accounts
- `/sync` - Sync & Backup

## 💾 Data Storage

Uses **localStorage** (demo):
- `sales`, `purchases`, `parties`, `items`
- `whatsappConnected`, `googleConnected`

## ✅ Build Status

```
✓ Compiled successfully
✓ TypeScript: 0 errors
✓ 11 pages generated
✓ All static pages prerendered
```

## 🔑 Key Features

- ✅ Auto-population (customer→phone, item→prices)
- ✅ Real-time calculations
- ✅ localStorage persistence
- ✅ Responsive design
- ✅ Type-safe TypeScript
- ✅ Dialog-based forms
- ✅ Table data views

## 📝 Future Enhancements

- Backend API integration
- Authentication
- Real WhatsApp/Google integration
- PDF invoice generation
- Advanced filtering
- Multi-currency
- Export to Excel
- Charts & graphs

---

Built with ❤️ using Next.js and shadcn/ui
