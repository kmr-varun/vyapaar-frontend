import type {
  User, Brand, Product, Variant, Vendor, VendorPriceRule, Client,
  Unit, Floor, Rack, Bin, Lot, StockBalance, OpenedCarton,
  Purchase, GRN, StockTransfer, StockAdjustment,
  Order, Estimate, EstimateLine, Payment, CreditApproval,
  PickList, CartonOpenRequest, RemainingDeclaration, Package, Delivery,
  WhatsAppMessage, Notification, AuditLog, AppSettings, StockLedger,
  CatalogLink, Enquiry,
} from '../types'

// ==================== USERS ====================
export const mockUsers: User[] = [
  { id: 'u1', userCode: 'ADMIN01', name: 'Jay Mehta', mobile: '9876543210', role: 'admin', unitId: 'unit1', floorIds: [], status: 'active', mustChangePassword: false, createdAt: '2026-11-02T09:00:00Z', createdBy: 'system' },
  { id: 'u2', userCode: 'SADM01', name: 'Raj Sharma', mobile: '9876543211', role: 'sub-admin', unitId: 'unit1', floorIds: [], status: 'active', mustChangePassword: false, revisePricePermission: true, createdAt: '2026-11-02T09:00:00Z', createdBy: 'u1' },
  { id: 'u3', userCode: 'FLMGR01', name: 'Suresh Kumar', mobile: '9876543212', role: 'floor-manager', unitId: 'unit1', floorIds: ['fl1', 'fl2'], status: 'active', mustChangePassword: false, createdAt: '2026-11-02T09:00:00Z', createdBy: 'u1' },
  { id: 'u4', userCode: 'DLMGR01', name: 'Priya Singh', mobile: '9876543213', role: 'delivery-manager', unitId: 'unit1', floorIds: [], status: 'active', mustChangePassword: false, createdAt: '2026-11-02T09:00:00Z', createdBy: 'u1' },
  { id: 'u5', userCode: 'RIDER01', name: 'Ravi Verma', mobile: '9876543214', role: 'delivery-team', unitId: 'unit1', floorIds: [], status: 'active', mustChangePassword: false, createdAt: '2026-11-02T09:00:00Z', createdBy: 'u4' },
  { id: 'u6', userCode: 'ACCT01', name: 'Meena Patel', mobile: '9876543215', role: 'accountant', unitId: 'unit1', floorIds: [], status: 'active', mustChangePassword: false, createdAt: '2026-11-02T09:00:00Z', createdBy: 'u1' },
  { id: 'u7', userCode: 'FLMGR02', name: 'Anil Gupta', mobile: '9876543216', role: 'floor-manager', unitId: 'unit2', floorIds: ['fl3'], status: 'active', mustChangePassword: false, createdAt: '2026-11-03T09:00:00Z', createdBy: 'u1' },
]

// ==================== BRANDS ====================
export const mockBrands: Brand[] = [
  { id: 'br1', name: 'Optimum Nutrition', slug: 'optimum-nutrition', logoUrl: undefined, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'br2', name: 'MuscleBlaze', slug: 'muscleblaze', logoUrl: undefined, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'br3', name: 'GNC', slug: 'gnc', logoUrl: undefined, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'br4', name: 'Avatar Nutrition', slug: 'avatar-nutrition', logoUrl: undefined, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'br5', name: 'MyProtein', slug: 'myprotein', logoUrl: undefined, active: true, createdAt: '2026-11-02T09:00:00Z' },
]

// ==================== PRODUCTS ====================
export const mockProducts: Product[] = [
  { id: 'p1', brandId: 'br1', name: 'Gold Standard 100% Whey', slug: 'gold-standard-100-whey', category: 'whey', description: 'The world\'s best-selling whey protein powder.', hsnCode: '21069099', gstRate: 18, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'p2', brandId: 'br1', name: 'Gold Standard 100% Isolate', slug: 'gold-standard-isolate', category: 'isolate', description: 'Ultra-filtered whey protein isolate.', hsnCode: '21069099', gstRate: 18, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'p3', brandId: 'br2', name: 'Biozyme Performance Whey', slug: 'biozyme-performance-whey', category: 'whey', description: 'Enhanced absorption with DigeZyme®.', hsnCode: '21069099', gstRate: 18, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'p4', brandId: 'br2', name: 'Super Gainer XXL', slug: 'super-gainer-xxl', category: 'gainer', description: 'High-calorie mass gainer for hard gainers.', hsnCode: '21069099', gstRate: 18, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'p5', brandId: 'br4', name: 'ISO Pure', slug: 'iso-pure', category: 'isolate', description: 'Zero carb whey protein isolate.', hsnCode: '21069099', gstRate: 18, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'p6', brandId: 'br3', name: 'Triple Strength Fish Oil', slug: 'triple-strength-fish-oil', category: 'vitamins', description: 'Omega-3 fish oil supplement.', hsnCode: '15041000', gstRate: 12, active: true, createdAt: '2026-11-02T09:00:00Z' },
]

// ==================== VARIANTS ====================
export const mockVariants: Variant[] = [
  { id: 'v1', productId: 'p1', flavour: 'Double Rich Chocolate', packSize: 2, packUnit: 'lb', mrp: 2799, skuCode: 'ON-GSW-DRC', unitsPerCarton: 12, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'v2', productId: 'p1', flavour: 'Double Rich Chocolate', packSize: 5, packUnit: 'lb', mrp: 5999, skuCode: 'ON-GSW-DRC-5', unitsPerCarton: 6, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'v3', productId: 'p1', flavour: 'Vanilla Ice Cream', packSize: 5, packUnit: 'lb', mrp: 5999, skuCode: 'ON-GSW-VIC', unitsPerCarton: 6, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'v4', productId: 'p2', flavour: 'Chocolate Bliss', packSize: 1.6, packUnit: 'lb', mrp: 3299, skuCode: 'ON-GSI-CHB', unitsPerCarton: 12, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'v5', productId: 'p3', flavour: 'Rich Chocolate', packSize: 1, packUnit: 'kg', mrp: 2699, skuCode: 'MB-BPW-RC', unitsPerCarton: 12, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'v6', productId: 'p3', flavour: 'Cookies & Cream', packSize: 2, packUnit: 'kg', mrp: 4799, skuCode: 'MB-BPW-CC', unitsPerCarton: 6, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'v7', productId: 'p4', flavour: 'Chocolate', packSize: 3, packUnit: 'kg', mrp: 1999, skuCode: 'MB-SGX-CHO', unitsPerCarton: 6, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'v8', productId: 'p5', flavour: 'Chocolate', packSize: 5, packUnit: 'lb', mrp: 6499, skuCode: 'AV-ISO-CHO', unitsPerCarton: 6, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'v9', productId: 'p5', flavour: 'Strawberry', packSize: 5, packUnit: 'lb', mrp: 6499, skuCode: 'AV-ISO-STR', unitsPerCarton: 6, active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'v10', productId: 'p6', flavour: 'Unflavoured', packSize: 90, packUnit: 'servings', mrp: 1299, skuCode: 'GNC-TFO-UNF', unitsPerCarton: 24, active: true, createdAt: '2026-11-02T09:00:00Z' },
]

// ==================== VENDORS ====================
export const mockVendors: Vendor[] = [
  { id: 'vnd1', name: 'Nutritech Distributors', gstin: '27AABCN1234F1Z5', contactName: 'Kapil Narayan', mobile: '9900112233', email: 'kapil@nutritech.in', address: 'Plot 14, MIDC, Pune 411019', paymentTerms: 'Net 30', active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'vnd2', name: 'HealthSupply Co.', gstin: '07AABCH5678G1Z2', contactName: 'Sunita Rao', mobile: '9900112244', email: 'sunita@healthsupply.in', address: '23 Nehru Place, New Delhi 110019', paymentTerms: 'Net 15', active: true, createdAt: '2026-11-02T09:00:00Z' },
  { id: 'vnd3', name: 'FitnessPro Wholesale', gstin: '29AABCF9012H1Z9', contactName: 'Rajan Iyer', mobile: '9900112255', address: '45 Rajaji Nagar, Bangalore 560010', paymentTerms: 'Advance', active: true, createdAt: '2026-11-02T09:00:00Z' },
]

// ==================== VENDOR PRICE RULES ====================
export const mockVendorPriceRules: VendorPriceRule[] = [
  { id: 'vpr1', vendorId: 'vnd1', variantId: 'v2', pricePerPack: 4200, minCartons: 2, paymentMode: 'bank', validFrom: '2026-11-01', validTo: '2026-12-31', active: true },
  { id: 'vpr2', vendorId: 'vnd1', variantId: 'v3', pricePerPack: 4200, validFrom: '2026-11-01', validTo: '2026-12-31', active: true },
  { id: 'vpr3', vendorId: 'vnd2', variantId: 'v5', pricePerPack: 1900, minCartons: 4, validFrom: '2026-11-01', validTo: '2026-12-31', active: true },
  { id: 'vpr4', vendorId: 'vnd3', variantId: 'v8', pricePerPack: 4600, validFrom: '2026-11-01', validTo: '2026-12-31', active: true },
]

// ==================== CLIENTS ====================
export const mockClients: Client[] = [
  { id: 'cl1', businessName: 'FitLife Store', contactName: 'Abhishek Jain', mobile: '9811234567', gstin: '07AABCF1234A1Z1', billingAddress: '12 Lajpat Nagar, Delhi 110024', creditLimit: 100000, creditDays: 30, active: true, createdAt: '2026-11-03T09:00:00Z', source: 'manual' },
  { id: 'cl2', businessName: 'MuscleMart', contactName: 'Deepak Nair', mobile: '9922334455', billingAddress: '78 MG Road, Kochi 682016', creditLimit: 50000, creditDays: 15, active: true, createdAt: '2026-11-04T09:00:00Z', source: 'catalog' },
  { id: 'cl3', businessName: 'ProSports Nutrition', contactName: 'Anjali Verma', mobile: '9833445566', gstin: '27AABCP5678B1Z3', billingAddress: '5 Andheri West, Mumbai 400053', creditLimit: 200000, creditDays: 45, active: true, createdAt: '2026-11-05T09:00:00Z', source: 'manual' },
  { id: 'cl4', businessName: 'Gym Zone', contactName: 'Vikram Reddy', mobile: '9966778899', billingAddress: '34 Jubilee Hills, Hyderabad 500033', creditLimit: 75000, creditDays: 30, active: true, createdAt: '2026-11-06T09:00:00Z', source: 'catalog' },
  { id: 'cl5', businessName: 'Wellness World', contactName: 'Pooja Desai', mobile: '9977889900', billingAddress: '15 C.G. Road, Ahmedabad 380009', creditLimit: 150000, creditDays: 30, active: true, createdAt: '2026-11-07T09:00:00Z', source: 'manual' },
  { id: 'cl6', businessName: 'NutriStop (Closed)', contactName: 'Rajan Mehta', mobile: '9988001122', billingAddress: '22 Brigade Road, Bangalore 560025', creditLimit: 0, creditDays: 0, active: false, createdAt: '2026-09-01T09:00:00Z', source: 'manual' },
]

// ==================== WAREHOUSE ====================
export const mockUnits: Unit[] = [
  { id: 'unit1', name: 'Unit 1 - Andheri', address: 'Plot 5, MIDC Andheri East, Mumbai 400093', gstin: '27AABCR1234C1Z4', active: true },
  { id: 'unit2', name: 'Unit 2 - Bhiwandi', address: 'Sector 7, Bhiwandi Warehousing Complex, Bhiwandi 421302', gstin: '27AABCR1234C1Z5', active: true },
]

export const mockFloors: Floor[] = [
  { id: 'fl1', unitId: 'unit1', name: 'Floor 1', code: 'U1-F1', primaryFloorManagerId: 'u3', active: true },
  { id: 'fl2', unitId: 'unit1', name: 'Floor 2', code: 'U1-F2', active: true },
  { id: 'fl3', unitId: 'unit2', name: 'Floor 1', code: 'U2-F1', primaryFloorManagerId: 'u7', active: true },
]

export const mockRacks: Rack[] = [
  { id: 'r1', floorId: 'fl1', name: 'Row A', code: 'U1-F1-R01', active: true },
  { id: 'r2', floorId: 'fl1', name: 'Row B', code: 'U1-F1-R02', active: true },
  { id: 'r3', floorId: 'fl2', name: 'Row A', code: 'U1-F2-R01', active: true },
  { id: 'r4', floorId: 'fl3', name: 'Row A', code: 'U2-F1-R01', active: true },
  { id: 'r5', floorId: 'fl3', name: 'Row B', code: 'U2-F1-R02', active: true },
]

export const mockBins: Bin[] = [
  { id: 'b1', rackId: 'r1', name: 'Shelf 1', code: 'U1-F1-R01-B01', active: true },
  { id: 'b2', rackId: 'r1', name: 'Shelf 2', code: 'U1-F1-R01-B02', active: true },
  { id: 'b3', rackId: 'r1', name: 'Shelf 3', code: 'U1-F1-R01-B03', active: true },
  { id: 'b4', rackId: 'r2', name: 'Shelf 1', code: 'U1-F1-R02-B01', active: true },
  { id: 'b5', rackId: 'r2', name: 'Shelf 2', code: 'U1-F1-R02-B02', active: true },
  { id: 'b6', rackId: 'r3', name: 'Shelf 1', code: 'U1-F2-R01-B01', active: true },
  { id: 'b7', rackId: 'r3', name: 'Shelf 2', code: 'U1-F2-R01-B02', active: true },
  { id: 'b8', rackId: 'r4', name: 'Shelf 1', code: 'U2-F1-R01-B01', active: true },
  { id: 'b9', rackId: 'r5', name: 'Shelf 1', code: 'U2-F1-R02-B01', active: true },
]

// ==================== INVENTORY ====================
export const mockLots: Lot[] = [
  { id: 'lot1', variantId: 'v2', batch: 'B2026-ON-01', expiry: '2027-06-30' },
  { id: 'lot2', variantId: 'v3', batch: 'B2026-ON-02', expiry: '2027-08-31' },
  { id: 'lot3', variantId: 'v5', batch: 'B2026-MB-01', expiry: '2027-05-31' },
  { id: 'lot4', variantId: 'v8', batch: 'B2026-AV-01', expiry: '2027-07-31' },
  { id: 'lot5', variantId: 'v1', batch: 'B2026-ON-03', expiry: '2027-04-30' },
  { id: 'lot6', variantId: 'v6', batch: 'B2026-MB-02', expiry: '2027-09-30' },
]

export const mockStockBalances: StockBalance[] = [
  { variantId: 'v2', lotId: 'lot1', binId: 'b1', sealedPacks: 24, loosePacks: 0, reservedPacks: 6 },
  { variantId: 'v2', lotId: 'lot1', binId: 'b2', sealedPacks: 12, loosePacks: 3, reservedPacks: 0 },
  { variantId: 'v3', lotId: 'lot2', binId: 'b3', sealedPacks: 18, loosePacks: 0, reservedPacks: 0 },
  { variantId: 'v5', lotId: 'lot3', binId: 'b4', sealedPacks: 48, loosePacks: 0, reservedPacks: 12 },
  { variantId: 'v5', lotId: 'lot3', binId: 'b5', sealedPacks: 24, loosePacks: 5, reservedPacks: 0 },
  { variantId: 'v8', lotId: 'lot4', binId: 'b6', sealedPacks: 12, loosePacks: 0, reservedPacks: 6 },
  { variantId: 'v1', lotId: 'lot5', binId: 'b7', sealedPacks: 36, loosePacks: 2, reservedPacks: 0 },
  { variantId: 'v6', lotId: 'lot6', binId: 'b8', sealedPacks: 12, loosePacks: 0, reservedPacks: 0 },
]

export const mockOpenedCartons: OpenedCarton[] = [
  { id: 'oc1', variantId: 'v2', lotId: 'lot1', binId: 'b2', openedBy: 'u3', approvedBy: 'u2', packsRemaining: 3, status: 'open', openedAt: '2026-11-14T10:00:00Z' },
]

export const mockStockLedger: StockLedger[] = [
  { id: 'sl1', variantId: 'v2', lotId: 'lot1', binId: 'b1', qtyPacks: 24, sealedOrLoose: 'sealed', entryType: 'GRN_IN', refType: 'grn', refId: 'grn1', userId: 'u3', createdAt: '2026-11-05T10:00:00Z' },
  { id: 'sl2', variantId: 'v2', lotId: 'lot1', binId: 'b2', qtyPacks: 15, sealedOrLoose: 'sealed', entryType: 'GRN_IN', refType: 'grn', refId: 'grn1', userId: 'u3', createdAt: '2026-11-05T10:00:00Z' },
  { id: 'sl3', variantId: 'v5', lotId: 'lot3', binId: 'b4', qtyPacks: 60, sealedOrLoose: 'sealed', entryType: 'GRN_IN', refType: 'grn', refId: 'grn2', userId: 'u3', createdAt: '2026-11-06T10:00:00Z' },
]

export const mockPurchases: Purchase[] = [
  {
    id: 'pur1',
    vendorId: 'vnd1',
    vendorInvoiceNumber: 'INV-NT-2611-001',
    vendorInvoiceDate: '2026-11-04',
    unitId: 'unit1',
    status: 'putaway-done',
    lines: [
      { id: 'pl1', purchaseId: 'pur1', variantId: 'v2', expectedCartons: 4, expectedPacks: 24, pricePerPack: 4200 },
      { id: 'pl2', purchaseId: 'pur1', variantId: 'v3', expectedCartons: 3, expectedPacks: 18, pricePerPack: 4200 },
    ],
    createdBy: 'u2',
    createdAt: '2026-11-04T10:00:00Z',
  },
  {
    id: 'pur2',
    vendorId: 'vnd2',
    vendorInvoiceNumber: 'HS-2611-089',
    vendorInvoiceDate: '2026-11-08',
    unitId: 'unit1',
    status: 'grn-pending',
    lines: [
      { id: 'pl3', purchaseId: 'pur2', variantId: 'v5', expectedCartons: 6, expectedPacks: 72, pricePerPack: 1900 },
    ],
    createdBy: 'u2',
    createdAt: '2026-11-08T10:00:00Z',
  },
]

export const mockGRNs: GRN[] = [
  {
    id: 'grn1',
    purchaseId: 'pur1',
    floorId: 'fl1',
    status: 'reviewed',
    hasVariance: false,
    lines: [
      { id: 'gl1', grnId: 'grn1', purchaseLineId: 'pl1', variantId: 'v2', receivedCartons: 4, receivedPacks: 0, shortQty: 0, damagedQty: 0, batch: 'B2026-ON-01', expiry: '2027-06-30', lotId: 'lot1' },
      { id: 'gl2', grnId: 'grn1', purchaseLineId: 'pl2', variantId: 'v3', receivedCartons: 3, receivedPacks: 0, shortQty: 0, damagedQty: 0, batch: 'B2026-ON-02', expiry: '2027-08-31', lotId: 'lot2' },
    ],
    createdBy: 'u3',
    createdAt: '2026-11-05T10:00:00Z',
  },
]

export const mockTransfers: StockTransfer[] = [
  { id: 'tr1', fromBinId: 'b4', toBinId: 'b8', variantId: 'v5', lotId: 'lot3', qty: 12, status: 'in-transit', createdBy: 'u3', createdAt: '2026-11-14T08:00:00Z' },
]

export const mockAdjustments: StockAdjustment[] = [
  { id: 'adj1', variantId: 'v1', lotId: 'lot5', binId: 'b7', qty: -2, reason: 'damage', status: 'pending', requestedBy: 'u3', createdAt: '2026-11-14T09:00:00Z', notes: 'Packaging damaged during handling' },
]

// ==================== ORDERS ====================
const now = new Date()
const hoursAgo = (h: number) => new Date(now.getTime() - h * 3600 * 1000).toISOString()
const hoursFromNow = (h: number) => new Date(now.getTime() + h * 3600 * 1000).toISOString()

export const mockOrders: Order[] = [
  {
    id: 'ord1',
    number: 'ORD-2611-00001',
    clientId: 'cl1',
    status: 'new',
    source: 'catalog',
    deliveryAddress: '12 Lajpat Nagar, Delhi 110024',
    preferredDeliveryDate: '2026-11-20',
    lines: [
      { id: 'ol1', orderId: 'ord1', variantId: 'v2', qtyCartons: 2, qtyPacks: 12 },
      { id: 'ol2', orderId: 'ord1', variantId: 'v5', qtyCartons: 1, qtyPacks: 12 },
    ],
    callLogs: [],
    createdAt: hoursAgo(26),
    slaDeadline: hoursFromNow(-2),
  },
  {
    id: 'ord2',
    number: 'ORD-2611-00002',
    clientId: 'cl2',
    status: 'new',
    source: 'catalog',
    deliveryAddress: '78 MG Road, Kochi 682016',
    lines: [
      { id: 'ol3', orderId: 'ord2', variantId: 'v8', qtyCartons: 1, qtyPacks: 6 },
    ],
    callLogs: [],
    createdAt: hoursAgo(18),
    slaDeadline: hoursFromNow(6),
  },
  {
    id: 'ord3',
    number: 'ORD-2611-00003',
    clientId: 'cl3',
    status: 'confirmed',
    source: 'manual',
    lines: [
      { id: 'ol4', orderId: 'ord3', variantId: 'v2', qtyCartons: 3, qtyPacks: 18 },
      { id: 'ol5', orderId: 'ord3', variantId: 'v6', qtyCartons: 2, qtyPacks: 12 },
    ],
    callLogs: [
      { id: 'cl_1', orderId: 'ord3', outcome: 'confirmed', notes: 'Client confirmed the order', userId: 'u2', createdAt: hoursAgo(10) },
    ],
    createdAt: hoursAgo(14),
    confirmedAt: hoursAgo(10),
    slaDeadline: hoursFromNow(10),
  },
  {
    id: 'ord4',
    number: 'ORD-2611-00004',
    clientId: 'cl4',
    status: 'estimate-sent',
    source: 'catalog',
    lines: [
      { id: 'ol6', orderId: 'ord4', variantId: 'v3', qtyCartons: 1, qtyPacks: 6 },
    ],
    callLogs: [
      { id: 'cl_2', orderId: 'ord4', outcome: 'confirmed', userId: 'u2', createdAt: hoursAgo(20) },
    ],
    createdAt: hoursAgo(22),
    confirmedAt: hoursAgo(20),
    slaDeadline: hoursAgo(0),
  },
  {
    id: 'ord5',
    number: 'ORD-2611-00005',
    clientId: 'cl5',
    status: 'payment-verified',
    source: 'manual',
    lines: [
      { id: 'ol7', orderId: 'ord5', variantId: 'v5', qtyCartons: 2, qtyPacks: 24 },
      { id: 'ol8', orderId: 'ord5', variantId: 'v8', qtyCartons: 1, qtyPacks: 6 },
    ],
    callLogs: [],
    createdAt: hoursAgo(72),
    confirmedAt: hoursAgo(68),
    slaDeadline: hoursAgo(48),
  },
]

// ==================== ESTIMATES ====================
export const mockEstimates: Estimate[] = [
  {
    id: 'est1',
    orderId: 'ord4',
    number: 'EST-2611-00001',
    version: 1,
    status: 'sent',
    paymentMode: 'upi',
    taxInclusive: true,
    token: 'tk_a3f7b2c1d9e8f4a5b6c7d8e9f0a1b2c3',
    validUntil: hoursFromNow(168),
    lines: [
      { id: 'el1', estimateId: 'est1', variantId: 'v3', qtyPacks: 6, pricePerPack: 5200, discount: 0, gstRate: 18, lineTotal: 31200, gstAmount: 4760 },
    ],
    totalAmount: 31200,
    totalGst: 4760,
    createdBy: 'u1',
    createdAt: hoursAgo(19),
  },
  {
    id: 'est2',
    orderId: 'ord5',
    number: 'EST-2611-00002',
    version: 1,
    status: 'sent',
    paymentMode: 'bank',
    taxInclusive: false,
    token: 'tk_b4g8c3d2e0f5a6b7c8d9e0f1a2b3c4d5',
    validUntil: hoursFromNow(120),
    lines: [
      { id: 'el2', estimateId: 'est2', variantId: 'v5', qtyPacks: 24, pricePerPack: 2200, discount: 500, gstRate: 18, lineTotal: 52800, gstAmount: 9252 },
      { id: 'el3', estimateId: 'est2', variantId: 'v8', qtyPacks: 6, pricePerPack: 5500, discount: 0, gstRate: 18, lineTotal: 33000, gstAmount: 5940 },
    ],
    totalAmount: 85800,
    totalGst: 15192,
    createdBy: 'u1',
    createdAt: hoursAgo(60),
  },
]

// ==================== PAYMENTS ====================
export const mockPayments: Payment[] = [
  { id: 'pay1', orderId: 'ord5', estimateId: 'est2', amount: 85800, mode: 'bank', utrReference: 'UTR001234567890', status: 'verified', submittedAt: hoursAgo(55), verifiedAt: hoursAgo(50), verifiedBy: 'u6' },
]

// ==================== PICK LISTS ====================
export const mockPickLists: PickList[] = [
  {
    id: 'pkl1',
    orderId: 'ord5',
    floorId: 'fl1',
    status: 'in-progress',
    lines: [
      { id: 'pkln1', pickListId: 'pkl1', orderLineId: 'ol7', variantId: 'v5', lotId: 'lot3', binId: 'b4', sealedCartons: 2, loosePacks: 0, status: 'pending' },
      { id: 'pkln2', pickListId: 'pkl1', orderLineId: 'ol8', variantId: 'v8', lotId: 'lot4', binId: 'b6', sealedCartons: 1, loosePacks: 0, status: 'pending' },
    ],
    createdAt: hoursAgo(48),
  },
]

export const mockCartonOpenRequests: CartonOpenRequest[] = []
export const mockRemainingDeclarations: RemainingDeclaration[] = []
export const mockPackages: Package[] = []

// ==================== DELIVERIES ====================
export const mockDeliveries: Delivery[] = []

// ==================== WHATSAPP ====================
export const mockWhatsAppMessages: WhatsAppMessage[] = [
  { id: 'wa1', orderId: 'ord4', template: 'estimate_sent', recipient: '9966778899', status: 'delivered', sentAt: hoursAgo(19), createdAt: hoursAgo(19) },
  { id: 'wa2', orderId: 'ord5', template: 'payment_verified', recipient: '9977889900', status: 'read', sentAt: hoursAgo(50), createdAt: hoursAgo(50) },
]

// ==================== NOTIFICATIONS ====================
export const mockNotifications: Notification[] = [
  { id: 'not1', userId: 'u1', title: 'Order SLA breached', body: 'ORD-2611-00001 has not been confirmed in 24 hours.', linkType: 'order', linkId: 'ord1', read: false, createdAt: hoursAgo(2) },
  { id: 'not2', userId: 'u2', title: 'GRN variance flagged', body: 'GRN for purchase INV-NT-2611-001 has a quantity variance.', linkType: 'grn', linkId: 'grn1', read: false, createdAt: hoursAgo(8) },
  { id: 'not3', userId: 'u6', title: 'Payment proof submitted', body: 'Payment proof uploaded for ORD-2611-00005.', linkType: 'payment', linkId: 'pay1', read: true, createdAt: hoursAgo(55) },
  { id: 'not4', userId: 'u3', title: 'Pick list created', body: 'Pick list for ORD-2611-00005 assigned to Floor 1.', linkType: 'picklist', linkId: 'pkl1', read: false, createdAt: hoursAgo(48) },
  { id: 'not5', userId: 'u1', title: 'Stock adjustment request', body: 'Adjustment requested for ON-GSW-DRC-2LB, 2 packs damage.', linkType: 'adjustment', linkId: 'adj1', read: false, createdAt: hoursAgo(7) },
]

// ==================== AUDIT LOG ====================
export const mockAuditLogs: AuditLog[] = [
  { id: 'aud1', userId: 'u2', userName: 'Raj Sharma', userRole: 'sub-admin', action: 'create', entity: 'Order', entityId: 'ord3', ip: '10.0.0.5', createdAt: hoursAgo(14) },
  { id: 'aud2', userId: 'u3', userName: 'Suresh Kumar', userRole: 'floor-manager', action: 'create', entity: 'GRN', entityId: 'grn1', ip: '10.0.0.6', createdAt: hoursAgo(165) },
  { id: 'aud3', userId: 'u1', userName: 'Jay Mehta', userRole: 'admin', action: 'create', entity: 'Estimate', entityId: 'est1', ip: '10.0.0.4', createdAt: hoursAgo(19) },
  { id: 'aud4', userId: 'u6', userName: 'Meena Patel', userRole: 'accountant', action: 'approve', entity: 'Payment', entityId: 'pay1', ip: '10.0.0.7', before: { status: 'submitted' }, after: { status: 'verified' }, createdAt: hoursAgo(50) },
]

// ==================== CATALOG LINKS ====================
export const mockCatalogLinks: CatalogLink[] = [
  {
    id: 'cl-link1',
    token: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4',
    title: 'MuscleBlaze Whey Range - FitLife Store',
    brandIds: ['br2'],
    productIds: [],
    expiresAt: new Date(Date.now() + 20 * 60 * 60 * 1000).toISOString(),
    createdBy: 'u2',
    createdAt: hoursAgo(4),
    viewCount: 3,
    checkoutCount: 1,
    active: true,
  },
  {
    id: 'cl-link2',
    token: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5',
    title: 'Full Catalog - ProSports Nutrition',
    brandIds: ['br1', 'br2', 'br3'],
    productIds: [],
    expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    createdBy: 'u2',
    createdAt: hoursAgo(26),
    viewCount: 7,
    checkoutCount: 2,
    active: false,
  },
]

// ==================== ENQUIRIES ====================
export const mockEnquiries: Enquiry[] = [
  {
    id: 'enq1',
    number: 'ENQ-2611-00001',
    catalogLinkId: 'cl-link1',
    contactName: 'Abhishek Jain',
    mobile: '9811234567',
    email: 'abhishek@fitlife.in',
    businessName: 'FitLife Store',
    deliveryAddress: '12 Lajpat Nagar, Delhi 110024',
    preferredDate: '2026-11-20',
    notes: 'Need urgently',
    lines: [
      { variantId: 'v5', quantity: 12 },
      { variantId: 'v6', quantity: 6 },
    ],
    status: 'new',
    paymentType: undefined,
    callLogs: [],
    createdAt: hoursAgo(1),
    updatedAt: hoursAgo(1),
  },
  {
    id: 'enq2',
    number: 'ENQ-2611-00002',
    contactName: 'Rahul Mehta',
    mobile: '9988776655',
    businessName: 'Sweat Zone',
    deliveryAddress: 'Shop 3, Powai, Mumbai 400076',
    lines: [
      { variantId: 'v2', quantity: 6 },
      { variantId: 'v8', quantity: 12 },
    ],
    status: 'called',
    paymentType: 'credit',
    callLogs: [
      {
        note: 'Customer interested, wants to know if there\'s a discount on 2 cartons of v8',
        outcome: 'reached',
        at: hoursAgo(0.5),
        by: 'u2',
        byName: 'Raj Sharma',
      },
    ],
    createdAt: hoursAgo(5),
    updatedAt: hoursAgo(0.5),
  },
  {
    id: 'enq3',
    number: 'ENQ-2611-00003',
    contactName: 'Priya Desai',
    mobile: '9900112200',
    businessName: 'Wellness Corner',
    lines: [
      { variantId: 'v1', quantity: 24 },
    ],
    status: 'confirmed',
    paymentType: 'cash',
    callLogs: [
      {
        note: 'Confirmed order for 24 packs, cash payment, delivery by 20 Nov',
        outcome: 'confirmed',
        at: hoursAgo(10),
        by: 'u2',
        byName: 'Raj Sharma',
      },
    ],
    createdAt: hoursAgo(14),
    updatedAt: hoursAgo(10),
  },
]

// ==================== SETTINGS ====================
export const mockSettings: AppSettings = {
  businessName: 'Royal Nutrition',
  orderPrefix: 'ORD',
  estimatePrefix: 'EST',
  invoicePrefix: 'INV',
  upiId: 'royalnutrition@okaxis',
  bankName: 'HDFC Bank',
  bankAccountNumber: '50200012345678',
  bankIfsc: 'HDFC0001234',
  bankAccountName: 'Royal Nutrition LLP',
  estimateValidityDays: 7,
  confirmationSlaHours: 24,
  expiryAlertWindowDays: 90,
  lowStockDefaultThreshold: 12,
  unitGstins: { unit1: '27AABCR1234C1Z4', unit2: '27AABCR1234C1Z5' },
}
