import type { Role } from "@/lib/rbac";

export type Department = {
  id: "development" | "crm" | "sales" | "marketing";
  label: string;
  root: string;
  color: string;
};

export const DEPARTMENTS: Department[] = [
  { id: "development", label: "Development", root: "/dev/apps", color: "#4318ff" },
  { id: "crm", label: "CRM", root: "/dev/crm", color: "#7c3aed" },
  { id: "sales", label: "Sales", root: "/prospecting", color: "#f59e0b" },
  { id: "marketing", label: "Marketing", root: "/marketing", color: "#ec4899" },
];

export function activeDepartmentFromPath(pathname: string): Department["id"] | null {
  if (pathname.startsWith("/dev/apps")) return "development";
  if (pathname.startsWith("/dev/crm")) return "crm";
  if (pathname.startsWith("/prospecting") || pathname.startsWith("/my")) return "sales";
  if (pathname.startsWith("/marketing")) return "marketing";
  return null;
}

export function parseAccess(accessDepartments: string | null | undefined): Set<Department["id"]> | "all" {
  if (!accessDepartments) return new Set();
  const trimmed = accessDepartments.trim();
  if (!trimmed || trimmed === "all") return "all";
  const ids = trimmed.split(",").map((s) => s.trim()).filter(Boolean) as Department["id"][];
  return new Set(ids);
}

export function visibleDepartments(role: Role | string, accessDepartments?: string | null): Department[] {
  if (role === "ADMIN") return DEPARTMENTS;
  const access = parseAccess(accessDepartments);
  if (access === "all") return DEPARTMENTS;
  return DEPARTMENTS.filter((d) => access.has(d.id));
}

export function canAccessDepartment(id: Department["id"], role: Role | string, accessDepartments?: string | null): boolean {
  if (role === "ADMIN") return true;
  const access = parseAccess(accessDepartments);
  if (access === "all") return true;
  return access.has(id);
}
