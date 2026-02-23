"use client";

import { useState } from "react";
import styles from "./DataTable.module.css";

interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  pageSize?: number;
  totalLabel?: string;
  onDelete?: (row: T) => void;
  showDeleteButton?: boolean;
}

export default function DataTable<T>({ columns, data, keyField, pageSize = 5, totalLabel = "entries", onDelete, showDeleteButton = false }: DataTableProps<T>) {
  const [page, setPage] = useState(1);
  const [deletingId, setDeletingId] = useState<string | number | null>(null);
  
  const totalPages = Math.ceil(data.length / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const pageData = data.slice(start, end);

  const handleDelete = async (row: T) => {
    const id = row[keyField];
    setDeletingId(id);
    if (onDelete) {
      onDelete(row);
    }
    setDeletingId(null);
  };

  const columnsToShow = showDeleteButton ? [...columns] : columns;

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columnsToShow.map((col) => (
              <th key={col.key} className={styles.th}>{col.header}</th>
            ))}
            {showDeleteButton && <th className={styles.th}>Action</th>}
          </tr>
        </thead>
        <tbody>
          {pageData.length === 0 ? (
            <tr>
              <td colSpan={columnsToShow.length + (showDeleteButton ? 1 : 0)} className={styles.empty}>
                No data available
              </td>
            </tr>
          ) : (
            pageData.map((row) => (
              <tr key={String(row[keyField])} className={styles.tr}>
                {columnsToShow.map((col) => (
                  <td key={col.key} className={styles.td}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? "")}
                  </td>
                ))}
                {showDeleteButton && (
                  <td className={styles.td}>
                    <button
                      className={styles.deleteBtn}
                      onClick={() => handleDelete(row)}
                      disabled={deletingId === row[keyField]}
                      title="Delete record"
                      aria-label="Delete"
                    >
                      {deletingId === row[keyField] ? "..." : "Delete"}
                    </button>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Pagination */}
      <div className={styles.pagination}>
        <span className={styles.pageInfo}>
          Showing {start + 1} to {Math.min(end, data.length)} of {data.length} {totalLabel}
        </span>
        <div className={styles.pageButtons}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            aria-label="Previous page"
          >
            &lt;
          </button>
          {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
            let pageNum: number;
            if (totalPages <= 3) {
              pageNum = i + 1;
            } else if (page <= 2) {
              pageNum = i + 1;
            } else if (page >= totalPages - 1) {
              pageNum = totalPages - 2 + i;
            } else {
              pageNum = page - 1 + i;
            }
            return (
              <button
                key={pageNum}
                className={`${styles.pageBtn} ${page === pageNum ? styles.active : ""}`}
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </button>
            );
          })}
          <button
            className={styles.pageBtn}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      </div>
    </div>
  );
}
