"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Users, Folder, Calendar, Inbox, Megaphone, Home, Bell, CheckSquare, Clock, FolderSearch, Kanban, DollarSign, BarChart3, Settings } from "lucide-react";
import { DEPARTMENTS, activeDepartmentFromPath, type Department } from "@/lib/departments";
import { useEffect, useMemo, useState } from "react";
import { UserPresenceList } from "./UserPresenceList";

const LAST_DEPT_KEY = "innovat3:lastDept";

type NavLink = { href: string; icon: any; label: string };

const HOME_NAV: { section: string; links: NavLink[] }[] = [
  { section: "Overview", links: [
    { href: "/", icon: Home, label: "Home" },
    { href: "/inbox", icon: Bell, label: "Notifications" },
    { href: "/schedule", icon: Calendar, label: "Schedule" },
  ]},
];

const DEPT_NAV: Record<string, { section: string; links: NavLink[] }[]> = {
  development: [
    { section: "Development Team", links: [
      { href: "/dev/apps", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dev/apps?view=tasks", icon: CheckSquare, label: "Tasks" },
    ]},
    { section: "Collaboration", links: [
      { href: "/schedule?team=APPS", icon: Calendar, label: "Schedule" },
      { href: "/inbox", icon: Inbox, label: "Inbox" },
    ]},
  ],
  crm: [
    { section: "Client Delivery", links: [
      { href: "/dev/crm", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/dev/crm/projects", icon: Folder, label: "Delivery Pipeline" },
    ]},
    { section: "Collaboration", links: [
      { href: "/schedule?team=CRM", icon: Calendar, label: "Schedule" },
    ]},
  ],
  sales: [
    { section: "Sales Team", links: [
      { href: "/prospecting", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/prospecting/projects", icon: FolderSearch, label: "Sales Projects" },
    ]},
    { section: "Pipeline", links: [
      { href: "/prospecting/pipeline", icon: Kanban, label: "Pipeline Board" },
      { href: "/prospecting/contacts", icon: Users, label: "Contacts" },
    ]},
    { section: "Performance", links: [
      { href: "/my/timesheet", icon: Clock, label: "My Timesheet" },
      { href: "/my/commissions", icon: DollarSign, label: "My Commissions" },
    ]},
  ],
  marketing: [
    { section: "Marketing Team", links: [
      { href: "/marketing", icon: LayoutDashboard, label: "Dashboard" },
    ]},
    { section: "Campaigns", links: [
      { href: "/marketing/campaigns", icon: Megaphone, label: "Campaigns" },
    ]},
  ],
};

// Admin-only variant of the sales sidebar: team-wide views replace the
// per-user ones. Commission Configuration stays under the home Admin section
// (not here) so admins don't see it while working the sales pipeline.
const SALES_NAV_ADMIN: { section: string; links: NavLink[] }[] = [
  { section: "Sales Team", links: [
    { href: "/prospecting", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/prospecting/projects", icon: FolderSearch, label: "Sales Projects" },
  ]},
  { section: "Pipeline", links: [
    { href: "/prospecting/pipeline", icon: Kanban, label: "Pipeline Board" },
    { href: "/prospecting/contacts", icon: Users, label: "Contacts" },
  ]},
  { section: "Team Performance", links: [
    { href: "/prospecting/timesheets", icon: Clock, label: "Team Timesheets" },
    { href: "/prospecting/performance", icon: BarChart3, label: "Team Performance" },
  ]},
];
export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;

  const active = activeDepartmentFromPath(pathname);
  const isHome = pathname === "/" || pathname === "/schedule" || pathname === "/inbox";
  const isAdmin = pathname.startsWith("/admin");

  // Persist last visited department so drilling into non-dept pages
  // (e.g. /records/project/[id]) keeps the correct sidebar/context.
  const [remembered, setRemembered] = useState<Department["id"] | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (active) {
      try { window.localStorage.setItem(LAST_DEPT_KEY, active); } catch {}
      setRemembered(active);
    } else if (!remembered) {
      try {
        const stored = window.localStorage.getItem(LAST_DEPT_KEY);
        if (stored) setRemembered(stored as Department["id"]);
      } catch {}
    }
  }, [active, remembered]);

  const resolvedDeptId = active ?? remembered;
  const dept = useMemo(() => {
    if (isHome || isAdmin || !resolvedDeptId) return null;
    return DEPARTMENTS.find((d) => d.id === resolvedDeptId) ?? null;
  }, [resolvedDeptId, isHome, isAdmin]);

  if (!session) return null;
  if (!isHome && !isAdmin && !dept) return null;

  const isAdminRole = role === "ADMIN";
  const sections = isHome || isAdmin
    ? HOME_NAV
    : dept!.id === "sales" && isAdminRole
      ? SALES_NAV_ADMIN
      : DEPT_NAV[dept!.id] || [];
  const headerColor = isHome || isAdmin ? "#0f172a" : dept!.color;
  const headerLabel = isHome ? "Home" : isAdmin ? "Admin" : dept!.label;

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", width: "100%", minWidth: 0 }}>
          <div style={{ width: 34, height: 34, borderRadius: 8, background: `linear-gradient(135deg, ${headerColor}, ${headerColor}aa)`, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 13, flexShrink: 0 }}>I3</div>
          <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.1, minWidth: 0, flex: 1 }}>
            <span style={{ color: "var(--accent-primary)", fontWeight: 800, fontSize: "1rem", whiteSpace: "nowrap" }}>INNOVAT3</span>
            <span style={{ fontSize: "0.7rem", color: headerColor, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{headerLabel}</span>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {sections.map((section) => (
          <div key={section.section}>
            <div className="sidebar-section-label">{section.section}</div>
            {section.links.map((l) => (
              <Link key={l.href} href={l.href} className="nav-link" data-active={pathname === l.href || (l.href !== "/" && pathname.startsWith(l.href))}>
                <div className="nav-link-content"><l.icon size={18} />{l.label}</div>
              </Link>
            ))}
          </div>
        ))}

        {role === "ADMIN" && (isHome || isAdmin) && (
          <>
            <div className="sidebar-section-label">Admin</div>
            <Link href="/admin/users" className="nav-link" data-active={pathname.startsWith("/admin/users")}>
              <div className="nav-link-content"><Users size={18} />User Management</div>
            </Link>
            <Link href="/admin/commission-config" className="nav-link" data-active={pathname.startsWith("/admin/commission-config")}>
              <div className="nav-link-content"><Settings size={18} />Commission Configuration</div>
            </Link>
          </>
        )}
      </nav>

      <div className="sidebar-team">
        <div className="sidebar-section-label" style={{ padding: "0.5rem 1rem 0.25rem" }}>Team</div>
        <div className="sidebar-team-scroll">
          <UserPresenceList department={isHome || isAdmin ? null : dept?.id ?? null} />
        </div>
      </div>

      <div className="sidebar-footer">
        <div style={{ fontSize: "0.875rem", fontWeight: 700, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{session?.user?.name || session?.user?.email}</div>
        <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>ROLE · {role}</div>
      </div>
    </aside>
  );
}
