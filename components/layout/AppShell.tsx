"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const AUTH_PREFIXES = ["/login", "/reset-password"];
// Public, chrome-free routes (proposal viewer + cold-offer landing page —
// both reach unauthenticated prospects).
const PUBLIC_PREFIXES = ["/p", "/offer"];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthRoute = AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const isPublicRoute = PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));

  if (isAuthRoute || isPublicRoute) return <>{children}</>;

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        <Header />
        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}
