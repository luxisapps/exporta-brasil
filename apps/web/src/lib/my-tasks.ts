import type { ImportOperation, OperationTask } from "@exporta/domain";
export type PersonalTask = { task: OperationTask; operationId: string; reference: string; customer: string };
export function selectMyTasks(operations: ImportOperation[], userId: string): PersonalTask[] {
  return operations.flatMap(operation => (operation.tasks ?? [])
    .filter(task => !task.completed && task.assigneeId === userId)
    .map(task => ({ task, operationId: operation.id, reference: operation.reference, customer: operation.customer })))
    .sort((left, right) => (validTaskDate(left.task.dueDate) ?? "9999-12-31").localeCompare(validTaskDate(right.task.dueDate) ?? "9999-12-31") || left.reference.localeCompare(right.reference) || left.task.id.localeCompare(right.task.id));
}
export function validTaskDate(value?: string) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T12:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : undefined;
}
