"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import styles from "./Navbar.module.css";

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/tv", label: "View" },
  { href: "/settings", label: "Settings" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className={styles.navbar}>
      <div className={styles.inner}>
        <div className={styles.logoSection}>
          <svg className={styles.logoIcon} width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect width="28" height="28" rx="8" fill="#1a9bfc" />
            <path d="M8 14l4 4 8-8" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span className={styles.logoText}>Logistics</span>
        </div>

        <nav className={`${styles.nav} ${mobileMenuOpen ? styles.mobileOpen : ""}`}>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`${styles.navItem} ${pathname === item.href ? styles.active : ""}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.actions}>
          <button className={styles.iconBtn} aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a5 5 0 00-5 5v3l-1.3 2.6a.5.5 0 00.45.7h11.7a.5.5 0 00.45-.7L15 10V7a5 5 0 00-5-5z" stroke="currentColor" strokeWidth="1.5" />
              <path d="M8 15a2 2 0 004 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>

          <div className={styles.profileContainer}>
            <button 
              className={`${styles.avatar} ${profileMenuOpen ? styles.avatarActive : ""}`}
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              title={user?.name}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="8" r="3.5" stroke="#fff" strokeWidth="1.5" />
                <path d="M3 18c0-3.3 3.1-6 7-6s7 2.7 7 6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            {profileMenuOpen && (
              <div className={styles.profileMenu}>
                <div className={styles.profileHeader}>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user?.name}</div>
                    <div className={styles.userEmail}>{user?.email}</div>
                  </div>
                </div>
                <div className={styles.profileDivider} />
                <div className={styles.profileRole}>
                  <span className={styles.roleLabel}>Role:</span>
                  <span className={`${styles.roleBadge} ${styles[`role-${user?.role}`]}`}>
                    {user?.role === "admin" ? "👤 Admin" : user?.role === "user" ? "👥 User" : "👁️ Viewer"}
                  </span>
                </div>
                <button 
                  className={styles.logoutBtn}
                  onClick={() => {
                    setProfileMenuOpen(false);
                    handleLogout();
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3m4-4l3-3m0 0l-3-3m3 3H7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Logout
                </button>
              </div>
            )}
          </div>

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
