import Link from "next/link";
import { db } from "@/lib/db";
import { GitBranch, Rocket, Clock, Zap, Target, Activity as ActivityIcon, CheckCircle2, AlertCircle } from "lucide-react";
import { DevQuickActions } from "./DevQuickActions";
import { NewTaskModal } from "./NewTaskModal";

type TeamKey = "APPS" | "CRM";

const THEME: Record<TeamKey, { label: string; sub: string; primary: string; accent: string; gradient: string; icon: any }> = {
  APPS: {
    label: "Development · Engine Room",
    sub: "Sprint velocity, ship queue, and engineering capacity — APPS team only.",
    primary: "#4318ff",
    accent: "#06b6d4",
    gradient: "linear-gradient(135deg, #4318ff 0%, #06b6d4 55%, #10b981 100%)",
    icon: Rocket,
  },
  CRM: {
    label: "CRM · Integrations Hub",
    sub: "Automations, webhooks, and data pipelines — CRM team only.",
    primary: "#7c3aed",
    accent: "#ec4899",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #ec4899 55%, #f59e0b 100%)",
    icon: GitBranch,
  },
};

const TASK_STAGES: { id: string; label: string; color: string }[] = [
  { id: "BACKLOG", label: "Backlog", color: "#94a3b8" },
  { id: "RESEARCH", label: "Research", color: "#3b82f6" },
  { id: "IN_PROGRESS", label: "In Progress", color: "#4318ff" },
  { id: "REVIEW", label: "Review", color: "#a855f7" },
  { id: "DONE", label: "Done", color: "#10b981" },
];

export async function DevDashboard({ team, userId }: { team: TeamKey; userId: string }) {
  const theme = THEME[team];
  const HeroIcon = theme.icon;

  const [assignedTasks, projects, activities, people, taskCounts, allTasks, shipSoon] = await Promise.all([
    db.task.findMany({
      where: { teamId: team, assignedTo: userId, status: { not: "DONE" } },
      include: { project: true },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
    db.project.findMany({
      where: { teamId: team, stage: { not: "LIVE" } },
      include: { _count: { select: { tasks: true } }, owner: true },
      orderBy: { dueDate: "asc" },
      take: 6,
    }),
    db.activity.findMany({
      where: { teamId: team },
      include: { actor: true, project: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.user.findMany({ where: { teamId: team }, include: { tasks: { where: { status: { not: "DONE" } } } } }),
    Promise.all(TASK_STAGES.map((s) => db.task.count({ where: { teamId: team, status: s.id } }))),
    db.task.count({ where: { teamId: team } }),
    db.project.findMany({
      where: { teamId: team, stage: { not: "LIVE" }, dueDate: { not: null, lte: new Date(Date.now() + 14 * 86400000) } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
  ]);

  const done = taskCounts[4];
  const velocity = allTasks ? Math.round((done / allTasks) * 100) : 0;
  const inFlight = taskCounts[1] + taskCounts[2] + taskCounts[3];
  const maxStage = Math.max(...taskCounts, 1);
  const sprintEnd = new Date(Date.now() + 7 * 86400000);
  const daysLeft = Math.ceil((sprintEnd.getTime() - Date.now()) / 86400000);

  return (
    <div className="animate-slide-up">
      <div className="row-between" style={{ marginBottom: "1.25rem" }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="dept-dot" style={{ background: theme.primary, width: 12, height: 12 }} />
            {theme.label}
          </h1>
          <p className="page-subtitle">{theme.sub}</p>
        </div>
        <div className="flex-gap">
          <Link href={team === "APPS" ? "/dev/apps/kanban" : "/dev/crm/kanban"} className="btn btn-ghost">Sprint Board →</Link>
          <NewTaskModal
            team={team}
            gradient={theme.gradient}
            projects={projects.map((p: any) => ({ id: p.id, name: p.name }))}
            members={people.map((m: any) => ({ id: m.id, name: m.name }))}
          />
        </div>
      </div>

      {/* Hero: Sprint status */}
      <div className="sales-hero" style={{ background: theme.gradient, boxShadow: `0 20px 40px ${theme.primary}33` }}>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="hero-label"><HeroIcon size={12} style={{ display: "inline", marginRight: 4 }} /> Active Sprint</div>
          <div className="hero-value">{velocity}% <span style={{ fontSize: "1rem", opacity: 0.75, fontWeight: 600 }}>velocity</span></div>
          <div className="hero-sub">{done} of {allTasks} tasks complete · {daysLeft} days left in sprint</div>
          <div className="quota-bar"><div className="quota-fill" style={{ width: `${velocity}%` }} /></div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <span style={{ background: "rgba(255,255,255,0.18)", padding: "0.35rem 0.7rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700 }}><Zap size={12} style={{ display: "inline", marginRight: 4 }} />{inFlight} in flight</span>
            <span style={{ background: "rgba(255,255,255,0.18)", padding: "0.35rem 0.7rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700 }}><ActivityIcon size={12} style={{ display: "inline", marginRight: 4 }} />{projects.length} active projects</span>
            <span style={{ background: "rgba(255,255,255,0.18)", padding: "0.35rem 0.7rem", borderRadius: 999, fontSize: "0.75rem", fontWeight: 700 }}><Rocket size={12} style={{ display: "inline", marginRight: 4 }} />{shipSoon.length} shipping ≤ 14d</span>
          </div>
        </div>
        <div className="hero-kpis">
          <div className="hero-kpi">
            <div className="k-label">My Open Tasks</div>
            <div className="k-value">{assignedTasks.length}</div>
            <div className="k-delta">Assigned to you</div>
          </div>
          <div className="hero-kpi">
            <div className="k-label">Team Size</div>
            <div className="k-value">{people.length}</div>
            <div className="k-delta">Engineers online</div>
          </div>
          <div className="hero-kpi">
            <div className="k-label">Tasks In Review</div>
            <div className="k-value">{taskCounts[3]}</div>
            <div className="k-delta">Awaiting merge</div>
          </div>
          <div className="hero-kpi">
            <div className="k-label">Shipped Today</div>
            <div className="k-value">{done}</div>
            <div className="k-delta">Moved to DONE</div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <DevQuickActions
        team={team}
        primary={theme.primary}
        members={people.map((p: any) => ({ id: p.id, name: p.name, email: p.email }))}
      />

      {/* Task pipeline + Ship queue */}
      <div className="sales-split">
        <div className="card">
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><GitBranch size={16} color={theme.primary} /> Task Pipeline</h2>
            <Link href={team === "APPS" ? "/dev/apps/kanban" : "/dev/crm/kanban"} style={{ fontSize: "0.8rem", color: theme.primary, fontWeight: 700 }}>Open Board →</Link>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
            {TASK_STAGES.map((s, i) => (
              <div key={s.id}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", marginBottom: 4 }}>
                  <span style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color }} /> {s.label}
                  </span>
                  <span style={{ color: "var(--text-muted)", fontWeight: 700 }}>{taskCounts[i]}</span>
                </div>
                <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${(taskCounts[i] / maxStage) * 100}%`, background: s.color }} /></div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: "1rem", padding: "0.75rem", background: "var(--bg-base)", borderRadius: 10, fontSize: "0.75rem", color: "var(--text-secondary)", display: "flex", justifyContent: "space-between" }}>
            <span><strong style={{ color: "var(--text-primary)" }}>WIP:</strong> {inFlight} tasks</span>
            <span><strong style={{ color: "var(--text-primary)" }}>Completion:</strong> {velocity}%</span>
          </div>
        </div>

        <div className="card">
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><Rocket size={16} color={theme.accent} /> Ship Queue</h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Next 14 days</span>
          </div>
          {shipSoon.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No projects shipping soon.</div>}
          {shipSoon.map((p) => {
            const daysTo = p.dueDate ? Math.ceil((new Date(p.dueDate).getTime() - Date.now()) / 86400000) : null;
            const overdue = daysTo !== null && daysTo < 0;
            return (
              <Link key={p.id} href={`/records/project/${p.id}`} className="hot-lead-row" style={{ textDecoration: "none" }}>
                <div style={{ minWidth: 44, height: 44, borderRadius: 12, background: theme.gradient, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "0.85rem", flexShrink: 0 }}>
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.88rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4 }}>
                    <div style={{ flex: 1, height: 5, background: "var(--bg-base)", borderRadius: 999, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${p.progress}%`, background: theme.gradient, borderRadius: 999 }} />
                    </div>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)", fontWeight: 700, minWidth: 28 }}>{p.progress}%</span>
                  </div>
                </div>
                <span className={`badge ${overdue ? "badge-red" : daysTo! <= 3 ? "badge-orange" : "badge-blue"}`} style={{ fontSize: 10 }}>
                  {overdue ? <><AlertCircle size={10} style={{ display: "inline", marginRight: 2 }} />Overdue</> : daysTo === 0 ? "Today" : `${daysTo}d`}
                </span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Team capacity + Live activity */}
      <div className="sales-split-2">
        <div className="card">
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><Target size={16} color={theme.primary} /> Team Capacity</h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{people.length} engineers</span>
          </div>
          {people.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>No team members yet.</div>}
          {people.map((p) => {
            const load = p.tasks.length;
            const cap = Math.min(100, (load / 8) * 100);
            const barColor = load >= 6 ? "#ef4444" : load >= 4 ? "#f59e0b" : "#10b981";
            return (
              <div key={p.id} className="rep-row">
                {p.image ? <img src={p.image} alt={p.name || ""} /> : <div className="avatar-fallback" style={{ background: theme.gradient }}>{(p.name || "?").slice(0, 1).toUpperCase()}</div>}
                <div style={{ minWidth: 0, flex: "0 0 140px" }}>
                  <div className="rep-name" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div className="rep-meta" style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title || p.role}</div>
                </div>
                <div className="rep-bar"><div className="rep-bar-fill" style={{ width: `${cap}%`, background: barColor }} /></div>
                <div className="rep-value" style={{ color: barColor }}>{load} WIP</div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><ActivityIcon size={16} color={theme.accent} /> Live Activity</h2>
            <Link href="/" style={{ fontSize: "0.8rem", color: theme.primary, fontWeight: 700 }}>All →</Link>
          </div>
          {activities.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Nothing recent.</div>}
          {activities.map((a) => (
            <div key={a.id} className="activity-item">
              {a.actor?.image ? <img src={a.actor.image} alt="" /> : <div style={{ width: 36, height: 36, borderRadius: "50%", background: theme.gradient, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: "0.8rem" }}>{(a.actor?.name || "?").slice(0, 1).toUpperCase()}</div>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: "0.85rem" }}>{a.actor?.name || "System"}</div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.title}{a.project ? ` · ${a.project.name}` : ""}</div>
              </div>
              <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: 4 }}><Clock size={10} /> {timeAgo(a.createdAt)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* My tasks + Projects */}
      <div className="sales-split-2">
        <div className="card">
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><CheckCircle2 size={16} color={theme.primary} /> My Tasks</h2>
            <Link href={team === "APPS" ? "/dev/apps/kanban" : "/dev/crm/kanban"} style={{ fontSize: "0.8rem", color: theme.primary, fontWeight: 700 }}>View All →</Link>
          </div>
          {assignedTasks.length === 0 && <div style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>Nothing assigned to you right now.</div>}
          {assignedTasks.map((t) => {
            const daysTo = t.dueDate ? Math.ceil((new Date(t.dueDate).getTime() - Date.now()) / 86400000) : null;
            return (
              <div key={t.id} className="task-row">
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.875rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{t.title}</div>
                  <div className="due">{t.project.name} · {t.status.replace("_", " ")}</div>
                </div>
                <div className="flex-gap">
                  <span className={`priority-${t.priority.toLowerCase()}`}>{t.priority}</span>
                  <span className="badge badge-gray" style={{ fontSize: 10 }}>{daysTo === null ? "—" : daysTo < 0 ? "Overdue" : daysTo === 0 ? "Today" : `${daysTo}d`}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="card">
          <div className="row-between" style={{ marginBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1rem", fontWeight: 800, display: "flex", alignItems: "center", gap: 6 }}><ActivityIcon size={16} color={theme.accent} /> Active Projects</h2>
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{projects.length}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
            {projects.map((p) => (
              <Link href={`/records/project/${p.id}`} key={p.id} className="project-mini" style={{ textDecoration: "none" }}>
                <div className="logo" style={{ background: theme.gradient, color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
                  {p.name.slice(0, 2).toUpperCase()}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: "0.78rem", lineHeight: 1.25, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.name}</div>
                  <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{p._count.tasks} tasks · {p.progress}%</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
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
