"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "./login.module.css";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already logged in
  if (isAuthenticated) {
    router.push("/");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAdmin = async () => {
    setError("");
    setIsLoading(true);
    try {
      await login("admin@example.com", "admin123");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoUser = async () => {
    setError("");
    setIsLoading(true);
    try {
      await login("user@example.com", "user123");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoViewer = async () => {
    setError("");
    setIsLoading(true);
    try {
      await login("viewer@example.com", "viewer123");
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginBox}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <svg width="40" height="40" viewBox="0 0 40" fill="none">
              <rect width="40" height="40" rx="12" fill="#1a9bfc" />
              <path d="M12 20l6 6 12-12" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1>Logistics Dashboard</h1>
          <p>Supply Chain Management System</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              required
              className={styles.input}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
              required
              className={styles.input}
            />
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <button type="submit" className={styles.submitBtn} disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className={styles.divider}>Or try demo accounts</div>

        <div className={styles.demoButtons}>
          <button
            type="button"
            className={`${styles.demoBtn} ${styles.adminBtn}`}
            onClick={handleDemoAdmin}
            disabled={isLoading}
          >
            <span className={styles.role}>Admin</span>
            <span className={styles.credentials}>admin@example.com</span>
          </button>
          <button
            type="button"
            className={`${styles.demoBtn} ${styles.userBtn}`}
            onClick={handleDemoUser}
            disabled={isLoading}
          >
            <span className={styles.role}>User</span>
            <span className={styles.credentials}>user@example.com</span>
          </button>
          <button
            type="button"
            className={`${styles.demoBtn} ${styles.viewerBtn}`}
            onClick={handleDemoViewer}
            disabled={isLoading}
          >
            <span className={styles.role}>Viewer</span>
            <span className={styles.credentials}>viewer@example.com</span>
          </button>
        </div>

        <div className={styles.footer}>
          <p><strong>Demo Credentials:</strong></p>
          <ul>
            <li><strong>Admin:</strong> admin@example.com / admin123 (Upload & Manage)</li>
            <li><strong>User:</strong> user@example.com / user123 (Upload & Edit)</li>
            <li><strong>Viewer:</strong> viewer@example.com / viewer123 (View only)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
