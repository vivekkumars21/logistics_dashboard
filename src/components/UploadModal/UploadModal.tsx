"use client";

import { useState, useRef } from "react";
import styles from "./UploadModal.module.css";

interface UploadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UploadModal({ open, onClose, onSuccess }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [details, setDetails] = useState<string[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const f = e.dataTransfer.files[0];
    if (f) selectFile(f);
  };

  const selectFile = (f: File) => {
    setError(null);
    setDetails(null);
    if (!f.name.endsWith(".xlsx")) {
      setError("Invalid file format. Only .xlsx files are allowed.");
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    setDetails(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed.");
        if (data.details) {
          if (Array.isArray(data.details)) {
            setDetails(data.details);
          } else if (data.details.missing?.length || data.details.extra?.length) {
            const msgs: string[] = [];
            if (data.details.missing?.length) msgs.push(`Missing columns: ${data.details.missing.join(", ")}`);
            if (data.details.extra?.length) msgs.push(`Unexpected columns: ${data.details.extra.join(", ")}`);
            setDetails(msgs);
          }
        }
        return;
      }

      setFile(null);
      onSuccess();
      onClose();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Upload Excel File</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div
          className={`${styles.dropzone} ${dragActive ? styles.dragActive : ""}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            className={styles.fileInput}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) selectFile(f);
            }}
          />
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className={styles.uploadIcon}>
            <rect x="4" y="8" width="32" height="28" rx="4" stroke="#1a9bfc" strokeWidth="2" />
            <path d="M20 14v12M14 20l6-6 6 6" stroke="#1a9bfc" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {file ? (
            <p className={styles.fileName}>{file.name}</p>
          ) : (
            <>
              <p className={styles.dropText}>Drag & drop your .xlsx file here</p>
              <p className={styles.dropHint}>or click to browse</p>
            </>
          )}
        </div>

        {error && (
          <div className={styles.error}>
            <strong>{error}</strong>
            {details && (
              <ul className={styles.errorList}>
                {details.map((d, i) => (
                  <li key={i}>{d}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={uploading}>
            Cancel
          </button>
          <button
            className={styles.uploadBtn}
            onClick={handleUpload}
            disabled={!file || uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </button>
        </div>
      </div>
    </div>
  );
}
