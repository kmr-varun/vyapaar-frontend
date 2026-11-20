// ==================== AUTH ====================
export type UserRole =
  | 'admin'
  | 'sub-admin'
  | 'floor-manager'
  | 'delivery-manager'
  | 'delivery-team'
  | 'accountant'

export interface User {
  id: string
  userCode: string
  name: string
  mobile: string
  role: UserRole
  unitId: string
  floorIds: string[]
  status: 'active' | 'disabled'
  mustChangePassword: boolean
  revisePricePermission?: boolean
  createdAt: string
  createdBy: string
}

export interface AuthSession {
  user: User
  token: string
}

// ==================== MASTER DATA ====================
export interface Brand {
  id: string
  name: string
  logoUrl?: string
  slug: string
  active: boolean
  createdAt: string
}

export type ProductCategory =
  | 'whey'
  | 'isolate'
  | 'gainer'
  | 'pre-workout'
  | 'creatine'
  | 'amino'
  | 'vitamins'
  | 'fat-burner'
  | 'other'

export interface Product {
  id: string
  brandId: string
  name: string
  slug: string
  category: ProductCategory
  description?: string
  imageUrl?: string
  hsnCode: string
  gstRate: number
  active: boolean
  createdAt: string
}

export interface Variant {
  id: string
  productId: string
  flavour: string
  packSize: number
  packUnit: 'kg' | 'lb' | 'g' | 'ml' | 'L' | 'servings'
  mrp: number
  skuCode: string
  imageUrl?: string
  unitsPerCarton: number
  active: boolean
  createdAt: string
}

export interface Vendor {
  id: string
  name: string
  gstin?: string
  contactName: string
  mobile: string
  email?: string
  address: string
  paymentTerms: string
  active: boolean
  createdAt: string
}

export interface VendorPriceRule {
  id: string
  vendorId: string
  variantId: string
  pricePerPack: number
  minCartons?: number
  paymentMode?: PaymentMode
  deliveryWithinDays?: number
  validFrom: string
  validTo: string
  active: boolean
}

export interface Client {
  id: string
  businessName: string
  contactName: string
  mobile: string
  gstin?: string
  billingAddress: string
  shippingAddress?: string
  creditLimit: number
  creditDays: number
  notes?: string
  active: boolean
  createdAt: string
  source: 'manual' | 'catalog'
}

// ==================== WAREHOUSE ====================
export interface Unit {
  id: string
  name: string
  address: string
  gstin?: string
  active: boolean
}

export interface Floor {
  id: string
  unitId: string
  name: string
  code: string
  primaryFloorManagerId?: string
  active: boolean
}

export interface Rack {
  id: string
  floorId: string
  name: string
  code: string
  active: boolean
}

export interface Bin {
  id: string
  rackId: string
  name: string
  code: string
  active: boolean
}

// ==================== INVENTORY ====================
export type StockLedgerEntryType =
  | 'GRN_IN'
  | 'PUTAWAY'
  | 'TRANSFER_OUT'
  | 'TRANSFER_IN'
  | 'RESERVE'
  | 'RELEASE'
  | 'PICK'
  | 'CARTON_OPEN'
  | 'LOOSE_IN'
  | 'DAMAGE'
  | 'SAMPLE'
  | 'ADJUST'

export interface StockLedger {
  id: string
  variantId: string
  lotId: string
  binId: string
  qtyPacks: number
  sealedOrLoose: 'sealed' | 'loose'
  entryType: StockLedgerEntryType
  refType?: string
  refId?: string
  userId: string
  reason?: string
  createdAt: string
}

export interface StockBalance {
  variantId: string
  lotId: string
  binId: string
  sealedPacks: number
  loosePacks: number
  reservedPacks: number
}

export interface Lot {
  id: string
  variantId: string
  batch: string
  expiry: string
}

export interface OpenedCarton {
  id: string
  variantId: string
  lotId: string
  binId: string
  openedBy: string
  approvedBy?: string
  packsRemaining: number
  status: 'open' | 'depleted'
  openedAt: string
}

export interface Purchase {
  id: string
  vendorId: string
  vendorInvoiceNumber: string
  vendorInvoiceDate: string
  unitId: string
  status: 'draft' | 'grn-pending' | 'grn-done' | 'putaway-done'
  lines: PurchaseLine[]
  createdBy: string
  createdAt: string
}

export interface PurchaseLine {
  id: string
  purchaseId: string
  variantId: string
  lotId?: string
  expectedCartons: number
  expectedPacks: number
  pricePerPack: number
}

export interface GRN {
  id: string
  purchaseId: string
  floorId: string
  status: 'draft' | 'submitted' | 'reviewed'
  hasVariance: boolean
  lines: GRNLine[]
  createdBy: string
  createdAt: string
}

export interface GRNLine {
  id: string
  grnId: string
  purchaseLineId: string
  variantId: string
  receivedCartons: number
  receivedPacks: number
  shortQty: number
  damagedQty: number
  damagePhotos?: string[]
  batch: string
  expiry: string
  lotId?: string
}

export interface StockTransfer {
  id: string
  fromBinId: string
  toBinId: string
  variantId: string
  lotId: string
  qty: number
  status: 'draft' | 'in-transit' | 'received' | 'variance'
  createdBy: string
  createdAt: string
  receivedAt?: string
}

export interface StockAdjustment {
  id: string
  variantId: string
  lotId: string
  binId: string
  qty: number
  reason: 'damage' | 'expiry' | 'found' | 'lost' | 'sample'
  photos?: string[]
  status: 'pending' | 'approved' | 'rejected'
  requestedBy: string
  approvedBy?: string
  createdAt: string
  notes?: string
}

export interface CycleCountTask {
  id: string
  binIds: string[]
  status: 'open' | 'counting' | 'variance' | 'closed'
  createdBy: string
  createdAt: string
}

export interface StockDisplay {
  variantId: string
  skuCode: string
  variantLabel: string
  productName: string
  brandName: string
  binCode: string
  binName: string    // human-readable: "Rack A · Bin 2"
  rackName: string
  binId: string
  unitId: string
  unitName: string
  sealedCartons: number
  loosePacks: number
  reservedPacks: number
  availablePacks: number
  unitsPerCarton: number
  nearestExpiry?: string
}

// ==================== ORDERS ====================
export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'changes-requested'
  | 'cancelled'
  | 'estimate-sent'
  | 'payment-pending'
  | 'payment-verified'
  | 'in-warehouse'
  | 'picking'
  | 'partially-packed'
  | 'packed'
  | 'ready-for-dispatch'
  | 'dispatched'
  | 'out-for-delivery'
  | 'delivered'
  | 'failed-delivery'
  | 'on-hold'
  | 'closed'

export interface Order {
  id: string
  number: string
  clientId: string
  status: OrderStatus
  source: 'catalog' | 'manual'
  deliveryAddress?: string
  preferredDeliveryDate?: string
  notes?: string
  lines: OrderLine[]
  callLogs: CallLog[]
  createdAt: string
  confirmedAt?: string
  confirmedBy?: string
  confirmedByName?: string
  slaDeadline: string
}

export interface OrderLine {
  id: string
  orderId: string
  variantId: string
  qtyCartons: number
  qtyPacks: number
  originalQtyCartons?: number
  originalQtyPacks?: number
}

export interface CallLog {
  id: string
  orderId: string
  outcome: 'confirmed' | 'changes-requested' | 'not-reachable' | 'cancelled'
  notes?: string
  cancelReason?: string
  userId: string
  createdAt: string
}

// ==================== ESTIMATES ====================
export type EstimateStatus = 'draft' | 'priced' | 'sent' | 'expired' | 'replaced'
export type PaymentMode = 'upi' | 'bank' | 'cash' | 'credit'

export interface Estimate {
  id: string
  orderId: string
  number: string
  version: number
  status: EstimateStatus
  paymentMode: PaymentMode
  taxInclusive: boolean
  token: string
  validUntil: string
  lines: EstimateLine[]
  totalAmount: number
  totalGst: number
  createdBy: string
  createdAt: string
  sentBy?: string
  sentByName?: string
  sentAt?: string
}

export interface EstimateLine {
  id: string
  estimateId: string
  variantId: string
  qtyPacks: number
  pricePerPack?: number
  discount?: number
  gstRate: number
  lineTotal: number
  gstAmount: number
}

// ==================== PAYMENTS ====================
export type PaymentStatus = 'submitted' | 'verified' | 'rejected'

export interface Payment {
  id: string
  orderId: string
  estimateId: string
  amount: number
  mode: PaymentMode
  utrReference?: string
  proofFileUrl?: string
  status: PaymentStatus
  submittedAt: string
  verifiedAt?: string
  verifiedBy?: string
  rejectionReason?: string
}

export interface CreditApproval {
  id: string
  orderId: string
  clientId: string
  amount: number
  overrideReason?: string
  approvedBy: string
  approvedAt: string
}

export interface ClientLedgerEntry {
  id: string
  clientId: string
  type: 'estimate' | 'payment' | 'credit'
  refNumber: string
  amount: number
  balance: number
  createdAt: string
}

// ==================== PICKING ====================
export interface PickList {
  id: string
  orderId: string
  floorId: string
  status: 'pending' | 'in-progress' | 'picked' | 'on-hold'
  lines: PickLine[]
  createdAt: string
}

export interface PickLine {
  id: string
  pickListId: string
  orderLineId: string
  variantId: string
  lotId: string
  binId: string
  sealedCartons: number
  loosePacks: number
  pickedCartons?: number
  pickedPacks?: number
  status: 'pending' | 'picked' | 'short'
  shortReason?: string
}

export interface CartonOpenRequest {
  id: string
  pickLineId: string
  variantId: string
  lotId: string
  binId: string
  packsNeeded: number
  orderId: string
  status: 'pending' | 'approved' | 'rejected'
  requestedBy: string
  approvedBy?: string
  createdAt: string
}

export interface RemainingDeclaration {
  id: string
  cartonOpenRequestId: string
  packsLeft: number
  binId: string
  damagedPacks: number
  damagePhotos?: string[]
  status: 'pending' | 'confirmed' | 'variance'
  declaredBy: string
  confirmedBy?: string
  createdAt: string
}

export interface Package {
  id: string
  orderId: string
  floorId: string
  parcelCount: number
  photos: string[]
  status: 'packing' | 'packed'
  packedBy: string
  packedAt?: string
}

// ==================== DISPATCH ====================
export type DeliveryMode = 'delivery-team' | 'self-delivery'

export interface Delivery {
  id: string
  orderId: string
  mode: DeliveryMode
  riderId?: string
  otp?: string
  status: 'assigned' | 'out-for-delivery' | 'delivered' | 'failed'
  proofType?: 'otp' | 'photo'
  proofUrl?: string
  receiverName?: string
  failureReason?: string
  createdAt: string
  deliveredAt?: string
}

// ==================== WHATSAPP ====================
export interface WhatsAppMessage {
  id: string
  orderId: string
  template: string
  recipient: string
  status: 'queued' | 'sent' | 'delivered' | 'read' | 'failed'
  failureReason?: string
  sentAt?: string
  createdAt: string
}

// ==================== NOTIFICATIONS ====================
export interface Notification {
  id: string
  userId: string
  title: string
  body: string
  linkType: string
  linkId: string
  read: boolean
  createdAt: string
}

// ==================== AUDIT ====================
export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: UserRole
  action: 'create' | 'update' | 'delete' | 'approve' | 'reject' | 'status-change'
  entity: string
  entityId: string
  before?: Record<string, unknown>
  after?: Record<string, unknown>
  ip: string
  createdAt: string
}

// ==================== SETTINGS ====================
export interface AppSettings {
  businessName: string
  businessAddress?: string
  logoUrl?: string
  unitGstins: Record<string, string>
  orderPrefix: string
  estimatePrefix: string
  invoicePrefix: string
  upiId: string
  bankName: string
  bankAccountNumber: string
  bankIfsc: string
  bankAccountName: string
  estimateValidityDays: number
  confirmationSlaHours: number
  expiryAlertWindowDays: number
  lowStockDefaultThreshold: number
  whatsappSenderNumber?: string
}

// ==================== CATALOG (public) ====================
export interface CatalogProduct {
  brand: Brand
  product: Product
  variants: (Variant & { availability: 'in-stock' | 'limited' | 'out-of-stock' })[]
}

export interface CartItem {
  variantId: string
  skuCode: string
  variantLabel: string
  productName: string
  brandName: string
  mrp: number
  qtyCartons: number
  qtyPacks: number
  unitsPerCarton: number
}

export interface CheckoutFormData {
  contactName: string
  mobile: string
  businessName?: string
  gstin?: string
  deliveryAddress: string
  preferredDeliveryDate: string
  notes?: string
}

// ==================== CATALOG LINKS ====================
export interface CatalogLink {
  id: string
  token: string
  title: string
  brandIds: string[]
  productIds: string[]  // empty = all products in selected brands
  expiresAt: string     // ISO timestamp, 24h from creation
  createdBy: string
  createdAt: string
  viewCount: number
  checkoutCount: number
  active: boolean
}

// ==================== ENQUIRIES ====================
export type EnquiryStatus = 'new' | 'called' | 'confirmed' | 'cancelled'
export type EnquiryPaymentType = 'cash' | 'credit'

export interface EnquiryLine {
  variantId: string
  quantity: number  // number of packs
  note?: string
}

export interface EnquiryCallLog {
  note: string
  outcome: 'reached' | 'not-reachable' | 'confirmed' | 'changes-made'
  at: string
  by: string
  byName: string
}

export interface Enquiry {
  id: string
  number: string    // ENQ-YYMM-NNNNN
  catalogLinkId?: string
  contactName: string
  mobile: string
  email?: string
  businessName?: string
  deliveryAddress?: string
  preferredDate?: string
  notes?: string
  lines: EnquiryLine[]
  status: EnquiryStatus
  paymentType?: EnquiryPaymentType
  callLogs: EnquiryCallLog[]
  createdAt: string
  updatedAt: string
  orderId?: string  // set when converted to order
}
