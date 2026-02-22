"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { mockProducts } from "@/lib/mock-data";
import { Product, StatusVariant } from "@/types";
import styles from "./inventory.module.css";

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

function stockStatus(p: Product): { label: string; variant: StatusVariant } {
  if (p.quantity <= 0) return { label: "Out of Stock", variant: "danger" };
  if (p.quantity <= p.reorderLevel) return { label: "Low Stock", variant: "warning" };
  return { label: "In Stock", variant: "success" };
}

export default function InventoryPage() {
  const [search, setSearch] = useState("");

  const filtered = mockProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Inventory"
        subtitle={`${mockProducts.length} products across all warehouses`}
        searchPlaceholder="Search products, SKU…"
        onSearch={setSearch}
      />

      <div className={styles.summary}>
        <div className={styles.pill}>📦 Total: {mockProducts.length}</div>
        <div className={styles.pill}>⚠️ Low Stock: {mockProducts.filter((p) => p.quantity <= p.reorderLevel).length}</div>
        <div className={styles.pill}>💰 Value: {formatCurrency(mockProducts.reduce((s, p) => s + p.quantity * p.unitPrice, 0))}</div>
      </div>

      <DataTable<Product>
        keyField="id"
        data={filtered}
        columns={[
          { key: "name", header: "Product" },
          { key: "sku", header: "SKU" },
          { key: "category", header: "Category" },
          { key: "quantity", header: "Qty", render: (r) => r.quantity.toLocaleString() },
          {
            key: "status",
            header: "Status",
            render: (r) => {
              const s = stockStatus(r);
              return <StatusBadge label={s.label} variant={s.variant} />;
            },
          },
          { key: "unitPrice", header: "Unit Price", render: (r) => formatCurrency(r.unitPrice) },
          { key: "warehouse", header: "Warehouse" },
          { key: "lastUpdated", header: "Updated" },
        ]}
      />
    </>
  );
}
