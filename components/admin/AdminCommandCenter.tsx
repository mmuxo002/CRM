import { db } from "@/lib/db";
import Link from "next/link";
import {
  BarChart3, Users, Phone, ListChecks, Calendar as CalIcon, DollarSign, Briefcase, Megaphone, Code2,
  CheckCircle2, AlertCircle, Clock, TrendingUp, Activity as ActivityIcon, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import { AdminKanbanSection } from "./AdminKanban";
import { AdminCalendarSection } from "./AdminCalendar";
import { AdminInvoicesSection } from "./AdminInvoices";

const DEPT_COLOR: Record<string, string> = { APPS: "#4318ff", CRM: "#7c3aed", SALES: "#f59e0b", GLOBAL: "#94a3b8" };

export async function AdminCommandCenter() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 86400000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 86400000);

  const [
    allProjects,
    recentLeads,
    readyToCallLeads,
    allOpenTasks,
    todayMeetings,
    activeDeals,
    allLeads,
    closedLeads,
    prospectLeads,
    crmProjects,
    appsProjects,
    activities,
    salesUsers,
  ] = await Promise.all([
    db.project.findMany({
      where: { stage: { not: "LIVE" } },
      include: { owner: true, company: true, _count: { select: { tasks: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    db.lead.count({ where: { createdAt: { gte: weekAgo } } }),
    db.lead.count({ where: { status: "READY_TO_CALL" } }),
    db.task.count({ where: { status: { not: "DONE" } } }),
    db.meeting.count({ where: { startAt: { gte: todayStart, lt: todayEnd } } }),
    db.deal.findMany({ where: { status: { not: "LOST" } } }),
    db.lead.count(),
    db.lead.count({ where: { status: "READY_TO_CALL" } }),
    db.lead.count({ where: { status: { in: ["NEW", "CONTACTED", "MEETING", "PROPOSAL"] } } }),
    db.project.findMany({
      where: { teamId: "CRM" },
      include: { tasks: { where: { status: { not: "DONE" } } }, _count: { select: { tasks: true } } },
    }),
    db.project.findMany({
      where: { teamId: "APPS" },
      include: { tasks: { where: { status: { not: "DONE" } } }, _count: { select: { tasks: true } } },
    }),
    db.activity.findMany({
      include: { actor: true, project: { include: { company: true } } },
      orderBy: { createdAt: "desc" },
      take: 15,
    }),
    db.user.findMany({ where: { role: "SALES", isActive: true }, include: { leads: { where: { status: "READY_TO_CALL" } } } }),
  ]);

  const totalPipeline = activeDeals.reduce((s, d) => s + d.value, 0);
  const avgDealValue = activeDeals.length > 0 ? totalPipeline / activeDeals.length : 0;
  const leadToCloseRate = allLeads > 0 ? ((closedLeads / allLeads) * 100).toFixed(1) : "0";

  // CRM metrics
  const crmActive = crmProjects.filter((p) => p.crmStage !== "LIVE").length;
  const crmInProgress = crmProjects.filter((p) => ["BUILDING", "SCOPING"].includes(p.crmStage)).length;
  const crmCompletedMonth = crmProjects.filter((p) => p.crmStage === "LIVE" && p.updatedAt >= monthStart).length;
  const crmAvgProgress = crmActive > 0 ? Math.round(crmProjects.filter((p) => p.crmStage !== "LIVE").reduce((s, p) => s + p.progress, 0) / crmActive) : 0;
  const crmOverdue = crmProjects.flatMap((p) => p.tasks).filter((t) => t.dueDate && t.dueDate < now).length;

  // Apps metrics
  const appsActive = appsProjects.filter((p) => p.stage !== "LIVE").length;
  const appsInProgress = appsProjects.filter((p) => ["APPS_DEV", "QA"].includes(p.stage)).length;
  const appsCompletedMonth = appsProjects.filter((p) => p.stage === "LIVE" && p.updatedAt >= monthStart).length;
  const appsAvgProgress = appsActive > 0 ? Math.round(appsProjects.filter((p) => p.stage !== "LIVE").reduce((s, p) => s + p.progress, 0) / appsActive) : 0;
  const appsOverdue = appsProjects.flatMap((p) => p.tasks).filter((t) => t.dueDate && t.dueDate < now).length;

  // Sales metrics
  const salesMeetingsWeek = await db.meeting.count({ where: { teamId: "SALES", startAt: { gte: weekAgo, lt: todayEnd } } });
  const topRep = salesUsers.sort((a, b) => b.leads.length - a.leads.length)[0];

  const fmt = (n: number) => n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K` : `$${n.toFixed(0)}`;

  // Kanban data: projects grouped by department
  const kanbanProjects = allProjects.map((p) => ({
    id: p.id,
    name: p.name,
    teamId: p.teamId,
    progress: p.progress,
    stage: p.stage,
    ownerName: p.owner?.name ?? null,
    ownerImage: p.owner?.image ?? null,
    companyName: p.company?.name ?? null,
    taskCount: p._count.tasks,
  }));

  return (
    <div className="animate-slide-up">
      <div className="row-between" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="dept-dot" style={{ background: "linear-gradient(135deg, #4318ff, #7c3aed, #f59e0b)", width: 12, height: 12 }} />
            Command Center
          </h1>
          <p className="page-subtitle">Cross-department overview — projects, leads, schedule, and activity at a glance.</p>
        </div>
        <div className="flex-gap">
          <Link href="/admin/users" className="btn btn-ghost"><Users size={14} /> Team</Link>
        </div>
      </div>

      {/* Zone 1: Quick Stats Bar */}
      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(6, 1fr)", marginBottom: "1.5rem" }}>
        <QuickStat label="Active Projects" value={allProjects.length} icon={<Briefcase size={15} />} color="#4318ff" sub="In progress" />
        <QuickStat label="New Leads (7d)" value={recentLeads} icon={<TrendingUp size={15} />} color="#10b981" sub="This week" />
        <QuickStat label="Ready to Call" value={readyToCallLeads} icon={<Phone size={15} />} color="#f59e0b" sub="Awaiting handoff" />
        <QuickStat label="Open Tasks" value={allOpenTasks} icon={<ListChecks size={15} />} color="#a855f7" sub="All departments" />
        <QuickStat label="Scheduled Today" value={todayMeetings} icon={<CalIcon size={15} />} color="#3b82f6" sub="Meetings & calls" />
        <QuickStat label="Pipeline Value" value={fmt(totalPipeline)} icon={<DollarSign size={15} />} color="#ec4899" sub={`${activeDeals.length} active deals`} />
      </div>

      {/* Zone 2: Department Stat Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1.5rem" }}>
        {/* Marketing */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#ec4899" }} />
              Marketing
            </h3>
            <Megaphone size={16} style={{ color: "#ec4899" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <MetricRow label="Total Leads" value={String(allLeads)} />
            <MetricRow label="Prospects" value={String(prospectLeads)} />
            <MetricRow label="Closes (Ready)" value={String(closedLeads)} />
            <MetricRow label="Lead → Close" value={`${leadToCloseRate}%`} highlight />
          </div>
        </div>

        {/* Sales */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#f59e0b" }} />
              Sales
            </h3>
            <DollarSign size={16} style={{ color: "#f59e0b" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <MetricRow label="Active Deals" value={String(activeDeals.length)} />
            <MetricRow label="Ready to Call" value={String(readyToCallLeads)} />
            <MetricRow label="Meetings (7d)" value={String(salesMeetingsWeek)} />
            <MetricRow label="Avg. Deal Value" value={fmt(avgDealValue)} highlight />
          </div>
          {topRep && (
            <div style={{ marginTop: "0.6rem", padding: "0.5rem 0.6rem", background: "var(--bg-base)", borderRadius: 8, display: "flex", alignItems: "center", gap: 8, fontSize: "0.75rem" }}>
              {topRep.image ? <img src={topRep.image} alt="" style={{ width: 22, height: 22, borderRadius: "50%" }} /> : <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#e2e8f0" }} />}
              <span style={{ fontWeight: 700 }}>{topRep.name}</span>
              <span style={{ color: "var(--text-muted)", marginLeft: "auto" }}>{topRep.leads.length} closes</span>
            </div>
          )}
        </div>

        {/* CRM */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#7c3aed" }} />
              CRM
            </h3>
            <Briefcase size={16} style={{ color: "#7c3aed" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <MetricRow label="Active Clients" value={String(crmActive)} />
            <MetricRow label="In Progress" value={String(crmInProgress)} />
            <MetricRow label="Completed (MTD)" value={String(crmCompletedMonth)} />
            <MetricRow label="Avg. Completion" value={`${crmAvgProgress}%`} highlight />
          </div>
          {crmOverdue > 0 && <OverdueAlert count={crmOverdue} />}
        </div>

        {/* Apps Development */}
        <div className="card" style={{ padding: "1.25rem" }}>
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#4318ff" }} />
              Development
            </h3>
            <Code2 size={16} style={{ color: "#4318ff" }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            <MetricRow label="Active Projects" value={String(appsActive)} />
            <MetricRow label="In Progress" value={String(appsInProgress)} />
            <MetricRow label="Completed (MTD)" value={String(appsCompletedMonth)} />
            <MetricRow label="Avg. Completion" value={`${appsAvgProgress}%`} highlight />
          </div>
          {appsOverdue > 0 && <OverdueAlert count={appsOverdue} />}
        </div>
      </div>

      {/* Invoices */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <AdminInvoicesSection />
      </div>

      {/* Zone 3: Cross-Department Kanban */}
      <div className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
        <div className="row-between" style={{ marginBottom: "0.75rem" }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 800 }}>Project Board</h2>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>All active projects grouped by department</span>
        </div>
        <AdminKanbanSection projects={kanbanProjects} />
      </div>

      {/* Zone 4: Calendar + Zone 5: Activity Feed side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "1rem" }}>
        <div className="card" style={{ padding: "1.25rem" }}>
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800 }}>Schedule</h2>
            <div className="flex-gap" style={{ fontSize: "0.65rem" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: "#f59e0b" }} /> Sales</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: "#10b981" }} /> CRM</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: "#7c3aed" }} /> Dev</span>
              <span style={{ display: "flex", alignItems: "center", gap: 3 }}><span style={{ width: 6, height: 6, borderRadius: 999, background: "#94a3b8" }} /> Admin</span>
            </div>
          </div>
          <AdminCalendarSection />
        </div>

        <div className="card" style={{ padding: "1.25rem" }}>
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800 }}>Activity Feed</h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>All departments</span>
          </div>
          <div style={{ maxHeight: 500, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
            {activities.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", padding: "1rem" }}>No activity yet.</div>}
            {activities.map((a) => {
              const color = DEPT_COLOR[a.teamId] || "#94a3b8";
              return (
                <div key={a.id} style={{ display: "flex", gap: "0.6rem", padding: "0.5rem 0", borderBottom: "1px solid var(--border-color)" }}>
                  <div style={{ position: "relative" }}>
                    {a.actor?.image ? <img src={a.actor.image} alt="" style={{ width: 32, height: 32, borderRadius: "50%" }} /> : <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#e2e8f0" }} />}
                    <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: color, border: "2px solid var(--bg-surface)" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.8rem" }}>
                      <span style={{ fontWeight: 700 }}>{a.actor?.name || "System"}</span>
                      {a.project && <span style={{ color: "var(--text-muted)" }}> · {a.project.company?.name || a.project.name}</span>}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}</div>
                  </div>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 3 }}><Clock size={9} /> {timeAgo(a.createdAt)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon, color, sub }: { label: string; value: number | string; icon: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: "0.75rem 1rem" }}>
      <div className="row-between" style={{ marginBottom: "0.35rem" }}>
        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{label}</span>
        <div style={{ color, display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: 7, background: color + "15" }}>{icon}</div>
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 900 }}>{value}</div>
      {sub && <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600 }}>{sub}</div>}
    </div>
  );
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ padding: "0.4rem 0.5rem", background: "var(--bg-base)", borderRadius: 6 }}>
      <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", fontWeight: 600, marginBottom: 1 }}>{label}</div>
      <div style={{ fontSize: "1rem", fontWeight: 800, color: highlight ? "#4318ff" : "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function OverdueAlert({ count }: { count: number }) {
  return (
    <div style={{ marginTop: "0.5rem", padding: "0.4rem 0.6rem", background: "#fef2f2", borderRadius: 6, border: "1px solid #fecaca", display: "flex", alignItems: "center", gap: 6, fontSize: "0.75rem", color: "#ef4444", fontWeight: 700 }}>
      <AlertCircle size={12} /> {count} overdue task{count === 1 ? "" : "s"}
    </div>
  );
}

function timeAgo(d: Date) {
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
