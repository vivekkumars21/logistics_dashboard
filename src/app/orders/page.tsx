"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { mockOrders } from "@/lib/mock-data";
import { Order, StatusVariant } from "@/types";

const orderStatusMap: Record<Order["status"], StatusVariant> = {
  pending: "warning",
  confirmed: "info",
  shipped: "info",
  delivered: "success",
  cancelled: "danger",
};

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);

export default function OrdersPage() {
  const [search, setSearch] = useState("");

  const filtered = mockOrders.filter(
    (o) =>
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.supplierName.toLowerCase().includes(search.toLowerCase()) ||
      o.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Purchase Orders"
        subtitle={`${mockOrders.length} orders total`}
        searchPlaceholder="Search orders…"
        onSearch={setSearch}
      />

      <DataTable<Order>
        keyField="id"
        data={filtered}
        columns={[
          { key: "orderNumber", header: "Order #" },
          { key: "supplierName", header: "Supplier" },
          {
            key: "status",
            header: "Status",
            render: (r) => <StatusBadge label={r.status} variant={orderStatusMap[r.status]} />,
          },
          { key: "items", header: "Items" },
          { key: "totalAmount", header: "Total", render: (r) => formatCurrency(r.totalAmount) },
          { key: "orderDate", header: "Order Date" },
          { key: "expectedDelivery", header: "Expected Delivery" },
        ]}
      />
    </>
  );
}
