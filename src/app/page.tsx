"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/lib/auth-context";
import StatsCard from "@/components/StatsCard/StatsCard";
import DataTable from "@/components/DataTable/DataTable";
import UploadModal from "@/components/UploadModal/UploadModal";
import DetailModal from "@/components/DetailModal/DetailModal";
import RecordDetailModal from "@/components/RecordDetailModal/RecordDetailModal";
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

const formatDate = (d: string) => {
  if (!d) return "—";
  // If already in DD-MM-YYYY, return as-is
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) return d;
  // Try to parse
  const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// ── Dispatch Remark options with colors ──
const DISPATCH_OPTIONS = [
  { value: "DRP", label: "DRP", bg: "#dbeafe", color: "#1e40af", dot: "#3b82f6" },
  { value: "AUTO REPL", label: "AUTO REPL", bg: "#fff3e0", color: "#e65100", dot: "#f57c00" },
  { value: "ADDI", label: "ADDI", bg: "#f3e8ff", color: "#7c3aed", dot: "#8b5cf6" },
  { value: "NOT BY AIR", label: "NOT BY AIR", bg: "#fee2e2", color: "#991b1b", dot: "#ef4444" },
  { value: "SELECT MODE AS PER EDD", label: "SELECT MODE AS PER EDD", bg: "#dcfce7", color: "#166534", dot: "#22c55e" },
] as const;

function getDispatchStyle(value: string) {
  const opt = DISPATCH_OPTIONS.find((o) => o.value === value);
  if (opt) return { bg: opt.bg, color: opt.color, dot: opt.dot };
  return { bg: "#f3f4f6", color: "#374151", dot: "#9ca3af" };
}

function DispatchRemarkCell({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  // Close on outside click or scroll
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      // Ignore clicks on the dropdown (portaled) or the badge button
      if (ref.current?.contains(target)) return;
      if (btnRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onScroll = () => setOpen(false);
    document.addEventListener("mousedown", handler);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      document.removeEventListener("mousedown", handler);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  const handleOpen = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownHeight = 320; // approximate max height
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow < dropdownHeight ? rect.top - dropdownHeight : rect.bottom + 4;
      setPos({ top, left: rect.left });
    }
    setOpen(!open);
  };

  const style = getDispatchStyle(value);

  return (
    <div className={styles.dispatchCell}>
      <button
        ref={btnRef}
        className={styles.dispatchBadge}
        style={{ background: style.bg, color: style.color }}
        onClick={handleOpen}
        title="Change dispatch remark"
      >
        <span className={styles.dispatchDot} style={{ background: style.dot }} />
        {value || "—"}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 4 }}>
          <path d="M2.5 4L5 6.5L7.5 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>

      {open && createPortal(
        <div
          ref={ref}
          className={styles.dispatchDropdown}
          style={{ position: "fixed", top: pos.top, left: pos.left }}
        >
          {DISPATCH_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              className={`${styles.dispatchOpt} ${value === opt.value ? styles.dispatchOptActive : ""}`}
              style={{ background: value === opt.value ? opt.bg : undefined }}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              <span className={styles.dispatchDot} style={{ background: opt.dot }} />
              {opt.label}
            </button>
          ))}
          <div className={styles.dispatchCustom}>
            <input
              type="text"
              className={styles.dispatchCustomInput}
              placeholder="Custom remark..."
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && custom.trim()) {
                  onChange(custom.trim());
                  setCustom("");
                  setOpen(false);
                }
              }}
            />
            <button
              className={styles.dispatchCustomBtn}
              disabled={!custom.trim()}
              onClick={() => { onChange(custom.trim()); setCustom(""); setOpen(false); }}
            >
              Set
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TabKey>("in_process");
  const [search, setSearch] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Plant history + remarks modal (click on plant ID)
  const [historyRecord, setHistoryRecord] = useState<LogisticsRecord | null>(null);

  // Raw record detail modal (click on three dots)
  const [rawDetailRecord, setRawDetailRecord] = useState<LogisticsRecord | null>(null);

  // Delete confirmation modal
  const [deleteConfirm, setDeleteConfirm] = useState<LogisticsRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  // Helper to update a record in local state without re-fetching
  const updateRecordLocally = (recordId: number, updates: Partial<LogisticsRecord>) => {
    setData((prev) => {
      if (!prev) return prev;
      const patch = (list: LogisticsRecord[]) =>
        list.map((r) => (r.id === recordId ? { ...r, ...updates } : r));

      const newInProcess = patch(prev.in_process_list);
      const newReady = patch(prev.ready_list);

      // If is_ready changed, move the record between lists
      if ("is_ready" in updates) {
        const allPatched = [...newInProcess, ...newReady];
        return {
          ...prev,
          in_process_list: allPatched.filter((r) => !r.is_ready),
          ready_list: allPatched.filter((r) => r.is_ready),
          stats: {
            ...prev.stats,
            inProcess: allPatched.filter((r) => !r.is_ready).length,
            ready: allPatched.filter((r) => r.is_ready).length,
          },
        };
      }

      return { ...prev, in_process_list: newInProcess, ready_list: newReady };
    });
  };

  // Update remark
  const updateRemark = async (recordId: number, remark: string) => {
    updateRecordLocally(recordId, { remark });
    try {
      await fetch(`/api/records/${recordId}/ready`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remark }),
      });
    } catch (err) {
      console.error("Failed to update remark:", err);
      fetchRecords(); // rollback on error
    }
  };
  // Update dispatch remark
  const updateDispatchRemark = async (recordId: number, dispatch_remark: string) => {
    updateRecordLocally(recordId, { dispatch_remark });
    try {
      await fetch(`/api/records/${recordId}/ready`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dispatch_remark }),
      });
    } catch (err) {
      console.error("Failed to update dispatch remark:", err);
      fetchRecords();
    }
  };
  // Toggle ready status
  const toggleReady = async (recordId: number, currentReady: boolean) => {
    updateRecordLocally(recordId, { is_ready: !currentReady });
    try {
      await fetch(`/api/records/${recordId}/ready`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_ready: !currentReady }),
      });
    } catch (err) {
      console.error("Failed to toggle ready:", err);
      fetchRecords(); // rollback on error
    }
  };

  // Delete record
  const deleteRecord = async (record: LogisticsRecord) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/records/${record.id}/ready`, {
        method: "DELETE",
      });
      if (!res.ok) {
        throw new Error("Failed to delete record");
      }
      // Remove from local state
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          in_process_list: prev.in_process_list.filter((r) => r.id !== record.id),
          ready_list: prev.ready_list.filter((r) => r.id !== record.id),
          stats: {
            ...prev.stats,
            inProcess: prev.in_process_list.filter((r) => r.id !== record.id).length,
            ready: prev.ready_list.filter((r) => r.id !== record.id).length,
          },
        };
      });
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Failed to delete record:", err);
      fetchRecords(); // rollback on error
    } finally {
      setIsDeleting(false);
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
          r.dispatch_remark.toLowerCase().includes(q) ||
          (r.remark && r.remark.toLowerCase().includes(q))
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

      {/* Detail Modal — Plant history + remarks (plant click) */}
      <DetailModal
        record={historyRecord}
        open={!!historyRecord}
        onClose={() => setHistoryRecord(null)}
        onRemarkSave={updateRemark}
      />

      {/* Record Detail Modal — Raw Excel fields (three dots) */}
      <RecordDetailModal
        record={rawDetailRecord}
        open={!!rawDetailRecord}
        onClose={() => setRawDetailRecord(null)}
        onSave={async (recordId, updates) => {
          updateRecordLocally(recordId, updates);
          // Also update rawDetailRecord so the modal reflects changes
          setRawDetailRecord((prev) => prev ? { ...prev, ...updates } as LogisticsRecord : prev);
          try {
            await fetch(`/api/records/${recordId}/ready`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(updates),
            });
          } catch (err) {
            console.error("Failed to save record:", err);
            fetchRecords();
          }
        }}
      />

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className={styles.confirmOverlay} onClick={() => !isDeleting && setDeleteConfirm(null)}>
          <div className={styles.confirmModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.confirmHeader}>Delete Record</div>
            <div className={styles.confirmBody}>
              <p>Are you sure you want to delete this record?</p>
              <p className={styles.confirmDetails}>
                <strong>{deleteConfirm.plant}</strong> — Invoice: {deleteConfirm.invoice_no}
              </p>
              <p className={styles.confirmWarning}>This action cannot be undone.</p>
            </div>
            <div className={styles.confirmFooter}>
              <button
                className={styles.btnCancel}
                onClick={() => setDeleteConfirm(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                className={styles.btnDelete}
                onClick={() => deleteRecord(deleteConfirm)}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Role Info */}
      {user && (
        <div className={`${styles.roleInfo} ${styles[`roleInfo-${user.role}`]}`}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <circle cx="9" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 14c0-2.2 3-4 7-4s7 1.8 7 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span className={styles.roleText}>
            Logged in as <strong>{user.name}</strong> ({user.role === "admin" ? "👤 Administrator" : user.role === "user" ? "👥 User" : "👁️ Viewer"})
          </span>
        </div>
      )}

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
                  {(() => {
                    const dt = new Date(b.upload_date + "T00:00:00");
                    const dd = String(dt.getDate()).padStart(2, "0");
                    const mm = String(dt.getMonth() + 1).padStart(2, "0");
                    const yyyy = dt.getFullYear();
                    return `${dd}-${mm}-${yyyy}`;
                  })()}
                </option>
              ))}
            </select>
          )}
          {user?.role !== "viewer" && (
            <button className={styles.newShipmentBtn} onClick={() => setUploadOpen(true)}>
              + Upload Excel
            </button>
          )}
          {user?.role === "admin" && (
            <button 
              className={`${styles.editModeBtn} ${editMode ? styles.editModeActive : ""}`}
              onClick={() => setEditMode(!editMode)}
              title={editMode ? "Exit edit mode" : "Enter edit mode to delete records"}
            >
              {editMode ? "✓ Edit Mode" : "Edit"}
            </button>
          )}
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
      ) : displayRecords.length === 0 ? (
        <div className={`${styles.emptyState} ${styles.fadeIn}`} key={activeTab}>
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" style={{ marginBottom: 14 }}>
            <circle cx="22" cy="22" r="20" stroke="#d1d5db" strokeWidth="1.5" />
            <path d="M16 22h12M22 16v12" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <h3>
            {activeTab === "ready"
              ? "No ready shipments"
              : activeTab === "in_process"
              ? "All shipments are ready"
              : "No shipments found"}
          </h3>
          <p>
            {activeTab === "ready"
              ? "Mark shipments as ready using the checkbox."
              : activeTab === "in_process"
              ? "All items have been marked as ready."
              : "Try a different search or batch."}
          </p>
        </div>
      ) : (
        <div className={styles.fadeIn} key={activeTab}>
        <DataTable
          keyField="id"
          data={displayRecords}
          pageSize={10}
          totalLabel="entries"
          onDelete={(row) => setDeleteConfirm(row as LogisticsRecord)}
          showDeleteButton={editMode}
          columns={[
            {
              key: "is_ready",
              header: "Ready",
              render: (row) => (
                <input
                  type="checkbox"
                  checked={row.is_ready}
                  onChange={() => toggleReady(row.id, row.is_ready)}
                  disabled={user?.role === "viewer"}
                  className={styles.checkbox}
                />
              ),
            },
            {
              key: "plant",
              header: "plant",
              render: (row) => (
                <button
                  className={styles.plantBtn}
                  onClick={() => setHistoryRecord(row)}
                  title={`View history for ${row.plant}`}
                >
                  {row.plant}
                </button>
              ),
            },
            { key: "location", header: "Location" },
            { key: "pgi_no", header: "PGI NO." },
            { key: "invoice_no", header: "Invoice No." },
            {
              key: "invoice_date",
              header: "INV DT.",
              render: (row) => formatDate(row.invoice_date),
            },
            { key: "preferred_mode", header: "Preferred Mode" },
            {
              key: "preferred_edd",
              header: "Preferred EDD",
              render: (row) => formatDate(row.preferred_edd),
            },
            {
              key: "dispatch_remark",
              header: "Dispatch Remark",
              render: (row) => (
                user?.role === "viewer" ? (
                  <span style={{ fontSize: "0.82rem", color: "var(--text-secondary, #6b7280)" }}>
                    {row.dispatch_remark || "—"}
                  </span>
                ) : (
                  <DispatchRemarkCell
                    value={row.dispatch_remark}
                    onChange={(val) => updateDispatchRemark(row.id, val)}
                  />
                )
              ),
            },
            {
              key: "actions",
              header: "",
              render: (row) => (
                <button
                  className={styles.dotsBtn}
                  onClick={() => setRawDetailRecord(row)}
                  title="View all fields"
                  aria-label="In detail"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="3" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="8" r="1.5" fill="currentColor" />
                    <circle cx="8" cy="13" r="1.5" fill="currentColor" />
                  </svg>
                </button>
              ),
            },
          ]}
        />
        </div>
      )}
    </>
  );
}
