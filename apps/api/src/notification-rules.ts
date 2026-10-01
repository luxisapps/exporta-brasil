import { hasApprovedBudget, type ImportOperation } from "@exporta/domain";

export type Notice = { kind: string; recipients: string[]; section: "tasks" | "documents" | "timeline"; detail: string; value?: string; critical?: boolean; key: string };
const unique = (values: Array<string | undefined>) => [...new Set(values.filter((value): value is string => Boolean(value)))];
export function operationNotices(before: ImportOperation | null, next: ImportOperation, actorId: string): Notice[] {
  const notices: Notice[] = [];
  const add = (kind: string, recipients: Array<string | undefined>, section: Notice["section"], detail: string, key: string, value?: string, critical = false) => {
    const targets = unique(recipients).filter(id => id !== actorId);
    if (targets.length) notices.push({ kind, recipients: targets, section, detail, key, value, critical });
  };
  const owner = next.assigneeId;
  if (owner && owner !== before?.assigneeId) add("assigned", [owner], "timeline", "", "assigned");
  if (!before) return notices;
  if (before.assigneeId && before.assigneeId !== owner) add("unassigned", [before.assigneeId], "timeline", "", "unassigned");
  for (const field of ["status", "portStatus", "customsChannel", "shipmentStatus"] as const) {
    if (next[field] !== before[field]) add(field, [owner], "timeline", "", field, next[field], field === "customsChannel" && ["red", "gray"].includes(next[field] ?? ""));
  }
  if (!hasApprovedBudget(before) && hasApprovedBudget(next)) add("approved", [owner], "timeline", "", "approved");
  if (next.eta !== before.eta) add("eta_changed", [owner], "timeline", next.eta, "eta_changed");
  for (const task of next.tasks ?? []) {
    const previous = before.tasks?.find(item => item.id === task.id);
    const targets = [owner, task.assigneeId];
    if (!previous || previous.assigneeId !== task.assigneeId) add("task_assigned", targets, "tasks", task.title, `task-assigned:${task.id}`);
    else if (previous.completed !== task.completed) add(task.completed ? "task_completed" : "task_reopened", targets, "tasks", task.title, `task-state:${task.id}`);
    else if (previous.title !== task.title || previous.dueDate !== task.dueDate) add("task_updated", targets, "tasks", task.title, `task-updated:${task.id}`);
    if (previous?.assigneeId && previous.assigneeId !== task.assigneeId) add("task_unassigned", [previous.assigneeId], "tasks", task.title, `task-unassigned:${task.id}`);
  }
  for (const task of before.tasks ?? []) if (!next.tasks?.some(item => item.id === task.id)) add("task_removed", [owner, task.assigneeId], "tasks", task.title, `task-removed:${task.id}`);
  for (const document of next.documents ?? []) {
    const previous = before.documents?.find(item => item.id === document.id);
    if (!previous || JSON.stringify(previous) !== JSON.stringify(document)) add(previous ? "document_updated" : "document_added", [owner], "documents", document.title, `document:${document.id}`);
  }
  const onlyTimelineChanged = JSON.stringify(before.items) === JSON.stringify(next.items) && JSON.stringify(before.budgets) === JSON.stringify(next.budgets) && JSON.stringify(before.tasks) === JSON.stringify(next.tasks) && JSON.stringify(before.documents) === JSON.stringify(next.documents) && !notices.length;
  for (const entry of next.timeline ?? []) if ((entry.type === "note" || onlyTimelineChanged) && !before.timeline?.some(item => item.id === entry.id)) add("note_added", [owner], "timeline", entry.title, `note:${entry.id}`);
  return notices;
}

export function dueNotices(operation: ImportOperation, today: string): Notice[] {
  if (operation.status === "completed" || operation.shipmentStatus === "closed") return [];
  const notices: Notice[] = [];
  const add = (kind: string, ids: Array<string | undefined>, section: Notice["section"], detail: string, key: string, critical: boolean) => {
    const recipients = unique(ids);
    if (recipients.length) notices.push({ kind, recipients, section, detail, key: `${today}:${key}`, critical });
  };
  for (const task of operation.tasks ?? []) {
    if (!task.completed && task.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) && task.dueDate <= today) add(task.dueDate < today ? "task_overdue" : "task_due", [task.assigneeId, operation.assigneeId], "tasks", task.title, `task:${task.id}`, task.dueDate < today);
  }
  const soon = new Date(`${today}T12:00:00Z`); soon.setUTCDate(soon.getUTCDate() + 3);
  for (const document of operation.documents ?? []) {
    if (document.expiresAt && /^\d{4}-\d{2}-\d{2}$/.test(document.expiresAt) && document.expiresAt <= soon.toISOString().slice(0, 10)) add(document.expiresAt < today ? "document_expired" : "document_expiring", [operation.assigneeId], "documents", document.title, `document:${document.id}`, document.expiresAt < today);
  }
  if (hasApprovedBudget(operation) && !["arrived", "closed"].includes(operation.shipmentStatus ?? "") && ["awaiting_shipment", "in_transit"].includes(operation.status) && operation.eta === today) add("eta_due", [operation.assigneeId], "timeline", operation.eta, "eta", false);
  return notices;
}
