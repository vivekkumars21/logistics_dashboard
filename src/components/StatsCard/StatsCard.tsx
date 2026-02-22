import styles from "./StatsCard.module.css";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  trend?: { value: string; positive: boolean };
  variant?: "default" | "warning" | "success" | "info";
}

export default function StatsCard({ title, value, icon, trend, variant = "default" }: StatsCardProps) {
  return (
    <div className={`${styles.card} ${styles[variant]}`}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.value}>{value}</div>
      {trend && (
        <div className={`${styles.trend} ${trend.positive ? styles.positive : styles.negative}`}>
          {trend.positive ? "↑" : "↓"} {trend.value}
        </div>
      )}
    </div>
  );
}
