"use client";

import { LogisticsRecord } from "@/types";
import styles from "./RecordDetailModal.module.css";

interface RecordDetailModalProps {
  record: LogisticsRecord | null;
  open: boolean;
  onClose: () => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(v);

export default function RecordDetailModal({ record, open, onClose }: RecordDetailModalProps) {
  if (!open || !record) return null;

  const fields: { label: string; value: string }[] = [
    { label: "Plant", value: record.plant },
    { label: "Location", value: record.location },
    { label: "PGI No.", value: record.pgi_no },
    { label: "PGI Date", value: record.pgi_date },
    { label: "Invoice No.", value: record.invoice_no },
    { label: "Invoice Date", value: record.invoice_date },
    { label: "Mode", value: record.mode },
    { label: "Cases", value: String(record.case_count ?? 0) },
    { label: "Weight", value: `${(record.weight ?? 0).toFixed(2)} kg` },
    { label: "Volume", value: (record.volume ?? 0).toFixed(2) },
    { label: "Amount", value: formatCurrency(record.amount ?? 0) },
    { label: "Preferred Mode", value: record.preferred_mode || "—" },
    { label: "Preferred EDD", value: record.preferred_edd || "—" },
    { label: "Dispatch Remark", value: record.dispatch_remark || "—" },
    { label: "EOD Data", value: record.eod_data || "—" },
    { label: "Ready", value: record.is_ready ? "Yes" : "No" },
  ];

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Record Details</h2>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className={styles.badge}>
          <span className={styles.plantBadge}>{record.plant}</span>
          <span className={styles.locBadge}>{record.location}</span>
        </div>

        <div className={styles.grid}>
          {fields.map((f) => (
            <div key={f.label} className={styles.field}>
              <span className={styles.fieldLabel}>{f.label}</span>
              <span className={styles.fieldValue}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
