"use client";

import { useState, useEffect } from "react";
import styles from "./PlantHistory.module.css";

interface PlantHistoryProps {
  plant: string;
  open: boolean;
  onClose: () => void;
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
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(v);

const formatDate = (d: string) => {
  if (!d) return "—";
  const dt = new Date(d + "T00:00:00");
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export default function PlantHistory({ plant, open, onClose }: PlantHistoryProps) {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [summary, setSummary] = useState<HistorySummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !plant) return;

    setLoading(true);
    fetch(`/api/plant-history?plant=${encodeURIComponent(plant)}`)
      .then((r) => r.json())
      .then((data) => {
        setHistory(data.history ?? []);
        setSummary(data.summary ?? null);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [open, plant]);

  if (!open) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <h2 className={styles.title}>
            Plant History <span className={styles.plantBadge}>{plant}</span>
          </h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className={styles.loading}>Loading history...</div>
        ) : history.length === 0 ? (
          <div className={styles.empty}>No history found for {plant} in the last 7 days.</div>
        ) : (
          <>
            {/* Summary Cards */}
            {summary && (
              <div className={styles.summaryRow}>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>Days Present</div>
                  <div className={styles.summaryValue}>{summary.daysPresent} / 7</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>Total Weight</div>
                  <div className={styles.summaryValue}>{summary.totalWeight.toFixed(2)} kg</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>Total Volume</div>
                  <div className={styles.summaryValue}>{summary.totalVolume.toFixed(2)}</div>
                </div>
                <div className={styles.summaryCard}>
                  <div className={styles.summaryLabel}>Total Amount</div>
                  <div className={styles.summaryValue}>{formatCurrency(summary.totalAmount)}</div>
                </div>
              </div>
            )}

            {/* History Table */}
            <div className={styles.tableWrap}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Mode</th>
                    <th>Weight</th>
                    <th>Volume</th>
                    <th>Amount</th>
                    <th>Invoice</th>
                    <th>EOD Data</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((entry, i) => (
                    <tr key={i}>
                      <td className={styles.dateCell}>{formatDate(entry.upload_date)}</td>
                      <td>{entry.mode || <span className={styles.dash}>—</span>}</td>
                      <td>{entry.weight?.toFixed(2) ?? <span className={styles.dash}>—</span>}</td>
                      <td>{entry.volume?.toFixed(2) ?? <span className={styles.dash}>—</span>}</td>
                      <td>{formatCurrency(entry.amount ?? 0)}</td>
                      <td>{entry.invoice_no || <span className={styles.dash}>—</span>}</td>
                      <td>{entry.eod_data || <span className={styles.dash}>—</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
