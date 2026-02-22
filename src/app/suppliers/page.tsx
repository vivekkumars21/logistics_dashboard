"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { mockSuppliers } from "@/lib/mock-data";
import { Supplier, StatusVariant } from "@/types";

const supplierStatusMap: Record<Supplier["status"], StatusVariant> = {
  active: "success",
  inactive: "neutral",
  pending: "warning",
};

function renderRating(rating: number) {
  return "★".repeat(rating) + "☆".repeat(5 - rating);
}

export default function SuppliersPage() {
  const [search, setSearch] = useState("");

  const filtered = mockSuppliers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.country.toLowerCase().includes(search.toLowerCase()) ||
      s.contactEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Suppliers"
        subtitle={`${mockSuppliers.length} registered suppliers`}
        searchPlaceholder="Search suppliers…"
        onSearch={setSearch}
      />

      <DataTable<Supplier>
        keyField="id"
        data={filtered}
        columns={[
          { key: "name", header: "Supplier" },
          { key: "contactEmail", header: "Email" },
          { key: "phone", header: "Phone" },
          { key: "country", header: "Country" },
          {
            key: "rating",
            header: "Rating",
            render: (r) => <span style={{ color: "#f59e0b", letterSpacing: "2px" }}>{renderRating(r.rating)}</span>,
          },
          {
            key: "status",
            header: "Status",
            render: (r) => <StatusBadge label={r.status} variant={supplierStatusMap[r.status]} />,
          },
          { key: "productsSupplied", header: "Products" },
        ]}
      />
    </>
  );
}
