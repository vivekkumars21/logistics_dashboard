"use client";

import { useState, useEffect } from "react";
import { LogisticsRecord } from "@/types";
import styles from "./RecordDetailModal.module.css";

interface RecordDetailModalProps {
  record: LogisticsRecord | null;
  open: boolean;
  onClose: () => void;
  onSave?: (recordId: number, updates: Partial<LogisticsRecord>) => void;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(v);

const formatDate = (d: string) => {
  if (!d) return "—";
  if (/^\d{2}-\d{2}-\d{4}$/.test(d)) return d;
  const dt = new Date(d.includes("T") ? d : d + "T00:00:00");
  if (isNaN(dt.getTime())) return d;
  const dd = String(dt.getDate()).padStart(2, "0");
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const yyyy = dt.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

// Fields that can be edited
const EDITABLE_KEYS = [
  "plant",
  "location",
  "pgi_no",
  "pgi_date",
  "invoice_no",
  "invoice_date",
  "mode",
  "case_count",
  "weight",
  "volume",
  "amount",
  "preferred_mode",
  "preferred_edd",
  "dispatch_remark",
  "eod_data",
] as const;

type EditableKey = (typeof EDITABLE_KEYS)[number];

interface FieldDef {
  key: EditableKey | "is_ready";
  label: string;
  display: (r: LogisticsRecord) => string;
  type?: "text" | "number";
}

const FIELDS: FieldDef[] = [
  { key: "plant", label: "Plant", display: (r) => r.plant },
  { key: "location", label: "Location", display: (r) => r.location },
  { key: "pgi_no", label: "PGI No.", display: (r) => r.pgi_no },
  { key: "pgi_date", label: "PGI Date", display: (r) => formatDate(r.pgi_date) },
  { key: "invoice_no", label: "Invoice No.", display: (r) => r.invoice_no },
  { key: "invoice_date", label: "Invoice Date", display: (r) => formatDate(r.invoice_date) },
  { key: "mode", label: "Mode", display: (r) => r.mode },
  { key: "case_count", label: "Cases", display: (r) => String(r.case_count ?? 0), type: "number" },
  { key: "weight", label: "Weight", display: (r) => `${(r.weight ?? 0).toFixed(2)} kg` , type: "number" },
  { key: "volume", label: "Volume", display: (r) => (r.volume ?? 0).toFixed(2), type: "number" },
  { key: "amount", label: "Amount", display: (r) => formatCurrency(r.amount ?? 0), type: "number" },
  { key: "preferred_mode", label: "Preferred Mode", display: (r) => r.preferred_mode || "\u2014" },
  { key: "preferred_edd", label: "Preferred EDD", display: (r) => formatDate(r.preferred_edd) },
  { key: "dispatch_remark", label: "Dispatch Remark", display: (r) => r.dispatch_remark || "\u2014" },
  { key: "eod_data", label: "EOD Data", display: (r) => r.eod_data || "\u2014" },
  { key: "is_ready", label: "Ready", display: (r) => (r.is_ready ? "Yes" : "No") },
];

export default function RecordDetailModal({ record, open, onClose, onSave }: RecordDetailModalProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Reset edit state when record changes or modal closes
  useEffect(() => {
    setEditing(false);
    setDraft({});
    setSaving(false);
    setToast("");
  }, [record, open]);

  if (!open || !record) return null;

  const startEditing = () => {
    // Populate draft with current values
    const d: Record<string, string> = {};
    EDITABLE_KEYS.forEach((k) => {
      d[k] = String((record as unknown as Record<string, unknown>)[k] ?? "");
    });
    setDraft(d);
    setEditing(true);
  };

  const cancelEditing = () => {
    setEditing(false);
    setDraft({});
  };

  const handleSave = async () => {
    if (!onSave) return;
    setSaving(true);

    // Build only changed fields
    const updates: Partial<LogisticsRecord> = {};
    EDITABLE_KEYS.forEach((k) => {
      const orig = String((record as unknown as Record<string, unknown>)[k] ?? "");
      if (draft[k] !== orig) {
        const field = FIELDS.find((f) => f.key === k);
        if (field?.type === "number") {
          (updates as Record<string, unknown>)[k] = Number(draft[k]) || 0;
        } else {
          (updates as Record<string, unknown>)[k] = draft[k];
        }
      }
    });

    if (Object.keys(updates).length === 0) {
      setEditing(false);
      setSaving(false);
      return;
    }

    onSave(record.id, updates);
    setSaving(false);
    setEditing(false);
    setToast("Saved successfully!");
    setTimeout(() => setToast(""), 2000);
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Record Details</h2>
          <div className={styles.headerActions}>
            {!editing && onSave && (
              <button className={styles.editBtn} onClick={startEditing} title="Edit">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M10.586 1.586a2 2 0 012.828 2.828l-8.5 8.5-3.5 1 1-3.5 8.172-8.828z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Edit
              </button>
            )}
            <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M4 4l10 10M14 4L4 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <div className={styles.badge}>
          <span className={styles.plantBadge}>{editing ? draft.plant || record.plant : record.plant}</span>
          <span className={styles.locBadge}>{editing ? draft.location || record.location : record.location}</span>
        </div>

        <div className={styles.grid}>
          {FIELDS.map((f) => {
            const isEditable = editing && EDITABLE_KEYS.includes(f.key as EditableKey);

            return (
              <div key={f.key} className={styles.field}>
                <span className={styles.fieldLabel}>{f.label}</span>
                {isEditable ? (
                  <input
                    className={styles.editInput}
                    type={f.type === "number" ? "number" : "text"}
                    value={draft[f.key] ?? ""}
                    onChange={(e) => setDraft((p) => ({ ...p, [f.key]: e.target.value }))}
                    step={f.type === "number" ? "any" : undefined}
                  />
                ) : (
                  <span className={styles.fieldValue}>{f.display(record)}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Edit action buttons */}
        {editing && (
          <div className={styles.editActions}>
            <button className={styles.cancelBtn} onClick={cancelEditing} disabled={saving}>
              Cancel
            </button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        )}

        {/* Toast */}
        {toast && <div className={styles.toast}>{toast}</div>}
      </div>
    </div>
  );
}
