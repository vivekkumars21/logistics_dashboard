// ── Mock Data ──────────────────────────────────────────────────────
// Replace these with Supabase queries when you connect your database.

import {
  Product,
  Supplier,
  Order,
  Shipment,
  DashboardStats,
} from "@/types";

export const mockProducts: Product[] = [
  { id: "1",  name: "Steel Bolts M8",        sku: "SB-M8-001",   category: "Fasteners",     quantity: 12500,  reorderLevel: 2000,  unitPrice: 0.15,  warehouse: "Warehouse A", lastUpdated: "2026-02-20" },
  { id: "2",  name: "Copper Wire 2.5mm",      sku: "CW-25-002",   category: "Electrical",    quantity: 340,    reorderLevel: 500,   unitPrice: 4.50,  warehouse: "Warehouse B", lastUpdated: "2026-02-19" },
  { id: "3",  name: "Hydraulic Pump HP-200",   sku: "HP-200-003",  category: "Machinery",     quantity: 28,     reorderLevel: 10,    unitPrice: 899.00, warehouse: "Warehouse A", lastUpdated: "2026-02-18" },
  { id: "4",  name: "Rubber Gaskets 50mm",     sku: "RG-50-004",   category: "Seals",         quantity: 4200,   reorderLevel: 1000,  unitPrice: 0.85,  warehouse: "Warehouse C", lastUpdated: "2026-02-21" },
  { id: "5",  name: "Aluminum Sheet 3mm",      sku: "AS-3-005",    category: "Raw Materials",  quantity: 150,    reorderLevel: 200,   unitPrice: 45.00, warehouse: "Warehouse A", lastUpdated: "2026-02-17" },
  { id: "6",  name: "LED Panel Light 60W",     sku: "LP-60-006",   category: "Electrical",    quantity: 620,    reorderLevel: 100,   unitPrice: 32.00, warehouse: "Warehouse B", lastUpdated: "2026-02-22" },
  { id: "7",  name: "Carbon Steel Pipe DN50",  sku: "CSP-50-007",  category: "Piping",        quantity: 85,     reorderLevel: 50,    unitPrice: 120.00, warehouse: "Warehouse C", lastUpdated: "2026-02-20" },
  { id: "8",  name: "Nylon Cable Ties 200mm",  sku: "NCT-200-008", category: "Fasteners",     quantity: 18000,  reorderLevel: 5000,  unitPrice: 0.03,  warehouse: "Warehouse A", lastUpdated: "2026-02-21" },
  { id: "9",  name: "Bearing 6205-2RS",        sku: "BR-6205-009", category: "Machinery",     quantity: 60,     reorderLevel: 100,   unitPrice: 12.50, warehouse: "Warehouse B", lastUpdated: "2026-02-15" },
  { id: "10", name: "PVC Insulation Tape",     sku: "PIT-010",     category: "Electrical",    quantity: 3500,   reorderLevel: 800,   unitPrice: 1.20,  warehouse: "Warehouse A", lastUpdated: "2026-02-22" },
];

export const mockSuppliers: Supplier[] = [
  { id: "1",  name: "SteelCraft Industries",   contactEmail: "sales@steelcraft.com",    phone: "+1-555-0101", country: "USA",      rating: 5, status: "active",   productsSupplied: 34 },
  { id: "2",  name: "ElectroParts Co.",         contactEmail: "info@electroparts.de",    phone: "+49-30-1234", country: "Germany",  rating: 4, status: "active",   productsSupplied: 21 },
  { id: "3",  name: "Shanghai Metal Group",     contactEmail: "export@shmetal.cn",       phone: "+86-21-5678", country: "China",    rating: 4, status: "active",   productsSupplied: 58 },
  { id: "4",  name: "PrecisionSeal Ltd.",       contactEmail: "orders@precisionseal.uk", phone: "+44-20-9876", country: "UK",       rating: 3, status: "inactive", productsSupplied: 12 },
  { id: "5",  name: "TechPipe Solutions",       contactEmail: "supply@techpipe.in",      phone: "+91-22-4567", country: "India",    rating: 4, status: "active",   productsSupplied: 19 },
  { id: "6",  name: "Nordic Components AB",     contactEmail: "hello@nordiccomp.se",     phone: "+46-8-3210",  country: "Sweden",   rating: 5, status: "pending",  productsSupplied: 0  },
];

export const mockOrders: Order[] = [
  { id: "1",  orderNumber: "PO-2026-001", supplierId: "1", supplierName: "SteelCraft Industries", status: "delivered",  totalAmount: 4500.00,  currency: "USD", orderDate: "2026-01-15", expectedDelivery: "2026-02-01", items: 3 },
  { id: "2",  orderNumber: "PO-2026-002", supplierId: "3", supplierName: "Shanghai Metal Group",  status: "shipped",   totalAmount: 12800.00, currency: "USD", orderDate: "2026-01-28", expectedDelivery: "2026-02-25", items: 5 },
  { id: "3",  orderNumber: "PO-2026-003", supplierId: "2", supplierName: "ElectroParts Co.",      status: "confirmed", totalAmount: 3200.00,  currency: "USD", orderDate: "2026-02-05", expectedDelivery: "2026-03-01", items: 2 },
  { id: "4",  orderNumber: "PO-2026-004", supplierId: "5", supplierName: "TechPipe Solutions",    status: "pending",   totalAmount: 8900.00,  currency: "USD", orderDate: "2026-02-18", expectedDelivery: "2026-03-15", items: 4 },
  { id: "5",  orderNumber: "PO-2026-005", supplierId: "1", supplierName: "SteelCraft Industries", status: "confirmed", totalAmount: 1650.00,  currency: "USD", orderDate: "2026-02-20", expectedDelivery: "2026-03-10", items: 2 },
  { id: "6",  orderNumber: "PO-2026-006", supplierId: "3", supplierName: "Shanghai Metal Group",  status: "pending",   totalAmount: 22400.00, currency: "USD", orderDate: "2026-02-22", expectedDelivery: "2026-03-20", items: 8 },
  { id: "7",  orderNumber: "PO-2026-007", supplierId: "4", supplierName: "PrecisionSeal Ltd.",    status: "cancelled", totalAmount: 750.00,   currency: "USD", orderDate: "2026-02-10", expectedDelivery: "2026-03-05", items: 1 },
];

export const mockShipments: Shipment[] = [
  { id: "1", trackingNumber: "TRK-9928374", orderId: "1", orderNumber: "PO-2026-001", carrier: "DHL Express",     status: "delivered",  origin: "Detroit, USA",       destination: "Warehouse A",  departureDate: "2026-01-20", estimatedArrival: "2026-01-28", weight: 450 },
  { id: "2", trackingNumber: "TRK-5567201", orderId: "2", orderNumber: "PO-2026-002", carrier: "Maersk Shipping", status: "in_transit", origin: "Shanghai, China",     destination: "Warehouse C",  departureDate: "2026-02-10", estimatedArrival: "2026-02-28", weight: 2200 },
  { id: "3", trackingNumber: "TRK-8834512", orderId: "2", orderNumber: "PO-2026-002", carrier: "Maersk Shipping", status: "customs",    origin: "Shanghai, China",     destination: "Warehouse A",  departureDate: "2026-02-10", estimatedArrival: "2026-03-01", weight: 1800 },
  { id: "4", trackingNumber: "TRK-1129845", orderId: "3", orderNumber: "PO-2026-003", carrier: "FedEx Freight",   status: "preparing",  origin: "Berlin, Germany",     destination: "Warehouse B",  departureDate: "2026-02-25", estimatedArrival: "2026-03-02", weight: 320 },
  { id: "5", trackingNumber: "TRK-6673920", orderId: "4", orderNumber: "PO-2026-004", carrier: "Hapag-Lloyd",     status: "delayed",    origin: "Mumbai, India",       destination: "Warehouse C",  departureDate: "2026-02-20", estimatedArrival: "2026-03-18", weight: 3100 },
];

export const mockDashboardStats: DashboardStats = {
  totalProducts: 10,
  lowStockItems: 3,
  activeOrders: 5,
  totalSuppliers: 6,
  pendingShipments: 4,
  totalInventoryValue: 128450.00,
  ordersThisMonth: 4,
  deliveredThisMonth: 1,
};
