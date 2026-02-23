import { StatusVariant } from "@/types";
import styles from "./StatusBadge.module.css";

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
}

const variantMap: Record<StatusVariant, string> = {
  success: styles.success,
  warning: styles.warning,
  danger:  styles.danger,
  info:    styles.info,
  neutral: styles.neutral,
};

export default function StatusBadge({ label, variant }: StatusBadgeProps) {
  return (
    <span className={`${styles.badge} ${variantMap[variant]}`}>
      <span className={styles.dot} />
      {label}
    </span>
  );
}
