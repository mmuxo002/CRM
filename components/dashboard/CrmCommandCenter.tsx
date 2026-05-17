import Link from "next/link";
import { db } from "@/lib/db";
import { Plus, FolderKanban, Sparkles, CheckCircle2, Activity as ActivityIcon, Clock, UserPlus, DollarSign } from "lucide-react";
import { CRM_STAGES, serviceTypeMeta, SERVICE_TYPES } from "@/lib/crm";
import { CrmClientGrid } from "@/components/dashboard/CrmClientGrid";

export async function CrmCommandCenter({ userId: _userId }: { userId: string }) {
  const [projects, openTasks, recentActivity, stageCountsRaw] = await Promise.all([
    db.project.findMany({ where: { teamId: "CRM" }, include: { company: true, owner: true, tags: true, _count: { select: { tasks: true, comments: true, files: true } } }, orderBy: { updatedAt: "desc" } }),
    db.task.findMany({ where: { teamId: "CRM", status: { not: "DONE" } }, include: { assignee: true, project: { include: { company: true } } }, orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }], take: 6 }),
    db.activity.findMany({ where: { teamId: "CRM" }, include: { actor: true, project: { include: { company: true } } }, orderBy: { createdAt: "desc" }, take: 6 }),
    Promise.all(CRM_STAGES.map((s) => db.project.count({ where: { teamId: "CRM", crmStage: s.id } }))),
  ]);

  const totalProjects = projects.length;
  const activeClients = new Set(projects.filter((p) => p.crmStage !== "LIVE").map((p) => p.companyId).filter(Boolean)).size;
  const liveProjects = projects.filter((p) => p.crmStage === "LIVE").length;
  const totalMrr = projects.reduce((s, p) => s + p.mrr, 0);
  const buildingNow = projects.filter((p) => p.crmStage === "BUILDING" || p.crmStage === "SCOPING").length;

  const byService: Record<string, { count: number; label: string; color: string }> = {};
  for (const p of projects) {
    const m = serviceTypeMeta(p.serviceType);
    if (!byService[m.id]) byService[m.id] = { count: 0, label: m.label, color: m.color };
    byService[m.id].count++;
  }
  const serviceRows = Object.values(byService).sort((a, b) => b.count - a.count);
  const maxService = Math.max(...serviceRows.map((r) => r.count), 1);

  const maxStage = Math.max(...stageCountsRaw, 1);
  const fmt = (n: number) => n >= 1_000 ? `$${(n / 1_000).toFixed(1)}K` : `$${n.toFixed(0)}`;

  return (
    <div className="animate-slide-up">
      <div className="row-between" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="dept-dot" style={{ background: "#7c3aed", width: 12, height: 12 }} />
            CRM · Client Delivery
          </h1>
          <p className="page-subtitle">Active clients, services in flight, and what's moving today.</p>
        </div>
        <div className="flex-gap">
          <Link href="/dev/crm/projects" className="btn btn-ghost"><FolderKanban size={14} /> Pipeline</Link>
          <Link href="/dev/crm/onboard" className="btn btn-primary" style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)", borderColor: "transparent" }}><UserPlus size={14} /> Onboard Client</Link>
        </div>
      </div>

      <div className="dashboard-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", marginBottom: "1.5rem" }}>
        <KPI label="Active Clients" value={activeClients} icon={<UserPlus size={16} />} color="#7c3aed" delta={`${totalProjects} total projects`} />
        <KPI label="Building Now" value={buildingNow} icon={<Sparkles size={16} />} color="#a855f7" delta="Scoping + Building" />
        <KPI label="Live Deployments" value={liveProjects} icon={<CheckCircle2 size={16} />} color="#10b981" delta="Completed & shipped" />
        <KPI label="Client MRR" value={fmt(totalMrr)} icon={<DollarSign size={16} />} color="#ec4899" delta="Monthly recurring" />
      </div>

      <div className="dev-grid">
        <div className="card dev-card">
          <h2>Delivery Pipeline <Link href="/dev/crm/projects">Board →</Link></h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem", marginTop: "0.5rem" }}>
            {CRM_STAGES.map((s, i) => (
              <div key={s.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} /> {s.label}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>{stageCountsRaw[i]}</span>
                </div>
                <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${(stageCountsRaw[i] / maxStage) * 100}%`, background: s.color }} /></div>
              </div>
            ))}
          </div>
        </div>

        <div className="card dev-card">
          <h2>Service Mix <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{totalProjects} projects</span></h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem", marginTop: "0.25rem" }}>
            {serviceRows.map((r) => (
              <div key={r.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 3 }}>
                  <span style={{ fontWeight: 600 }}>{r.label}</span>
                  <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>{r.count}</span>
                </div>
                <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${(r.count / maxService) * 100}%`, background: r.color }} /></div>
              </div>
            ))}
            {serviceRows.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No projects yet. Onboard a client to start.</div>}
          </div>
        </div>

        <div className="card dev-card">
          <h2>Open Tasks <Link href="/dev/crm/projects">View All</Link></h2>
          {openTasks.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No open tasks across CRM. 🎉</div>}
          {openTasks.map((t) => (
            <Link key={t.id} href={`/dev/crm/projects/${t.projectId}`} className="task-row" style={{ textDecoration: "none" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.875rem" }}>{t.title}</div>
                <div className="due">{t.project.company?.name || t.project.name}{t.assignee ? ` · ${t.assignee.name}` : ""}</div>
              </div>
              <div className="flex-gap">
                <span className={`badge badge-${t.status === "IN_PROGRESS" ? "blue" : t.status === "REVIEW" ? "purple" : "gray"}`} style={{ fontSize: 10 }}>{t.status}</span>
                <span className="due">{t.dueDate ? new Date(t.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}</span>
              </div>
            </Link>
          ))}
        </div>

        <div className="card dev-card">
          <h2>Latest Client Activity <Link href="/dev/crm/projects">View All</Link></h2>
          {recentActivity.map((a) => (
            <div key={a.id} className="activity-item">
              {a.actor?.image ? <img src={a.actor.image} alt="" /> : <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#e2e8f0" }} />}
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.85rem" }}>{a.actor?.name || "System"} <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>· {a.project?.company?.name || a.project?.name || ""}</span></div>
                <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{a.title}</div>
                {a.body && <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 3 }}>{a.body}</div>}
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: 3 }}><Clock size={11} />{timeAgo(a.createdAt)}</div>
            </div>
          ))}
        </div>

        <div className="card dev-card" style={{ gridColumn: "span 2" }}>
          <CrmClientGrid projects={projects.map((p) => {
            const svc = serviceTypeMeta(p.serviceType);
            return {
              id: p.id,
              name: p.name,
              companyName: p.company?.name ?? null,
              serviceLabel: svc.label,
              serviceColor: svc.color,
              crmStage: p.crmStage,
              mrr: p.mrr,
              progress: p.progress,
              taskCount: p._count.tasks,
              fileCount: p._count.files,
              ownerName: p.owner?.name ?? null,
              ownerImage: p.owner?.image ?? null,
              tags: p.tags.slice(0, 3).map((t) => ({ id: t.id, label: t.label, color: t.color })),
            };
          })} />
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, icon, color, delta }: { label: string; value: number | string; icon: React.ReactNode; color: string; delta?: string }) {
  return (
    <div className="card">
      <div className="row-between" style={{ marginBottom: "0.75rem" }}>
        <div style={{ color: "var(--text-secondary)", fontWeight: 600, fontSize: "0.8rem" }}>{label}</div>
        <div style={{ color, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 8, background: color + "18" }}>{icon}</div>
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 800 }}>{value}</div>
      {delta && <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4, fontWeight: 600 }}><ActivityIcon size={10} style={{ display: "inline" }} /> {delta}</div>}
    </div>
  );
}

function timeAgo(d: Date) {
  const ms = Date.now() - d.getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
