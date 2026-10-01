export type EditableUser = { name: string; email: string; role: "admin" | "operator"; phone?: string; jobTitle?: string };

export function parseUserEdit(body: unknown): EditableUser | null {
  if (!body || typeof body !== "object") return null;
  const value = body as Record<string, unknown>;
  if (typeof value.name !== "string" || !value.name.trim() || value.name.trim().length > 200 || typeof value.email !== "string" || value.email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.email.trim()) || !["admin", "operator"].includes(String(value.role))) return null;
  if ((value.phone !== undefined && (typeof value.phone !== "string" || value.phone.length > 50)) || (value.jobTitle !== undefined && (typeof value.jobTitle !== "string" || value.jobTitle.length > 200))) return null;
  return { name: value.name.trim(), email: value.email.trim().toLowerCase(), role: value.role as EditableUser["role"], ...(typeof value.phone === "string" ? { phone: value.phone.trim() } : {}), ...(typeof value.jobTitle === "string" ? { jobTitle: value.jobTitle.trim() } : {}) };
}

export function removesLastAdmin(currentRole: string, nextRole: string, adminCount: number) {
  return currentRole === "admin" && nextRole !== "admin" && adminCount <= 1;
}
