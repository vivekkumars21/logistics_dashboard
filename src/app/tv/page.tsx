"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient, RealtimeChannel } from "@supabase/supabase-js";
import styles from "./tv.module.css";

interface PlantEntry {
  id: number;
  plant: string;
  location: string;
  isReady: boolean;
}

interface PlantStatusResponse {
  entries: PlantEntry[];
  batch: { id: number; upload_date: string } | null;
  summary: {
    total: number;
    ready: number;
    pending: number;
  };
}

export default function TVViewPage() {
  const [data, setData] = useState<PlantStatusResponse | null>(null);
  const [clock, setClock] = useState(new Date());
  const channelRef = useRef<RealtimeChannel | null>(null);

  const fetchPlantStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/plant-status");
      const json: PlantStatusResponse = await res.json();
      setData(json);
    } catch (err) {
      console.error("Failed to fetch plant status:", err);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchPlantStatus();
  }, [fetchPlantStatus]);

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Supabase Realtime subscription — auto-refresh on any record change
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return;

    const supabase = createClient(url, key);

    const channel = supabase
      .channel("tv-logistics-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "logistics_records",
        },
        () => {
          fetchPlantStatus();
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchPlantStatus]);

  // Fallback polling every 10s
  useEffect(() => {
    const interval = setInterval(fetchPlantStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchPlantStatus]);

  const entries = data?.entries ?? [];
  const summary = data?.summary ?? { total: 0, ready: 0, pending: 0 };
  const rawDate = data?.batch?.upload_date ?? "";
  const batchDate = (() => {
    if (!rawDate) return "—";
    if (/^\d{2}-\d{2}-\d{4}$/.test(rawDate)) return rawDate;
    const dt = new Date(rawDate.includes("T") ? rawDate : rawDate + "T00:00:00");
    if (isNaN(dt.getTime())) return rawDate;
    const dd = String(dt.getDate()).padStart(2, "0");
    const mm = String(dt.getMonth() + 1).padStart(2, "0");
    const yyyy = dt.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  })();

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.title}>Plant Readiness</h1>
          <span className={styles.batchLabel}>{batchDate}</span>
        </div>
        <div className={styles.headerRight}>
          <span className={styles.stat}>{summary.ready}<small>/{summary.total}</small> ready</span>
          <span className={styles.clock}>
            {clock.toLocaleTimeString("en-IN", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      </header>

      {/* Plant Grid */}
      <div className={styles.grid}>
        {entries.map((entry) => (
          <div
            key={entry.id}
            className={`${styles.card} ${
              entry.isReady ? styles.cardDone : styles.cardOpen
            }`}
          >
            <span className={styles.plantId}>{entry.plant}</span>
            <span className={styles.location}>{entry.location}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className={styles.footer}>
        <span className={styles.live}>
          <span className={styles.liveDot} />
          LIVE
        </span>
        <span className={styles.footerText}>Auto-updating via Realtime</span>
      </footer>
    </div>
  );
}
