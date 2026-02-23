"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import StatsCard from "@/components/StatsCard/StatsCard";
import DataTable from "@/components/DataTable/DataTable";
import StatusBadge from "@/components/StatusBadge/StatusBadge";
import UploadModal from "@/components/UploadModal/UploadModal";
import PlantHistory from "@/components/PlantHistory/PlantHistory";
import { LogisticsRecord, UploadBatch, DashboardStats, RecordsResponse } from "@/types";
import styles from "./dashboard.module.css";

type TabKey = "in_process" | "ready" | "all";

const tabs: { key: TabKey; label: string }[] = [
  { key: "in_process", label: "In Process" },
  { key: "ready", label: "Ready" },
  { key: "all", label: "All Shipments" },
];

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(v);

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("in_process");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  // Plant history modal
  const [historyPlant, setHistoryPlant] = useState<string | null>(null);

  // Data from API
  const [batches, setBatches] = useState<UploadBatch[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState<number | null>(null);
  const [data, setData] = useState<RecordsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch batches list
  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/batches");
      const list: UploadBatch[] = await res.json();
      setBatches(list);
      if (list.length > 0 && selectedBatchId === null) {
        setSelectedBatchId(list[0].id);
      }
    } catch (err) {
      console.error("Failed to fetch batches:", err);
    }
  }, [selectedBatchId]);

  // Fetch records for selected batch
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const url = selectedBatchId
        ? `/api/records?batchId=${selectedBatchId}`
        : "/api/records";
      const res = await fetch(url);
      const json: RecordsResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch records:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedBatchId]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Toggle ready status
  const toggleReady = async (recordId: number, currentReady: boolean) => {
    try {
      await fetch(`/api/records/${recordId}/ready`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_ready: !currentReady }),
      });
      fetchRecords();
    } catch (err) {
      console.error("Failed to toggle ready:", err);
    }
  };

  // After successful upload
  const handleUploadSuccess = () => {
    setSelectedBatchId(null);
    fetchBatches();
    fetchRecords();
  };

  // Determine which list to show based on tab
  const displayRecords = useMemo(() => {
    if (!data) return [];
    let list: LogisticsRecord[];
    if (activeTab === "in_process") {
      list = data.in_process_list;
    } else if (activeTab === "ready") {
      list = data.ready_list;
    } else {
      list = [...data.in_process_list, ...data.ready_list];
    }

    // Client-side search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.plant.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.invoice_no.toLowerCase().includes(q) ||
          r.pgi_no.toLowerCase().includes(q) ||
          r.mode.toLowerCase().includes(q) ||
          r.dispatch_remark.toLowerCase().includes(q)
      );
    }

    return list;
  }, [data, activeTab, search]);

  const stats: DashboardStats = data?.stats ?? {
    total: 0,
    inProcess: 0,
    ready: 0,
    totalAmount: 0,
    totalWeight: 0,
    totalVolume: 0,
  };

  const hasBatches = batches.length > 0;

  return (
    <>
      {/* Upload Modal */}
      <UploadModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />

      {/* Plant History Modal */}
      <PlantHistory
        plant={historyPlant ?? ""}
        open={!!historyPlant}
        onClose={() => setHistoryPlant(null)}
      />

      {/* Stats Row */}
      <div className={styles.statsGrid}>
        <StatsCard
          title="Total Records"
          value={stats.total}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <path d="M2 8h16" stroke="currentColor" strokeWidth="1.5" />
              <path d="M6 2v4M14 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
          trend={{ value: `${stats.totalWeight.toFixed(1)} kg total weight`, positive: true }}
          variant="blue"
        />
        <StatsCard
          title="In Process"
          value={stats.inProcess}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="3" width="14" height="14" rx="3" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 10h6M10 7v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          }
          trend={{ value: `${stats.totalVolume.toFixed(1)} total volume`, positive: true }}
          variant="blue"
        />
        <StatsCard
          title="Ready"
          value={stats.ready}
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M7 10l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          }
          trend={{ value: formatCurrency(stats.totalAmount), positive: true }}
          variant="green"
        />
      </div>

      {/* Search & Filters Bar */}
      <div className={styles.filterBar}>
        <div className={styles.searchBox}>
          <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search plant, invoice, location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filterGroup}>
          {hasBatches && (
            <select
              className={styles.filterBtn}
              value={selectedBatchId ?? ""}
              onChange={(e) => setSelectedBatchId(Number(e.target.value))}
            >
              {batches.map((b) => (
                <option key={b.id} value={b.id}>
                  {new Date(b.upload_date + "T00:00:00").toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </option>
              ))}
            </select>
          )}
          <button className={styles.newShipmentBtn} onClick={() => setUploadOpen(true)}>
            + Upload Excel
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`${styles.tab} ${activeTab === tab.key ? styles.activeTab : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
            {tab.key === "in_process" && <span className={styles.tabCount}>{stats.inProcess}</span>}
            {tab.key === "ready" && <span className={styles.tabCount}>{stats.ready}</span>}
            {tab.key === "all" && <span className={styles.tabCount}>{stats.total}</span>}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.emptyState}>Loading...</div>
      ) : !hasBatches ? (
        <div className={styles.emptyState}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ marginBottom: 16 }}>
            <rect x="6" y="10" width="36" height="32" rx="4" stroke="#d1d5db" strokeWidth="2" />
            <path d="M24 18v12M18 24l6-6 6 6" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <h3>No data yet</h3>
          <p>Upload your first Excel file to get started.</p>
          <button className={styles.newShipmentBtn} onClick={() => setUploadOpen(true)} style={{ marginTop: 16 }}>
            + Upload Excel
          </button>
        </div>
      ) : (
        <DataTable
          keyField="id"
          data={displayRecords}
          pageSize={10}
          totalLabel="entries"
          columns={[
            {
              key: "is_ready",
              header: "Ready",
              render: (row) => (
                <input
                  type="checkbox"
                  checked={row.is_ready}
                  onChange={() => toggleReady(row.id, row.is_ready)}
                  className={styles.checkbox}
                />
              ),
            },
            {
              key: "plant",
              header: "Plant",
              render: (row) => (
                <button
                  className={styles.plantBtn}
                  onClick={() => setHistoryPlant(row.plant)}
                  title={`View 7-day history for ${row.plant}`}
                >
                  {row.plant}
                </button>
              ),
            },
            { key: "location", header: "Location" },
            { key: "pgi_no", header: "PGI No." },
            { key: "pgi_date", header: "PGI Date" },
            { key: "invoice_no", header: "Invoice No." },
            { key: "mode", header: "Mode" },
            { key: "case_count", header: "Case" },
            {
              key: "weight",
              header: "Weight",
              render: (row) => (row.weight ?? 0).toFixed(2),
            },
            {
              key: "volume",
              header: "Volume",
              render: (row) => (row.volume ?? 0).toFixed(2),
            },
            {
              key: "amount",
              header: "Amount",
              render: (row) => formatCurrency(row.amount ?? 0),
            },
            { key: "preferred_mode", header: "Pref. Mode" },
            { key: "preferred_edd", header: "Pref. EDD" },
            {
              key: "dispatch_remark",
              header: "Dispatch",
              render: (row) => (
                <StatusBadge
                  label={row.dispatch_remark || "—"}
                  variant={
                    row.dispatch_remark === "DRP"
                      ? "info"
                      : row.dispatch_remark === "AUTO REPL"
                      ? "warning"
                      : row.dispatch_remark === "ADDI"
                      ? "neutral"
                      : "neutral"
                  }
                />
              ),
            },
          ]}
        />
      )}
    </>
  );
}
