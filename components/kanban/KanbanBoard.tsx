"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquare, Paperclip, CheckSquare, Plus, MoreHorizontal, Calendar } from "lucide-react";

export type KanbanCard = {
  id: string;
  title: string;
  projectId?: string | null;
  description?: string | null;
  priority?: string | null;
  platformTag?: string | null;
  categoryTag?: string | null;
  progress?: number;
  probability?: number;
  dueDate?: string | null;
  projectedValue?: number | null;
  source?: string | null;
  assignees: { id: string; name: string | null; image: string | null }[];
  commentCount?: number;
  attachmentCount?: number;
  taskCount?: number;
  progressBarMode?: "progress" | "probability" | "none";
  href?: string;
};

export type KanbanColumn = {
  id: string;
  title: string;
  color?: string;
  cards: KanbanCard[];
};

type Props = {
  columns: KanbanColumn[];
  moveEndpoint: string; // e.g. /api/projects/move
  cardHref?: (card: KanbanCard) => string;
  onAddCard?: (columnId: string) => void;
};

export function KanbanBoard({ columns: initial, moveEndpoint, cardHref, onAddCard }: Props) {
  const [cols, setCols] = useState(initial);
  const [dragCard, setDragCard] = useState<{ id: string; fromCol: string } | null>(null);
  const [overCol, setOverCol] = useState<string | null>(null);
  const router = useRouter();

  const onDragStart = (cardId: string, fromCol: string) => setDragCard({ id: cardId, fromCol });
  const onDragOver = (e: React.DragEvent, colId: string) => { e.preventDefault(); setOverCol(colId); };
  const onDrop = async (toCol: string) => {
    if (!dragCard) return;
    setOverCol(null);
    if (dragCard.fromCol === toCol) { setDragCard(null); return; }
    setCols((prev) => {
      const next = prev.map((c) => ({ ...c, cards: [...c.cards] }));
      const from = next.find((c) => c.id === dragCard.fromCol)!;
      const to = next.find((c) => c.id === toCol)!;
      const idx = from.cards.findIndex((card) => card.id === dragCard.id);
      if (idx < 0) return prev;
      const [card] = from.cards.splice(idx, 1);
      to.cards.unshift(card);
      return next;
    });
    try {
      await fetch(moveEndpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: dragCard.id, toColumn: toCol }) });
      router.refresh();
    } catch {}
    setDragCard(null);
  };

  return (
    <div className="kanban-board">
      {cols.map((col) => (
        <div key={col.id} className="kanban-col" onDragOver={(e) => onDragOver(e, col.id)} onDrop={() => onDrop(col.id)}>
          <div className="kanban-col-header">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: col.color || "#cbd5e1" }} />
              {col.title}
              <span className="count">{col.cards.length}</span>
            </span>
            <MoreHorizontal size={16} style={{ color: "var(--text-secondary)", cursor: "pointer" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", minHeight: 40 }} className={overCol === col.id ? "kanban-card-over" : ""}>
            {col.cards.map((card) => (
              <Card key={card.id} card={card} colId={col.id} href={card.href ?? cardHref?.(card)} onDragStart={onDragStart} />
            ))}
          </div>
          {onAddCard && (
            <button className="kanban-col-add" onClick={() => onAddCard(col.id)}>
              <Plus size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> Add New Task
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

function Card({ card, colId, href, onDragStart }: { card: KanbanCard; colId: string; href?: string; onDragStart: (id: string, col: string) => void }) {
  const router = useRouter();
  const priorityCls = card.priority === "HIGH" ? "priority-high" : card.priority === "LOW" ? "priority-low" : "priority-medium";
  const progressColor = (card.progress ?? 0) >= 80 ? "#10b981" : (card.progress ?? 0) >= 50 ? "#4318ff" : "#f59e0b";
  const mode = card.progressBarMode ?? "progress";

  return (
    <div
      className="kanban-card"
      draggable
      onDragStart={() => onDragStart(card.id, colId)}
      onClick={() => href && router.push(href)}
    >
      <div className="tags-row">
        {card.platformTag && <span className="platform-tag">{card.platformTag}</span>}
        {card.categoryTag && <span className="platform-tag">{card.categoryTag}</span>}
        {card.source && <span className="badge badge-gray" style={{ fontSize: 10 }}>{card.source}</span>}
        {card.priority && <span className={priorityCls}>{card.priority.toLowerCase()} priority</span>}
      </div>
      <h3>{card.title}</h3>
      {card.description && <div className="desc">{card.description}</div>}
      <div className="meta-row">
        <div className="avatars">
          {card.assignees.slice(0, 3).map((a) =>
            a.image ? <img key={a.id} src={a.image} alt={a.name || ""} /> : <div key={a.id} style={{ width: 24, height: 24, borderRadius: "50%", background: "#e2e8f0", marginLeft: -6, border: "2px solid white" }} />
          )}
        </div>
        <div className="metrics">
          {card.dueDate && <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Calendar size={12} /> {new Date(card.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>}
          {typeof card.taskCount === "number" && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><CheckSquare size={12} /> {card.taskCount}</span>}
          {typeof card.commentCount === "number" && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><MessageSquare size={12} /> {card.commentCount}</span>}
          {typeof card.attachmentCount === "number" && <span style={{ display: "inline-flex", alignItems: "center", gap: 3 }}><Paperclip size={12} /> {card.attachmentCount}</span>}
        </div>
      </div>
      {mode === "progress" && typeof card.progress === "number" && (
        <div>
          <div className="progress-label"><span>Progress</span><span>{card.progress}%</span></div>
          <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${card.progress}%`, background: progressColor }} /></div>
        </div>
      )}
      {mode === "probability" && typeof card.probability === "number" && (
        <div className="meta-row" style={{ color: "#7c3aed", fontWeight: 800 }}>
          <span>Probability</span>
          <span>{card.probability}%</span>
        </div>
      )}
      {card.projectedValue != null && (
        <div className="meta-row" style={{ color: "#10b981", fontWeight: 800 }}>
          <span>Projected value</span>
          <span>${card.projectedValue.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}
