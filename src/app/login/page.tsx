"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import styles from "./login.module.css";

const ROLES = [
  { id: "admin",  label: "Admin",  email: "admin@example.com",  password: "admin123" },
  { id: "user",   label: "User",   email: "user@example.com",   password: "user123" },
  { id: "viewer", label: "Viewer", email: "viewer@example.com", password: "viewer123" },
] as const;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated } = useAuth();

  // --- Sign In state ---
  const [selectedRole, setSelectedRole] = useState<string>("admin");
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // --- Register state ---
  const [mode, setMode] = useState<"login" | "register">("login");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");
  const [regRole, setRegRole] = useState<"admin" | "user" | "viewer">("user");
  const [regShowPw, setRegShowPw] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState("");
  const [regLoading, setRegLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, router]);

  if (isAuthenticated) return null;

  const switchMode = (m: "login" | "register") => {
    setMode(m);
    setError("");
    setRegError("");
    setRegSuccess("");
  };

  const handleRoleSelect = (roleId: string) => {
    const role = ROLES.find((r) => r.id === roleId);
    if (role) {
      setSelectedRole(roleId);
      setEmail(role.email);
      setPassword(role.password);
      setError("");
    }
  };

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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");
    setRegSuccess("");

    if (regPassword !== regConfirm) {
      setRegError("Passwords do not match");
      return;
    }
    if (regPassword.length < 6) {
      setRegError("Password must be at least 6 characters");
      return;
    }

    setRegLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, role: regRole }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Registration failed");
      setRegSuccess(`Account created for ${data.user.name}! You can now sign in.`);
      setRegName(""); setRegEmail(""); setRegPassword(""); setRegConfirm("");
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Top bar */}
      <div className={styles.topbar}>
        <div className={styles.topbarInner}>
          <div className={styles.topbarLogo}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <rect width="24" height="24" rx="6" fill="#2563eb" />
              <path d="M4 14l2-4h10l2 4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <rect x="3" y="14" width="18" height="4" rx="1" fill="#fff" opacity="0.9" />
              <circle cx="7.5" cy="18.5" r="1.5" fill="#2563eb" />
              <circle cx="16.5" cy="18.5" r="1.5" fill="#2563eb" />
            </svg>
            <span>Logistics Dashboard</span>
          </div>
        </div>
      </div>

      {/* Card */}
      <div className={styles.cardWrap}>
        <div className={styles.card}>

          {/* Mode toggle */}
          <div className={styles.modeToggle}>
            <button
              className={`${styles.modeBtn} ${mode === "login" ? styles.modeBtnActive : ""}`}
              onClick={() => switchMode("login")}
              type="button"
            >
              Sign In
            </button>
            <button
              className={`${styles.modeBtn} ${mode === "register" ? styles.modeBtnActive : ""}`}
              onClick={() => switchMode("register")}
              type="button"
            >
              Create Account
            </button>
          </div>

          {/* ── SIGN IN ── */}
          {mode === "login" && (
            <>
              <h1 className={styles.title}>Welcome Back</h1>
              <p className={styles.subtitle}>Please select your role to continue.</p>

              {/* Role tabs */}
              <div className={styles.roleTabs}>
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    className={`${styles.roleTab} ${
                      selectedRole === role.id ? styles.roleTabActive : ""
                    }`}
                    onClick={() => handleRoleSelect(role.id)}
                    disabled={isLoading}
                  >
                    {role.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleLogin} className={styles.form}>
                <div className={styles.formGroup}>
                  <label htmlFor="email">Username or Email</label>
                  <div className={styles.inputWrap}>
                    <input
                      id="email"
                      type="email"
                      placeholder="user@logistics.co"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                      required
                      className={styles.input}
                    />
                    <span className={styles.inputIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="password">Password</label>
                  <div className={styles.inputWrap}>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                      required
                      className={styles.input}
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setShowPassword((v) => !v)} tabIndex={-1}>
                      {showPassword ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <button type="submit" className={styles.submitBtn} disabled={isLoading}>
                  {isLoading ? "Signing in..." : "Sign In"}
                </button>
              </form>

              <div className={styles.forgotWrap}>
                <button type="button" className={styles.forgotBtn}>Forgot Password?</button>
              </div>
            </>
          )}

          {/* ── CREATE ACCOUNT ── */}
          {mode === "register" && (
            <>
              <h1 className={styles.title}>Create Account</h1>
              <p className={styles.subtitle}>Fill in the details to register a new user.</p>

              <form onSubmit={handleRegister} className={styles.form}>
                {/* Name */}
                <div className={styles.formGroup}>
                  <label htmlFor="regName">Full Name</label>
                  <div className={styles.inputWrap}>
                    <input
                      id="regName"
                      type="text"
                      placeholder="John Doe"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      disabled={regLoading}
                      required
                      className={styles.input}
                    />
                    <span className={styles.inputIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Email */}
                <div className={styles.formGroup}>
                  <label htmlFor="regEmail">Email Address</label>
                  <div className={styles.inputWrap}>
                    <input
                      id="regEmail"
                      type="email"
                      placeholder="user@example.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      disabled={regLoading}
                      required
                      className={styles.input}
                    />
                    <span className={styles.inputIcon}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Role */}
                <div className={styles.formGroup}>
                  <label htmlFor="regRole">Role</label>
                  <select
                    id="regRole"
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as "admin" | "user" | "viewer")}
                    disabled={regLoading}
                    className={styles.select}
                  >
                    <option value="admin">Admin — Full access</option>
                    <option value="user">User — Upload &amp; Edit</option>
                    <option value="viewer">Viewer — View only</option>
                  </select>
                </div>

                {/* Password */}
                <div className={styles.formGroup}>
                  <label htmlFor="regPassword">Password</label>
                  <div className={styles.inputWrap}>
                    <input
                      id="regPassword"
                      type={regShowPw ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      disabled={regLoading}
                      required
                      className={styles.input}
                    />
                    <button type="button" className={styles.eyeBtn} onClick={() => setRegShowPw((v) => !v)} tabIndex={-1}>
                      {regShowPw ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className={styles.formGroup}>
                  <label htmlFor="regConfirm">Confirm Password</label>
                  <div className={styles.inputWrap}>
                    <input
                      id="regConfirm"
                      type="password"
                      placeholder="Re-enter password"
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      disabled={regLoading}
                      required
                      className={styles.input}
                    />
                  </div>
                </div>

                {regError && <div className={styles.error}>{regError}</div>}
                {regSuccess && <div className={styles.success}>{regSuccess}</div>}

                <button type="submit" className={styles.submitBtn} disabled={regLoading}>
                  {regLoading ? "Creating account..." : "Create Account"}
                </button>
              </form>

              {regSuccess && (
                <div className={styles.forgotWrap}>
                  <button type="button" className={styles.forgotBtn} onClick={() => switchMode("login")}>
                    ← Back to Sign In
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <p className={styles.copyright}>© 2024 Logistics Dashboard Inc. All rights reserved.</p>
      </div>
    </div>
  );
}
