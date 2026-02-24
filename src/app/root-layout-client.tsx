"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/Navbar/Navbar";

export function RootLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <>
      <Navbar />
      <main className={pathname === "/tv" ? "tv-content" : "main-content"}>{children}</main>
    </>
  );
}
