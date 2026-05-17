"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Home } from "lucide-react";
import { activeDepartmentFromPath, visibleDepartments, type Department } from "@/lib/departments";
import { useEffect, useState } from "react";
import { NotificationBell } from "./NotificationBell";
import { ProfileMenu } from "./ProfileMenu";

const LAST_DEPT_KEY = "innovat3:lastDept";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const role = (session?.user as any)?.role;
  const accessDepartments = (session?.user as any)?.accessDepartments;

  const depts = role ? visibleDepartments(role, accessDepartments) : [];
  const pathActive = activeDepartmentFromPath(pathname);
  const isHome = pathname === "/" || pathname === "/schedule" || pathname === "/inbox";
  const isAdmin = pathname.startsWith("/admin");

  const [remembered, setRemembered] = useState<Department["id"] | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (pathActive) {
      try { window.localStorage.setItem(LAST_DEPT_KEY, pathActive); } catch {}
      setRemembered(pathActive);
    } else if (!remembered) {
      try {
        const stored = window.localStorage.getItem(LAST_DEPT_KEY);
        if (stored) setRemembered(stored as Department["id"]);
      } catch {}
    }
  }, [pathActive, remembered]);

  // On non-dept, non-home pages, keep the last dept tab highlighted so the user
  // knows which context they're in (e.g. when drilling into /records/project/[id]).
  const active = pathActive ?? (!isHome && !isAdmin ? remembered : null);

  return (
    <header className="header">
      <div className="header-search">
        <Search size={18} />
        <input type="text" placeholder="Search leads, tasks, projects…" />
      </div>

      <nav className="dept-tabs">
        {session && role === "ADMIN" && (
          <Link
            href="/"
            className={`dept-tab ${isHome ? "active" : ""}`}
            style={isHome ? { color: "#0f172a", borderColor: "#0f172a" } : undefined}
          >
            <Home size={14} />
            Home
          </Link>
        )}
        {depts.map((d) => {
          const isActive = active === d.id;
          return (
            <Link
              key={d.id}
              href={d.root}
              className={`dept-tab ${isActive ? "active" : ""}`}
              style={isActive ? { color: d.color, borderColor: d.color } : undefined}
            >
              <span className="dept-dot" style={{ background: d.color }} />
              {d.label}
            </Link>
          );
        })}
      </nav>

      <div className="header-controls">
        {session && <NotificationBell />}
        <ProfileMenu />
      </div>
    </header>
  );
}
