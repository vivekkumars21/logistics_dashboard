"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import Navbar from "@/components/Navbar/Navbar";
import { useAuth } from "@/lib/auth-context";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const isLoginPage = pathname === "/login";

  useEffect(() => {
    // Don't redirect while checking auth
    if (isLoading) return;

    // If not authenticated and not on login page, redirect to login
    if (!isAuthenticated && !isLoginPage) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, isLoginPage, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  // Don't show navbar on login page
  const showNavbar = isAuthenticated && !isLoginPage;

  return (
    <>
      {showNavbar && <Navbar />}
      <main className={showNavbar ? "main-content" : ""}>{children}</main>
    </>
  );
}
