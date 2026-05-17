import { db } from "@/lib/db";
import { KanbanBoard, type KanbanColumn } from "@/components/kanban/KanbanBoard";

const STATUSES = [
  { id: "BACKLOG", title: "Pipeline", color: "#94a3b8" },
  { id: "RESEARCH", title: "Research", color: "#f59e0b" },
  { id: "IN_PROGRESS", title: "In Development", color: "#4318ff" },
  { id: "REVIEW", title: "Code Review", color: "#a855f7" },
  { id: "DONE", title: "Done", color: "#10b981" },
];

export async function TeamBoard({ team }: { team: "APPS" | "CRM" }) {
  const tasks = await db.task.findMany({
    where: { teamId: team },
    include: { assignee: true, project: true, _count: { select: { comments: true, files: true } } },
    orderBy: { createdAt: "desc" },
  });

  const columns: KanbanColumn[] = STATUSES.map((s) => ({
    id: s.id,
    title: s.title,
    color: s.color,
    cards: tasks.filter((t) => t.status === s.id).map((t) => ({
      id: t.id,
      title: t.title,
      projectId: t.projectId,
      description: t.description,
      priority: t.priority,
      platformTag: t.platformTag,
      progress: t.progress,
      dueDate: t.dueDate?.toISOString() ?? null,
      assignees: t.assignee ? [{ id: t.assignee.id, name: t.assignee.name, image: t.assignee.image }] : [],
      commentCount: t._count.comments,
      attachmentCount: t._count.files,
      progressBarMode: "progress" as const,
      href: t.projectId ? `/records/project/${t.projectId}?task=${t.id}` : "",
    })),
  }));

  return <KanbanBoard columns={columns} moveEndpoint="/api/tasks/move" />;
}
