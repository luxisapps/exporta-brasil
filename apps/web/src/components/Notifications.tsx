import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, CircleAlert } from "lucide-react";
import { Button } from "./ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { Spinner } from "./ui/spinner";
import { useLocale } from "../lib/locale-context";
import { translateUiText } from "../i18n";
import { apiFetch } from "../lib/api-fetch";
import { customsChannelMeta, importStatusMeta, portStatusMeta, shipmentStatusMeta } from "@exporta/domain";

type Notification = { id: string; operationId: string; reference: string; kind: string; detail: string; value?: string; section: string; critical: boolean; actorName?: string; createdAt: string; readAt: string | null };
const labels: Record<string, [string, string, string]> = {
  assigned: ["Importação atribuída a você", "Import assigned to you", "已为您分配进口业务"], unassigned: ["Responsável da importação alterado", "Import owner changed", "进口负责人已更改"],
  task_assigned: ["Nova pendência ou atribuição", "New task or assignment", "新任务或分配"], task_updated: ["Pendência atualizada", "Task updated", "任务已更新"], task_completed: ["Pendência concluída", "Task completed", "任务已完成"], task_reopened: ["Pendência reaberta", "Task reopened", "任务已重新打开"], task_removed: ["Pendência excluída", "Task removed", "任务已删除"], task_unassigned: ["Responsável da pendência alterado", "Task assignee changed", "任务负责人已更改"],
  document_added: ["Novo documento registrado", "New document registered", "已登记新文件"], document_updated: ["Documento atualizado", "Document updated", "文件已更新"],
  approved: ["Custos aprovados", "Costs approved", "费用已批准"], status: ["Status da operação alterado", "Operation status changed", "业务状态已更改"], portStatus: ["Status portuário alterado", "Port status changed", "港口状态已更改"], customsChannel: ["Canal aduaneiro alterado", "Customs channel changed", "海关通道已更改"], shipmentStatus: ["Embarque atualizado", "Shipment updated", "装运已更新"], eta_changed: ["Previsão de chegada alterada", "Expected arrival changed", "预计到港日期已更改"], note_added: ["Nova atualização na operação", "New operation update", "业务有新更新"],
  task_due: ["Pendência vence hoje", "Task due today", "任务今日到期"], task_overdue: ["Pendência atrasada", "Task overdue", "任务已逾期"], document_expiring: ["Documento próximo do vencimento", "Document expiring soon", "文件即将到期"], document_expired: ["Documento vencido", "Document expired", "文件已过期"], eta_due: ["Chegada prevista para hoje", "Arrival expected today", "预计今日到港"],
};

export function Notifications({ apiUrl, token, onOpen }: { apiUrl: string; token: string; onOpen: (id: string, section: string) => void }) {
  const locale = useLocale(); const language = locale === "en-US" ? 1 : locale === "zh-CN" ? 2 : 0;
  const copy = (pt: string, en: string, zh: string) => [pt, en, zh][language];
  const [open, setOpen] = useState(false); const [items, setItems] = useState<Notification[]>([]);
  const [count, setCount] = useState(0); const [cursor, setCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(""); const [connected, setConnected] = useState(false);
  const [marking, setMarking] = useState(false);
  const mounted = useRef(true); const generation = useRef(0); const controller = useRef<AbortController | null>(null);
  const load = useCallback(async (before?: string) => {
    const version = ++generation.current; setLoading(true);
    try {
      const response = await apiFetch(`${apiUrl}/api/notifications${before ? `?before=${encodeURIComponent(before)}` : ""}`, { signal: controller.current?.signal, headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json(); if (!response.ok) throw new Error(data.message);
      if (!mounted.current || version !== generation.current) return;
      setItems(current => before ? [...current, ...data.items.filter((item: Notification) => !current.some(existing => existing.id === item.id))] : data.items);
      setCount(data.unreadCount); setCursor(data.nextCursor); setError("");
    } catch (error) { if (mounted.current && version === generation.current && !controller.current?.signal.aborted) setError(error instanceof Error ? error.message : "Erro"); }
    finally { if (mounted.current && version === generation.current) setLoading(false); }
  }, [apiUrl, token]);
  useEffect(() => {
    mounted.current = true; const abort = new AbortController(); controller.current = abort;
    let retry: ReturnType<typeof setTimeout>; let backoff = 1000;
    const connect = async () => {
      try {
        const response = await apiFetch(`${apiUrl}/api/notifications/stream`, { signal: abort.signal, headers: { Authorization: `Bearer ${token}` } });
        if (!response.ok || !response.body) throw new Error("Stream unavailable");
        setConnected(true); backoff = 1000; void load(); window.dispatchEvent(new Event("exporta:operations"));
        const reader = response.body.getReader(); const decoder = new TextDecoder(); let buffer = "";
        for (;;) {
          const { value, done } = await reader.read(); if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let end: number;
          while ((end = buffer.indexOf("\n\n")) >= 0) {
            const frame = buffer.slice(0, end); buffer = buffer.slice(end + 2);
            if (frame.includes("event: operations")) window.dispatchEvent(new Event("exporta:operations"));
            if (frame.includes("event: notifications")) void load();
            if (frame.includes("event: expired")) { await apiFetch(`${apiUrl}/api/notifications`, { headers: { Authorization: `Bearer ${token}` } }); return; }
          }
        }
      } catch { /* HTTP fallback remains available while reconnecting. */ }
      if (!abort.signal.aborted) { setConnected(false); retry = setTimeout(() => void connect(), backoff); backoff = Math.min(30000, backoff * 2); }
    };
    void load(); void connect();
    const timer = setInterval(() => void load(), 60000);
    return () => { mounted.current = false; abort.abort(); clearTimeout(retry); clearInterval(timer); };
  }, [apiUrl, token, load]);
  async function mark(id?: string) {
    setMarking(true);
    try {
      const response = await apiFetch(`${apiUrl}/api/notifications/${id ? `${id}/read` : "read-all"}`, { method: id ? "PATCH" : "POST", headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error((await response.json()).message);
      await load(); return true;
    } catch (error) { if (mounted.current) setError(error instanceof Error ? error.message : "Erro"); return false; }
    finally { if (mounted.current) setMarking(false); }
  }
  const title = copy("Notificações", "Notifications", "通知");
  const detail = (item: Notification) => {
    const meta = item.kind === "status" ? importStatusMeta : item.kind === "portStatus" ? portStatusMeta : item.kind === "customsChannel" ? customsChannelMeta : item.kind === "shipmentStatus" ? shipmentStatusMeta : null;
    const label = meta && item.value ? (meta as Record<string, { label: string }>)[item.value]?.label : undefined;
    return label ? translateUiText(locale, label) : item.detail;
  };
  return <Popover open={open} onOpenChange={value => { setOpen(value); if (value) void load(); }}><PopoverTrigger asChild><Button className="icon-button notification" aria-label={`${title}${count ? ` (${count})` : ""}`}><Bell size={19} />{count > 0 && <span className="notification-count">{count > 99 ? "99+" : count}</span>}</Button></PopoverTrigger>
    <PopoverContent align="end" className="notifications-panel" aria-label={title} data-localized>
      <div className="notifications-heading"><div><strong>{title}</strong><small>{count} {copy("não lidas", "unread", "条未读")} · {connected ? copy("Ao vivo", "Live", "实时") : copy("Reconectando…", "Reconnecting…", "正在重新连接…")}</small></div><Button className="icon-button" disabled={!count || marking} onClick={() => void mark()} aria-label={copy("Marcar todas como lidas", "Mark all as read", "全部标记为已读")}>{marking ? <Spinner /> : <CheckCheck size={20} />}</Button></div>
      {error && <div className="notifications-error" role="alert"><CircleAlert size={16} /><span>{copy("Não foi possível atualizar as notificações.", "Could not update notifications.", "无法更新通知。")}</span><Button onClick={() => void load()}>{copy("Tentar novamente", "Retry", "重试")}</Button></div>}
      <div className="notifications-list" aria-busy={loading}>
        {loading && !items.length ? [1, 2, 3].map(id => <div className="notification-skeleton" key={id}><span /><span /><span /></div>) : items.length ? items.map(item => <Button key={item.id} className={`notification-item ${!item.readAt ? "is-unread" : ""} ${item.critical ? "is-critical" : ""}`} onClick={() => { if (!item.readAt) void mark(item.id); setOpen(false); onOpen(item.operationId, item.section); }}>
          <span className="notification-item__dot" /><span className="notification-item__body"><small>{item.reference} · {item.readAt ? copy("Lida", "Read", "已读") : copy("Não lida", "Unread", "未读")}{item.critical && ` · ${copy("Atenção", "Attention", "注意")}`}</small><strong>{(labels[item.kind] ?? [item.kind, item.kind, item.kind])[language]}</strong>{detail(item) && <span>{detail(item)}</span>}<small>{item.actorName || copy("Sistema", "System", "系统")} · {new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(new Date(item.createdAt))}</small></span>
        </Button>) : !error && <div className="notifications-empty"><Bell size={26} /><strong>{copy("Tudo em dia", "You're all caught up", "暂无通知")}</strong><p>{copy("Você receberá aqui atualizações das suas importações e pendências.", "Updates to your imports and tasks will appear here.", "您的进口业务和任务更新将显示在这里。")}</p></div>}
      </div>
      {cursor && <Button className="notifications-more" disabled={loading} onClick={() => void load(cursor)}>{loading ? <Spinner /> : copy("Ver mais", "Load more", "加载更多")}</Button>}
    </PopoverContent></Popover>;
}
