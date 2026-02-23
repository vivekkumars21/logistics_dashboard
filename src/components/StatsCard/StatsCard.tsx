import styles from "./StatsCard.module.css";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "blue" | "green";
}

export default function StatsCard({ title, value, icon, trend, variant = "default" }: StatsCardProps) {
  return (
    <div className={`${styles.card} ${variant !== "default" ? styles[variant] : ""}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.value}>{typeof value === "number" ? value.toLocaleString() : value}</div>
      {trend && (
        <div className={`${styles.trend} ${trend.positive ? styles.positive : styles.negative}`}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: 4 }}>
            {trend.positive ? (
              <path d="M2 10L7 5L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            ) : (
              <path d="M2 5L7 10L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            )}
          </svg>
          {trend.value}
        </div>
      )}
    </div>
  );
}
