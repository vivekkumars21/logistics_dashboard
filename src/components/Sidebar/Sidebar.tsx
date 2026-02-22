"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import styles from "./Sidebar.module.css";

const navItems = [
  { href: "/",          label: "Dashboard",  icon: "📊" },
  { href: "/inventory", label: "Inventory",  icon: "📦" },
  { href: "/orders",    label: "Orders",     icon: "🛒" },
  { href: "/suppliers", label: "Suppliers",  icon: "🏭" },
  { href: "/shipments", label: "Shipments",  icon: "🚚" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <span className={styles.logoIcon}>⛓️</span>
        <span className={styles.logoText}>SupplyChain</span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
          >
            <span className={styles.navIcon}>{item.icon}</span>
            <span className={styles.navLabel}>{item.label}</span>
          </Link>
        ))}
      </nav>

      <div className={styles.footer}>
        <div className={styles.footerInfo}>
          <span className={styles.dot} />
          <span>System Online</span>
        </div>
      </div>
    </aside>
  );
}
