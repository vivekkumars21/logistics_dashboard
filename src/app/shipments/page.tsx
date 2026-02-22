"use client";

import { useState } from "react";
import PageHeader from "@/components/PageHeader/PageHeader";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import { mockShipments } from "@/lib/mock-data";
import { Shipment, StatusVariant } from "@/types";

const shipmentStatusMap: Record<Shipment["status"], StatusVariant> = {
  preparing: "neutral",
  in_transit: "info",
  customs: "warning",
  delivered: "success",
  delayed: "danger",
};

export default function ShipmentsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockShipments.filter(
    (s) =>
      s.trackingNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.carrier.toLowerCase().includes(search.toLowerCase()) ||
      s.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHeader
        title="Shipments"
        subtitle={`Tracking ${mockShipments.length} shipments`}
        searchPlaceholder="Search tracking #, carrier…"
        onSearch={setSearch}
      />

      <DataTable<Shipment>
        keyField="id"
        data={filtered}
        columns={[
          { key: "trackingNumber", header: "Tracking #" },
          { key: "orderNumber", header: "Order #" },
          { key: "carrier", header: "Carrier" },
          {
            key: "status",
            header: "Status",
            render: (r) => (
              <StatusBadge label={r.status.replace("_", " ")} variant={shipmentStatusMap[r.status]} />
            ),
          },
          { key: "origin", header: "Origin" },
          { key: "destination", header: "Destination" },
          { key: "departureDate", header: "Departed" },
          { key: "estimatedArrival", header: "ETA" },
          { key: "weight", header: "Weight (kg)", render: (r) => r.weight.toLocaleString() },
        ]}
      />
    </>
  );
}
