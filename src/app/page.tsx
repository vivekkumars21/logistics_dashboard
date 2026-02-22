import StatsCard from "@/components/StatsCard/StatsCard";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import PageHeader from "@/components/PageHeader/PageHeader";
import { mockDashboardStats, mockOrders, mockShipments, mockProducts } from "@/lib/mock-data";
import { Order, Shipment, StatusVariant } from "@/types";
import styles from "./dashboard.module.css";

const orderStatusMap: Record<Order["status"], StatusVariant> = {
  pending: "warning",
  confirmed: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

const shipmentStatusMap: Record<Shipment["status"], StatusVariant> = {
  preparing: "neutral",
  in_transit: "info",
  customs: "warning",
  delivered: "success",
  delayed: "danger",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

const lowStockProducts = mockProducts.filter((p) => p.quantity <= p.reorderLevel);
const recentOrders = [...mockOrders].sort((a, b) => b.orderDate.localeCompare(a.orderDate)).slice(0, 5);
const activeShipments = mockShipments.filter((s) => s.status !== "delivered");

export default function DashboardPage() {
  const stats = mockDashboardStats;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Supply chain overview at a glance" />

      {/* Stats Row */}
      <div className={styles.statsGrid}>
        <StatsCard title="Total Products"      value={stats.totalProducts}                icon="📦" />
        <StatsCard title="Low Stock Items"     value={stats.lowStockItems}                icon="⚠️" variant="warning" />
        <StatsCard title="Active Orders"       value={stats.activeOrders}                 icon="🛒" variant="info" />
        <StatsCard title="Inventory Value"     value={formatCurrency(stats.totalInventoryValue)} icon="💰" variant="success" />
        <StatsCard title="Pending Shipments"   value={stats.pendingShipments}             icon="🚚" />
        <StatsCard title="Suppliers"           value={stats.totalSuppliers}               icon="🏭" />
      </div>

      {/* Two-column grid */}
      <div className={styles.twoCol}>
        {/* Recent Orders */}
        <section>
          <h2 className={styles.sectionTitle}>Recent Orders</h2>
          <DataTable
            keyField="id"
            data={recentOrders}
            columns={[
              { key: "orderNumber", header: "Order #" },
              { key: "supplierName", header: "Supplier" },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <StatusBadge label={row.status} variant={orderStatusMap[row.status]} />
                ),
              },
              {
                key: "totalAmount",
                header: "Amount",
                render: (row) => formatCurrency(row.totalAmount),
              },
            ]}
          />
        </section>

        {/* Active Shipments */}
        <section>
          <h2 className={styles.sectionTitle}>Active Shipments</h2>
          <DataTable
            keyField="id"
            data={activeShipments}
            columns={[
              { key: "trackingNumber", header: "Tracking #" },
              { key: "carrier", header: "Carrier" },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <StatusBadge label={row.status.replace("_", " ")} variant={shipmentStatusMap[row.status]} />
                ),
              },
              { key: "destination", header: "Dest." },
            ]}
          />
        </section>
      </div>

      {/* Low Stock Alert */}
      {lowStockProducts.length > 0 && (
        <section>
          <h2 className={styles.sectionTitle}>⚠️ Low Stock Alerts</h2>
          <DataTable
            keyField="id"
            data={lowStockProducts}
            columns={[
              { key: "name", header: "Product" },
              { key: "sku", header: "SKU" },
              { key: "quantity", header: "Current Qty" },
              { key: "reorderLevel", header: "Reorder Level" },
              { key: "warehouse", header: "Warehouse" },
            ]}
          />
        </section>
      )}
    </>
  );
}
