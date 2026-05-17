"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";

type Project = { id: string; name: string };
type Member = { id: string; name: string | null };

export function NewTaskModal({
  team,
  gradient,
  projects,
  members,
}: {
  team: string;
  gradient: string;
  projects: Project[];
  members: Member[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [assignedTo, setAssignedTo] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [platformTag, setPlatformTag] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setProjectId("");
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setAssignedTo("");
    setDueDate("");
    setPlatformTag("");
    setError(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!projectId || !title.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        assignedTo: assignedTo || undefined,
        dueDate: dueDate || undefined,
        platformTag: platformTag || undefined,
      }),
    });
    setLoading(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(j.error || "Failed to create task");
      return;
    }
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="btn btn-primary"
        style={{ background: gradient, borderColor: "transparent" }}
      >
        <Plus size={14} /> New Task
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 50,
            padding: "1rem",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: 16,
              padding: "1.75rem",
              width: "100%",
              maxWidth: 520,
              boxShadow: "0 20px 60px rgba(0,0,0,0.25)",
            }}
          >
            <div className="row-between" style={{ marginBottom: "1rem" }}>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800 }}>New Task</h2>
              <button
                onClick={() => setOpen(false)}
                className="btn btn-ghost"
                style={{ padding: "0.3rem 0.5rem" }}
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={onSubmit} style={{ display: "grid", gap: "0.75rem" }}>
              <Field label="Project *">
                <select
                  required
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  style={inputStyle}
                >
                  <option value="">Select a project…</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Task title *">
                <input
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What needs to be done?"
                  style={inputStyle}
                />
              </Field>

              <Field label="Description">
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Details, acceptance criteria, links…"
                  rows={3}
                  style={{ ...inputStyle, resize: "vertical", minHeight: 70 }}
                />
              </Field>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                }}
              >
                <Field label="Priority">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                  </select>
                </Field>

                <Field label="Assign to">
                  <select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">Unassigned</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name || m.id}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "0.5rem",
                }}
              >
                <Field label="Due date">
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={inputStyle}
                  />
                </Field>

                <Field label="Platform">
                  <select
                    value={platformTag}
                    onChange={(e) => setPlatformTag(e.target.value)}
                    style={inputStyle}
                  >
                    <option value="">None</option>
                    <option value="Web">Web</option>
                    <option value="Mobile">Mobile</option>
                    <option value="iOS">iOS</option>
                    <option value="Desktop">Desktop</option>
                  </select>
                </Field>
              </div>

              {error && (
                <div
                  style={{
                    background: "#fee2e2",
                    color: "#b91c1c",
                    fontSize: "0.8rem",
                    padding: "0.6rem 0.85rem",
                    borderRadius: 8,
                    fontWeight: 600,
                  }}
                >
                  {error}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: 8,
                  marginTop: 4,
                }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !projectId || !title.trim()}
                  className="btn btn-primary"
                  style={{ opacity: loading ? 0.6 : 1 }}
                >
                  {loading ? "Creating…" : "Create Task"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "0.55rem 0.75rem",
  borderRadius: 8,
  border: "1px solid var(--border-color)",
  fontSize: "0.88rem",
  outline: "none",
  width: "100%",
};

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontSize: "0.75rem",
        fontWeight: 700,
      }}
    >
      {label}
      {children}
    </label>
  );
}
