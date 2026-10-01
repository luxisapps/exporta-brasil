import { useEffect, useState } from "react";
import { CheckCircle2, ChevronRight } from "lucide-react";
import type { ImportOperation } from "@exporta/domain";
import { selectMyTasks, validTaskDate } from "../lib/my-tasks";
import { useLocale } from "../lib/locale-context";
import { Button } from "./ui/button";
import { Pagination } from "./ui/pagination";

export function MyTasks({ operations, userId, onOpen }: { operations: ImportOperation[]; userId: string; onOpen: (operationId: string) => void }) {
  const locale = useLocale(); const language = locale === "en-US" ? 1 : locale === "zh-CN" ? 2 : 0;
  const text = (pt: string, en: string, zh: string) => [pt, en, zh][language];
  const items = selectMyTasks(operations, userId);
  const [page, setPage] = useState(1); const pageCount = Math.max(1, Math.ceil(items.length / 5)); const currentPage = Math.min(page, pageCount);
  useEffect(() => setPage(1), [userId, items.length]);
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
  const overdueCount = items.filter(item => { const due = validTaskDate(item.task.dueDate); return due && due < today; }).length;
  return <section className="panel dashboard-my-tasks" aria-labelledby="my-tasks-title" data-localized>
    <div className="panel-header"><div><h2 id="my-tasks-title">{text("Minhas pendências", "My tasks", "我的待办事项")}</h2><p>{overdueCount ? text(`${overdueCount} atrasada${overdueCount === 1 ? "" : "s"}`, `${overdueCount} overdue`, `${overdueCount} 项已逾期`) : text("Tarefas atribuídas a você.", "Tasks assigned to you.", "分配给您的任务。")}</p></div><span className="my-tasks-count" aria-label={text(`${items.length} pendências abertas`, `${items.length} open tasks`, `${items.length} 项未完成任务`)}>{items.length}</span></div>
    {items.length ? <><div className="my-tasks-list">{items.slice((currentPage - 1) * 5, currentPage * 5).map(({ task, operationId, reference, customer }) => {
      const due = validTaskDate(task.dueDate); const overdue = Boolean(due && due < today); const dueToday = due === today;
      const date = due ? new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric", timeZone: "America/Sao_Paulo" }).format(new Date(`${due}T12:00:00Z`)) : text("Sem prazo", "No due date", "无截止日期");
      return <Button className="my-task-row" key={`${operationId}:${task.id}`} onClick={() => onOpen(operationId)}><span className="my-task-row__body"><strong>{task.title}</strong><small>{reference} · {customer}</small><span className={`my-task-deadline ${overdue ? "is-overdue" : dueToday ? "is-today" : ""}`}>{overdue ? `${text("Atrasada", "Overdue", "已逾期")} · ${date}` : dueToday ? text("Vence hoje", "Due today", "今日到期") : date}</span></span><ChevronRight size={16} aria-hidden="true" /></Button>;
    })}</div>{pageCount > 1 && <div className="my-tasks-pagination"><Pagination page={currentPage} pageCount={pageCount} onPageChange={setPage} label={text("Paginação das minhas pendências", "My tasks pagination", "我的任务分页")} previousLabel={text("Anterior", "Previous", "上一页")} nextLabel={text("Próxima", "Next", "下一页")} pageLabel={`${currentPage} / ${pageCount}`} /></div>}</> : <div className="my-tasks-empty"><CheckCircle2 size={22} aria-hidden="true" /><p>{text("Você não tem pendências abertas.", "You have no open tasks.", "您没有未完成的任务。")}</p></div>}
  </section>;
}
