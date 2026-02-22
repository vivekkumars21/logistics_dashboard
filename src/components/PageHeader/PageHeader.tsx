"use client";

import { useState } from "react";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  searchPlaceholder?: string;
  onSearch?: (query: string) => void;
}

export default function PageHeader({ title, subtitle, searchPlaceholder, onSearch }: PageHeaderProps) {
  const [query, setQuery] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  return (
    <div className={styles.header}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
      {onSearch && (
        <input
          type="text"
          className={styles.search}
          placeholder={searchPlaceholder ?? "Search…"}
          value={query}
          onChange={handleChange}
        />
      )}
    </div>
  );
}
