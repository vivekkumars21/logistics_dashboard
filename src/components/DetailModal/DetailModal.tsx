"use client";

import { useState, useEffect } from "react";
import { LogisticsRecord } from "@/types";
import styles from "./DetailModal.module.css";

interface DetailModalProps {
  record: LogisticsRecord | null;
  open: boolean;
  onClose: () => void;
  onRemarkSave: (recordId: number, remark: string) => void;
}

interface HistoryEntry {
  upload_date: string;
  mode: string;
  weight: number;
  amount: number;
  invoice_no: string;
  eod_data: string;
  case_count: number;
  volume: number;
  location: string;
  is_ready: boolean;
}

interface HistorySummary {
  totalWeight: number;
  totalAmount: number;
  totalVolume: number;
  daysPresent: number;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(v);

const formatDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export default function DetailModal({ record, open, onClose, onRemarkSave }: DetailModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Fetch plant history when record changes
  useEffect(() => {
    if (!open || !record) return;
    setHistoryLoading(true);
    setRemarkText("");
    setSaveStatus("idle");
    fetch(`/api/plant-history?plant=${encodeURIComponent(record.plant)}`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data.history ?? []);
        setSummary(data.summary ?? null);
      })
      .catch(console.error)
      .finally(() => setHistoryLoading(false));
  }, [open, record]);

  if (!open || !record) return null;

  const handleSaveRemark = () => {
    if (!remarkText.trim()) return;
    setSaveStatus("saving");
    const existingRemark = record.remark || "";
    const timestamp = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
    const newEntry = `[${timestamp}] ${remarkText.trim()}`;
    const updated = existingRemark ? `${newEntry}\n${existingRemark}` : newEntry;
    onRemarkSave(record.id, updated);
    record.remark = updated;
    setRemarkText("");
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2500);
  };

  // Parse remarks into individual entries
  const remarkEntries = (record.remark || "")
    .split("\n")
    .filter((line) => line.trim().length > 0);

  const infoCards = [
    { label: "MODE", value: record.mode || "—", sub: `Cases: ${record.case_count ?? 0}` },
    { label: "LOCATION", value: record.location || "—", sub: `PGI: ${record.pgi_no || "—"}` },
    { label: "AMOUNT", value: formatCurrency(record.amount ?? 0), sub: `Weight: ${(record.weight ?? 0).toFixed(2)} kg` },
    { label: "EST. DELIVERY", value: record.preferred_edd ? formatDate(record.preferred_edd) : "—", sub: record.is_ready ? "Ready" : "In Process" },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>Dashboard / Shipments / <strong>{record.plant}</strong></div>
            <h2 className={styles.title}>
              Invoice #{record.invoice_no || "—"}
              <span className={`${styles.statusTag} ${record.is_ready ? styles.statusReady : styles.statusProcess}`}>
                {record.is_ready ? "Ready" : "In Process"}
              </span>
            </h2>
            <div className={styles.subtitle}>
              PGI Date: {formatDate(record.pgi_date)} • {record.dispatch_remark || "Standard"}
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Info Cards */}
        <div className={styles.infoGrid}>
          {infoCards.map((card) => (
            <div key={card.label} className={styles.infoCard}>
              <div className={styles.infoLabel}>{card.label}</div>
              <div className={styles.infoValue}>{card.value}</div>
              <div className={styles.infoSub}>{card.sub}</div>
            </div>
          ))}
        </div>

        {/* Two-column layout */}
        <div className={styles.contentGrid}>
          {/* Left — Plant History Timeline */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Plant History</h3>
              {summary && (
                <span className={styles.sectionBadge}>{summary.daysPresent} days</span>
              )}
            </div>

            {historyLoading ? (
              <div className={styles.loadingText}>Loading history...</div>
            ) : history.length === 0 ? (
              <div className={styles.emptyText}>No history in last 7 days.</div>
            ) : (
              <div className={styles.timeline}>
                {history.map((entry, i) => (
                  <div key={i} className={styles.timelineItem}>
                    <div className={styles.timelineDot}>
                      <div className={`${styles.dot} ${entry.is_ready ? styles.dotReady : styles.dotPending}`} />
                      {i < history.length - 1 && <div className={styles.timelineLine} />}
                    </div>
                    <div className={styles.timelineContent}>
                      <div className={styles.timelineRow}>
                        <span className={styles.timelineLabel}>
                          {entry.mode || "Shipment"} — {entry.invoice_no || "N/A"}
                        </span>
                        <span className={styles.timelineDate}>{formatDate(entry.upload_date)}</span>
                      </div>
                      <div className={styles.timelineDetail}>
                        {(entry.weight ?? 0).toFixed(2)} kg • {formatCurrency(entry.amount ?? 0)} • Vol: {(entry.volume ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div className={styles.summaryBar}>
                <span>Wt: <strong>{summary.totalWeight.toFixed(1)} kg</strong></span>
                <span>Vol: <strong>{summary.totalVolume.toFixed(1)}</strong></span>
                <span>Amt: <strong>{formatCurrency(summary.totalAmount)}</strong></span>
              </div>
            )}
          </div>

          {/* Right — Remarks */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Remarks</h3>
              <span className={styles.sectionBadge}>{remarkEntries.length} Notes</span>
            </div>

            <div className={styles.remarksList}>
              {remarkEntries.length === 0 ? (
                <div className={styles.emptyText}>No remarks yet.</div>
              ) : (
                remarkEntries.map((entry, i) => {
                  const match = entry.match(/^\[(.+?)\]\s*(.*)$/);
                  const time = match ? match[1] : "";
                  const text = match ? match[2] : entry;
                  return (
                    <div key={i} className={styles.remarkItem}>
                      <div className={styles.remarkBubble}>
                        <div className={styles.remarkMeta}>
                          <span className={styles.remarkAuthor}>Remark</span>
                          {time && <span className={styles.remarkTime}>{time}</span>}
                        </div>
                        <div className={styles.remarkText}>{text}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Add Remark */}
            <div className={styles.remarkInput}>
              <textarea
                className={styles.remarkTextarea}
                placeholder="Type a new remark here..."
                value={remarkText}
                onChange={(e) => setRemarkText(e.target.value)}
                rows={2}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSaveRemark();
                  }
                }}
              />
              <div className={styles.remarkActions}>
                <button
                  className={styles.saveRemarkBtn}
                  onClick={handleSaveRemark}
                  disabled={!remarkText.trim() || saveStatus === "saving"}
                >
                  {saveStatus === "saving" ? "Saving..." : "Save Remark"}
                </button>
              </div>
            </div>

            {/* Toast */}
            {saveStatus === "saved" && (
              <div className={styles.toast}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="7" fill="#22c55e" />
                  <path d="M5 8l2 2 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Remark saved successfully.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
