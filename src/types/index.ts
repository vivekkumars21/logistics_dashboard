// ── Supply Chain Domain Types ──────────────────────────────────────
// These mirror what your Supabase tables will look like.
// When you connect Supabase, replace mock data imports with real queries.

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  reorderLevel: number;
  unitPrice: number;
  warehouse: string;
  lastUpdated: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail: string;
  phone: string;
  country: string;
  rating: number; // 1-5
  status: "active" | "inactive" | "pending";
  productsSupplied: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  supplierId: string;
  supplierName: string;
  status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
  totalAmount: number;
  currency: string;
  orderDate: string;
  expectedDelivery: string;
  items: number;
}

export interface Shipment {
  id: string;
  trackingNumber: string;
  orderId: string;
  orderNumber: string;
  carrier: string;
  status: "preparing" | "in_transit" | "customs" | "delivered" | "delayed";
  origin: string;
  destination: string;
  departureDate: string;
  estimatedArrival: string;
  weight: number;
}

export interface DashboardStats {
  totalProducts: number;
  lowStockItems: number;
  activeOrders: number;
  totalSuppliers: number;
  pendingShipments: number;
  totalInventoryValue: number;
  ordersThisMonth: number;
  deliveredThisMonth: number;
}

export type StatusVariant = "success" | "warning" | "danger" | "info" | "neutral";
