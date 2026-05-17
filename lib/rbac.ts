import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { canAccessDepartment, type Department } from "@/lib/departments";

export type Role = "ADMIN" | "APPS_DEV" | "CRM_DEV" | "SALES";
export type Team = "APPS" | "CRM" | "SALES" | "GLOBAL";

type SessionUser = { id: string; name?: string | null; email?: string | null; image?: string | null; role: Role; mustResetPassword?: boolean; accessDepartments?: string | null };

export async function requireSession() {
  const session = await auth();
  if (!session) redirect("/login");
  const user = session.user as SessionUser;
  if (user.mustResetPassword) redirect("/reset-password");
  return { session, user };
}

export async function requireRole(...roles: Role[]) {
  const { user, session } = await requireSession();
  if (!roles.includes(user.role) && user.role !== "ADMIN") redirect("/");
  return { session, user };
}

export async function requireDepartment(id: Department["id"]) {
  const { user, session } = await requireSession();
  if (!canAccessDepartment(id, user.role, user.accessDepartments)) redirect("/");
  return { session, user };
}

export async function requireAdmin() {
  const { user, session } = await requireSession();
  if (user.role !== "ADMIN") redirect("/");
  return { session, user };
}

export function teamForRole(role: Role): Team {
  if (role === "APPS_DEV") return "APPS";
  if (role === "CRM_DEV") return "CRM";
  if (role === "SALES") return "SALES";
  return "GLOBAL";
}

export function visibleTeamFilter(role: Role): { teamId?: { in: Team[] } } | {} {
  if (role === "ADMIN") return {};
  return { teamId: { in: [teamForRole(role), "GLOBAL"] as Team[] } };
}
