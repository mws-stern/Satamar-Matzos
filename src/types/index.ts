export interface User {
  id: string;
  name: string;
  nameHebrew: string;
  titleHebrew: string;
  titleEnglish: string;
  first_name_hebrew: string;
  last_name_hebrew: string;
  first_name: string;
  last_name: string;
  house_number: string;
  apt: string;
  street: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  notes: string;
  created_at: string;
}

export type Customer = User;

export interface Product {
  id: string;
  name: string;
  nameHebrew: string;
  pricePerLb: number;
  pricePerHalfLb?: number;
  sellByHalfLb?: boolean;
  category: "rashi" | "regular" | "spelt" | "wholewheat" | "flour" | "shvurim";
  description: string;
  inStock: boolean;
  currentInventory: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  discount: number;
  discountType: "fixed" | "percent";
  status: "draft" | "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";
  paymentStatus: "unpaid" | "partial" | "paid";
  amountPaid: number;
  amountDue: number;
  notes: string;
  deliveryDate: string;
  orderTime: string;
  inventoryDeducted: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  productNameHebrew: string;
  quantity: number;
  unit?: "lb" | "half_lb";
  pricePerLb: number;
  totalPrice: number;
  discount: number;
  discountType: "fixed" | "percent";
  finalPrice: number;
}

export interface Settings {
  id: string;
  companyName: string;
  companyNameHebrew: string;
  email: string;
  phone: string;
  address: string;
  taxRate: number;
  currency: string;
}

export interface Payment {
  id: string;
  orderId: string;
  invoiceId: string;
  amount: number;
  paymentMethod: "cash" | "check" | "credit_card" | "bank_transfer";
  paymentDate: string;
  notes: string;
  creditCardLast4: string;
  confirmed: boolean;
  confirmedAt: string;
}

export interface InventoryEntry {
  id: string;
  productId: string;
  productName: string;
  amount: number;
  date: string;
  notes: string;
  createdAt: string;
}

export type Invoice = {
  id: string;
  order_id: string;
  invoice_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  items_json: string;
  subtotal: number;
  tax: number;
  total: number;
  paid: boolean;
  payment_status: "unpaid" | "partial" | "paid";
  amount_paid: number;
  amount_due: number;
  due_date: string;
};

// Minimal AppState to satisfy imports in store.ts.
// This matches how the app seems to use it: high-level collections of entities.
export interface AppState {
  products: Product[];
  customers: User[];
  orders: Order[];
  invoices: Invoice[];
  payments: Payment[];
  inventoryEntries: InventoryEntry[];
  settings: Settings | null;

  // UI and lifecycle flags used throughout the app
  isLoading: boolean;
  isInitializing: boolean;
  isInitialized: boolean;
  lastSync: number | null;

  // Lifecycle and data loading methods (implemented in src/lib/store.ts)
  initialize: () => Promise<void>;
  refreshData: () => Promise<void>;

  // Product operations
  addProduct: (product: Omit<Product, "id">) => Promise<Product>;
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;

  // Customer operations
  addCustomer: (customer: Omit<Customer, "id">) => Promise<Customer>;
  updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;

  // Order operations
  addOrder: (order: Omit<Order, "id">) => Promise<Order>;
  updateOrder: (id: string, updates: Partial<Order>) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;

  // Selector helpers used on the dashboard and reports
  getTotalRevenue: () => number;
  getPendingOrders: () => Order[];
  getCompletedOrders: () => Order[];
  getTopCustomers: (limit?: number) => (Customer & { totalSpent: number })[];
  getLowStockProducts: () => Product[];
  getRecentOrders: (limit?: number) => Order[];
}

// Email logs as used in src/pages/emails.tsx
export interface EmailLog {
  id: string;
  // Core email metadata
  orderId?: string | null;
  customerId?: string | null;
  customerEmail?: string | null;
  customerName?: string | null;
  emailType: string;
  subject: string;
  status: string;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
}