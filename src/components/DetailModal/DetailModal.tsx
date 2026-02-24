"use client";

import { useState, useEffect } from "react";
import { PLANTFLOW7Record } from "@/types";
import styles from "./DetailModal.module.css";

interface DetailModalProps {
  record: PLANTFLOW7Record | null;
  open: boolean;
  onClose: () => void;
}

interface HistoryEntry {
  upload_date: string;
  mode: string;
  case_count: number;
  nc_cc: string;
  location: string;
  is_ready: boolean;
  pgi_no: string;
  preferred_edd: string;
  dispatch_remark: string;
}

interface HistorySummary {
  totalCases: number;
  daysPresent: number;
  readyCount: number;
}

const formatDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export default function DetailModal({ record, open, onClose }: DetailModalProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch plant history when record changes
  useEffect(() => {
    if (!open || !record) return;
    setHistoryLoading(true);
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

  const infoCards = [
    { label: "MODE", value: record.mode || "—", sub: `Cases: ${record.case_count ?? 0}` },
    { label: "LOCATION", value: record.location || "—", sub: `NC/CC: ${record.nc_cc || "—"}` },
    { label: "PGI NO.", value: record.pgi_no || "—", sub: `PGI DT: ${formatDate(record.pgi_date)}` },
    { label: "DELIVERY", value: formatDate(record.preferred_edd), sub: record.is_ready ? "✓ Ready" : "⧗ In Process" },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div>
            <div className={styles.breadcrumb}>Dashboard / Shipments / <strong>{record.plant}</strong></div>
            <h2 className={styles.title}>
              PGI #{record.pgi_no || "—"}
              <span className={`${styles.statusTag} ${record.is_ready ? styles.statusReady : styles.statusProcess}`}>
                {record.is_ready ? "Ready" : "In Process"}
              </span>
            </h2>
            <div className={styles.subtitle}>
              Dispatch: {record.dispatch_remark || "Pending"} • Remarks: {record.remarks || "None"}
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

        {/* Timeline */}
        <div className={styles.contentGrid}>
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Upload History</h3>
              {summary && (
                <span className={styles.sectionBadge}>{summary.daysPresent} uploads</span>
              )}
            </div>

            {historyLoading ? (
              <div className={styles.loadingText}>Loading history...</div>
            ) : history.length === 0 ? (
              <div className={styles.emptyText}>No history in last 24 days.</div>
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
                          {entry.mode} • {entry.case_count} cases
                        </span>
                        <span className={styles.timelineDate}>{formatDate(entry.upload_date)}</span>
                      </div>
                      <div className={styles.timelineDetail}>
                        NC/CC: {entry.nc_cc} • {entry.dispatch_remark || "Standard"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Summary */}
            {summary && (
              <div className={styles.summaryBar}>
                <span>Total Cases: <strong>{summary.totalCases}</strong></span>
                <span>Ready: <strong>{summary.readyCount}</strong></span>
                <span>In Process: <strong>{summary.daysPresent - summary.readyCount}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
