"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import styles from "./Navbar.module.css";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/tv", label: "View" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.logoSection}>
          <svg className={styles.logoIcon} width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#9b2fa0" fillOpacity="0.12" />
            <path d="M8 14l4 4 8-8" stroke="#9b2fa0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={styles.logoText}>ZDC Hub Operation</span>
        </div>

        <nav className={`${styles.nav} ${mobileMenuOpen ? styles.mobileOpen : ""}`}>
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <button 
            className={styles.hamburger} 
            aria-label="Toggle menu"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        </div>
      </div>
    </header>
  );
}
