import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";
import {
  Archive, ArrowLeft, Bell, Box, ChartNoAxesCombined, ChevronLeft, ChevronRight, CircleHelp, ClipboardList,
  Container, FileBarChart, LayoutDashboard, MapPinned, Menu, PackagePlus, Plus,
  Pencil, Search, Settings, ShipWheel, SlidersHorizontal, Users, X
} from "lucide-react";
import {
  calculateImport, importStatusMeta, portStatusMeta,
  type Customer, type ImportItem, type ImportOperation, type ImportStatus, type PortFacility, type PortStatus
} from "@exporta/domain";
import { DialogClose, DialogContent, DialogRoot, DialogTitle } from "./components/ui/dialog";

type View = "dashboard" | "imports" | "ports" | "pending" | "customers" | "reports";

const storageKey = "exporta-brasil-imports-v1";
const customersStorageKey = "exporta-brasil-customers-v1";
const apiUrl = import.meta.env.VITE_API_URL ?? "http://localhost:3171";
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const decimal = new Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const initialOperations: ImportOperation[] = [{
  id: "imp-001", reference: "EB-2026-001", customerId: "customer-001", customer: "Aurora Comércio", supplier: "Ningbo Horizon Co.",
  port: "Porto de Santos", container: "TGHU 812903-4", status: "customs", portStatus: "customs_clearance",
  eta: "2026-10-03", createdAt: "2026-09-12T10:00:00.000Z", updatedAt: "2026-09-27T14:30:00.000Z", exchangeRate: 5.42,
  freightBrl: 18400, insuranceBrl: 1850, portExpensesBrl: 12680,
  items: [
    { id: "item-001", name: "Mala de viagem rígida", ncm: "42021220", quantity: 480, unitPriceUsd: 18.4, grossWeightKg: 3.2, iiRate: 18, ipiRate: 15 },
    { id: "item-002", name: "Mochila executiva", ncm: "42029200", quantity: 720, unitPriceUsd: 11.7, grossWeightKg: 1.1, iiRate: 20, ipiRate: 10 }
  ]
}, {
  id: "imp-002", reference: "EB-2026-002", customerId: "customer-002", customer: "Casa Norte", supplier: "Qingdao Bright Ltd.",
  port: "Porto de Itajaí", container: "TRHU 229140-6", status: "in_transit", portStatus: "in_transit",
  eta: "2026-10-16", createdAt: "2026-09-18T10:00:00.000Z", updatedAt: "2026-09-26T11:00:00.000Z", exchangeRate: 5.38,
  freightBrl: 12600, insuranceBrl: 980, portExpensesBrl: 8200,
  items: [{ id: "item-003", name: "Organizador doméstico", ncm: "39249000", quantity: 1200, unitPriceUsd: 4.85, grossWeightKg: 0.45, iiRate: 18, ipiRate: 5 }]
}];

const initialCustomers: Customer[] = [
  { id: "customer-001", legalName: "Aurora Comércio e Importação Ltda.", tradeName: "Aurora Comércio", taxId: "12.345.678/0001-90", contactName: "Renata Prado", email: "renata@auroracomercio.com.br", phone: "+55 11 99999-1020", status: "active", createdAt: "2026-09-01T09:00:00.000Z" },
  { id: "customer-002", legalName: "Casa Norte Utilidades Ltda.", tradeName: "Casa Norte", taxId: "45.678.901/0001-23", contactName: "Marcelo Lima", email: "marcelo@casanorte.com.br", phone: "+55 47 98888-2040", status: "active", createdAt: "2026-09-05T09:00:00.000Z" }
];

const navigation: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Início", icon: LayoutDashboard },
  { id: "imports", label: "Operações", icon: ShipWheel },
  { id: "customers", label: "Clientes", icon: Users },
  { id: "ports", label: "Portos", icon: MapPinned },
  { id: "reports", label: "Relatórios", icon: ChartNoAxesCombined },
  { id: "pending", label: "Pendências", icon: ClipboardList }
];

function uid(prefix: string) { return `${prefix}-${crypto.randomUUID()}`; }
function inputNumber(value: FormDataEntryValue | null) { return Number(String(value ?? "0").replace(",", ".")) || 0; }
function formatDate(value: string) { return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function operationIdFromPath() { return window.location.pathname.match(/^\/operacoes\/([^/]+)$/)?.[1] ?? null; }

export function App() {
  const [view, setView] = useState<View>(() => operationIdFromPath() ? "imports" : "dashboard");
  const [operations, setOperations] = useState<ImportOperation[]>(() => {
    try { return JSON.parse(localStorage.getItem(storageKey) || "") as ImportOperation[]; } catch { return initialOperations; }
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try { return JSON.parse(localStorage.getItem(customersStorageKey) || "") as Customer[]; } catch { return initialCustomers; }
  });
  const [selectedId, setSelectedId] = useState("imp-001");
  const [detailId, setDetailId] = useState<string | null>(operationIdFromPath);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNewImport, setShowNewImport] = useState(false);
  const [showNewItem, setShowNewItem] = useState(false);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [importCustomerId, setImportCustomerId] = useState("");
  const [portFacilities, setPortFacilities] = useState<PortFacility[]>([]);
  const [portCatalogState, setPortCatalogState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [portCatalogError, setPortCatalogError] = useState("");

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(operations)); }, [operations]);
  useEffect(() => { localStorage.setItem(customersStorageKey, JSON.stringify(customers)); }, [customers]);
  useEffect(() => { const syncRoute = () => setDetailId(operationIdFromPath()); window.addEventListener("popstate", syncRoute); return () => window.removeEventListener("popstate", syncRoute); }, []);
  const loadPortCatalog = () => {
    setPortCatalogState("loading"); setPortCatalogError("");
    fetch(`${apiUrl}/api/port-facilities`).then(async (response) => {
      if (!response.ok) throw new Error((await response.json() as { message?: string }).message ?? "Não foi possível carregar o catálogo.");
      return response.json() as Promise<{ data: PortFacility[] }>;
    }).then((payload) => { setPortFacilities(payload.data); setPortCatalogState("ready"); }).catch((error: unknown) => {
      setPortCatalogError(error instanceof Error ? error.message : "Não foi possível carregar o catálogo."); setPortCatalogState("error");
    });
  };
  useEffect(() => { if (view === "ports" && portCatalogState === "idle") loadPortCatalog(); }, [view, portCatalogState]);
  const selected = operations.find((operation) => operation.id === selectedId) ?? operations[0];
  const totalInProgress = operations.filter((item) => !["completed", "cleared"].includes(item.status)).length;
  const totalValue = useMemo(() => operations.reduce((sum, operation) => sum + calculateImport(operation).totalCost, 0), [operations]);

  const updateOperation = (id: string, changes: Partial<ImportOperation>) => {
    setOperations((current) => current.map((operation) => operation.id === id ? { ...operation, ...changes, updatedAt: new Date().toISOString() } : operation));
  };

  const createOperation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const customerId = String(form.get("customerId"));
    const customer = customers.find((item) => item.id === customerId);
    if (!customer) return;
    const operation: ImportOperation = {
      id: uid("imp"), reference: String(form.get("reference") || `EB-${new Date().getFullYear()}-${String(operations.length + 1).padStart(3, "0")}`),
      customerId, customer: customer.tradeName || customer.legalName, supplier: String(form.get("supplier")), port: String(form.get("port")),
      container: String(form.get("container")), eta: String(form.get("eta")), status: "draft", portStatus: "awaiting_departure",
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), exchangeRate: 5.4, freightBrl: 0, insuranceBrl: 0, portExpensesBrl: 0, items: []
    };
    setOperations((current) => [operation, ...current]); setSelectedId(operation.id); setImportCustomerId(""); setShowNewImport(false); setView("imports");
  };

  const saveCustomer = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const details = { legalName: String(form.get("legalName")), tradeName: String(form.get("tradeName")) || String(form.get("legalName")), taxId: String(form.get("taxId")), contactName: String(form.get("contactName")), email: String(form.get("email")), phone: String(form.get("phone")) };
    if (editingCustomer) {
      setCustomers((current) => current.map((customer) => customer.id === editingCustomer.id ? { ...customer, ...details } : customer));
    } else {
      const customer: Customer = { id: uid("customer"), ...details, status: "active", createdAt: new Date().toISOString() };
      setCustomers((current) => [customer, ...current]); setImportCustomerId(customer.id);
    }
    setEditingCustomer(null); setShowNewCustomer(false);
  };

  const addItem = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); if (!selected) return;
    const form = new FormData(event.currentTarget);
    const item: ImportItem = {
      id: uid("item"), name: String(form.get("name")), ncm: String(form.get("ncm")), quantity: inputNumber(form.get("quantity")),
      unitPriceUsd: inputNumber(form.get("unitPriceUsd")), grossWeightKg: inputNumber(form.get("grossWeightKg")),
      iiRate: inputNumber(form.get("iiRate")), ipiRate: inputNumber(form.get("ipiRate"))
    };
    updateOperation(selected.id, { items: [...selected.items, item] }); setShowNewItem(false);
  };

  const changeView = (next: View) => { setView(next); setSidebarOpen(false); };
  const openOperation = (id: string) => { window.history.pushState({}, "", `/operacoes/${id}`); setSelectedId(id); setDetailId(id); setView("imports"); };
  const closeOperationDetail = () => { window.history.pushState({}, "", "/operacoes"); setDetailId(null); };
  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? "sidebar--open" : ""}`} aria-label="Navegação principal">
      <div className="brand"><span className="brand-mark">EB</span><span><strong>Exporta</strong><small>Brasil</small></span><button className="icon-button mobile-only" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu"><X size={20} /></button></div>
      <nav>{navigation.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${view === id ? "is-active" : ""}`} onClick={() => changeView(id)}><Icon size={19} /><span>{label}</span>{id === "pending" && <b className="nav-count">3</b>}</button>)}</nav>
      <div className="sidebar-footer"><button className="nav-item"><Settings size={19} /><span>Configurações</span></button><div className="user-card"><span className="avatar">LA</span><span><strong>Lucas Alves</strong><small>Administrador</small></span></div></div>
    </aside>
    {sidebarOpen && <button className="scrim" onClick={() => setSidebarOpen(false)} aria-label="Fechar menu" />}
    <main className="main-content">
      <header className="topbar"><button className="icon-button mobile-only" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu"><Menu size={21} /></button><div className="breadcrumb"><span>Início</span><ChevronRight size={15} /><strong>{view === "dashboard" ? "Visão geral" : navigation.find((item) => item.id === view)?.label}</strong></div><div className="top-actions"><button className="icon-button" aria-label="Buscar"><Search size={19} /></button><button className="icon-button notification" aria-label="Notificações"><Bell size={19} /><i /></button><button className="icon-button" aria-label="Ajuda"><CircleHelp size={19} /></button></div></header>
      {view === "dashboard" && <Dashboard operations={operations} totalInProgress={totalInProgress} totalValue={totalValue} onOpen={() => setView("imports")} />}
       {view === "imports" && !detailId && <OperationsListView operations={operations} onNew={() => setShowNewImport(true)} onOpen={openOperation} />}
       {view === "imports" && detailId && selected && <OperationDetailPage selected={selected} onBack={closeOperationDetail} onAddItem={() => setShowNewItem(true)} onUpdate={updateOperation} />}
       {view === "ports" && <PortsCatalogView facilities={portFacilities} state={portCatalogState} error={portCatalogError} onRetry={loadPortCatalog} />}
       {view === "customers" && <CustomersView customers={customers} operations={operations} onNew={() => { setEditingCustomer(null); setShowNewCustomer(true); }} onEdit={(customer) => { setEditingCustomer(customer); setShowNewCustomer(true); }} />}
       {["pending", "reports"].includes(view) && <Placeholder view={view} onNavigate={() => setView("imports")} />}
    </main>
    <nav className="bottom-nav" aria-label="Navegação móvel">{navigation.slice(0, 4).map(({ id, label, icon: Icon }) => <button key={id} className={view === id ? "is-active" : ""} onClick={() => changeView(id)}><Icon size={19} /><span>{label}</span></button>)}</nav>
    {showNewImport && <Dialog title="Nova importação" onClose={() => { setShowNewImport(false); setImportCustomerId(""); }}><ImportForm customers={customers} customerId={importCustomerId} onCustomerChange={setImportCustomerId} onNewCustomer={() => { setEditingCustomer(null); setShowNewCustomer(true); }} onSubmit={createOperation} /></Dialog>}
    {showNewItem && <Dialog title="Adicionar produto" onClose={() => setShowNewItem(false)}><ItemForm onSubmit={addItem} /></Dialog>}
    {showNewCustomer && <Dialog title={editingCustomer ? "Editar cliente" : "Novo cliente"} onClose={() => { setEditingCustomer(null); setShowNewCustomer(false); }}><CustomerForm customer={editingCustomer} onSubmit={saveCustomer} /></Dialog>}
  </div>;
}

function Dashboard({ operations, totalInProgress, totalValue, onOpen }: { operations: ImportOperation[]; totalInProgress: number; totalValue: number; onOpen: () => void }) {
  const atPort = operations.filter((operation) => ["at_port", "customs"].includes(operation.status)).length;
  return <section className="page"><div className="page-heading"><div><p className="eyebrow">CENTRO DE CONTROLE</p><h1>Operações sob controle.</h1><p className="muted">Acompanhe custos, cargas e decisões que pedem atenção.</p></div><button className="button button--primary" onClick={onOpen}><ShipWheel size={18} /> Ver operações</button></div>
    <div className="metric-grid"><Metric icon={<Container />} label="Importações ativas" value={String(totalInProgress)} detail="processos em andamento" tone="blue" /><Metric icon={<MapPinned />} label="Cargas em porto" value={String(atPort)} detail="com atualização necessária" tone="amber" /><Metric icon={<ChartNoAxesCombined />} label="Custo projetado" value={money.format(totalValue)} detail="nas operações abertas" tone="green" /></div>
    <div className="dashboard-grid"><section className="panel"><div className="panel-header"><div><h2>Operações recentes</h2><p>Os processos que exigem acompanhamento.</p></div><button className="text-button" onClick={onOpen}>Ver todas</button></div><div className="activity-list">{operations.map((operation) => <button className="activity-row" key={operation.id} onClick={onOpen}><span className="activity-icon"><ShipWheel size={18} /></span><span><strong>{operation.reference}</strong><small>{operation.customer} · {operation.port}</small></span><StatusBadge status={operation.status} /><ChevronRight size={18} /></button>)}</div></section>
      <section className="panel attention-card"><div className="panel-header"><div><h2>Próxima decisão</h2><p>Uma pendência prioritária.</p></div><span className="urgency">Hoje</span></div><div className="attention-body"><span className="attention-icon"><ClipboardList size={22} /></span><div><strong>Validar documentação de desembaraço</strong><p>EB-2026-001 está em análise aduaneira no Porto de Santos.</p><button className="text-button" onClick={onOpen}>Abrir operação <ChevronRight size={15} /></button></div></div></section></div>
  </section>;
}

function OperationsListView({ operations, onNew, onOpen }: { operations: ImportOperation[]; onNew: () => void; onOpen: (id: string) => void }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<ImportStatus | "all">("all");
  const [sort, setSort] = useState<"oldest" | "newest" | "updated">("oldest");
  const [page, setPage] = useState(1);
  const pageSize = 8;
  const filtered = operations.filter((operation) => (!query || `${operation.reference} ${operation.customer} ${operation.supplier} ${operation.port}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))) && (status === "all" || operation.status === status));
  const ordered = [...filtered].sort((a, b) => { const created = new Date(a.createdAt ?? a.updatedAt).getTime() - new Date(b.createdAt ?? b.updatedAt).getTime(); if (sort === "newest") return -created; if (sort === "updated") return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(); return created; });
  const totalPages = Math.max(1, Math.ceil(ordered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = ordered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const resetPage = () => setPage(1);
  return <section className="page operations-page"><div className="page-heading"><div><p className="eyebrow">GESTÃO DE IMPORTAÇÕES</p><h1>Operações</h1><p className="muted">Encontre uma operação, filtre a fila e abra um processo para trabalhar nos detalhes.</p></div><button className="button button--primary" onClick={onNew}><Plus size={18} /> Nova importação</button></div><section className="panel operations-list-panel"><div className="operations-toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Buscar por referência, cliente ou porto" aria-label="Buscar operações" /></label><div className="operation-filters"><label><SlidersHorizontal size={15} /><span className="sr-only">Status</span><select value={status} onChange={(event) => { setStatus(event.target.value as ImportStatus | "all"); resetPage(); }}><option value="all">Todos os status</option>{Object.entries(importStatusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label><label><span className="sr-only">Ordenação</span><select value={sort} onChange={(event) => { setSort(event.target.value as "oldest" | "newest" | "updated"); resetPage(); }}><option value="oldest">Mais antigas primeiro</option><option value="newest">Mais recentes primeiro</option><option value="updated">Atualizadas recentemente</option></select></label></div></div><div className="table-scroll"><table className="operations-table"><thead><tr><th>Referência</th><th>Cliente</th><th>Destino</th><th>ETA</th><th>Status</th><th>Criada em</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{visible.length === 0 ? <tr><td className="empty-cell" colSpan={7}>Nenhuma operação corresponde aos filtros.</td></tr> : visible.map((operation) => <tr key={operation.id}><td><strong>{operation.reference}</strong><small>{operation.supplier}</small></td><td>{operation.customer}</td><td><strong>{operation.port}</strong><small>{operation.container}</small></td><td>{formatDate(operation.eta)}</td><td><StatusBadge status={operation.status} /></td><td>{new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(operation.createdAt ?? operation.updatedAt))}</td><td><button className="table-detail-button" onClick={() => onOpen(operation.id)}>Ver detalhes <ChevronRight size={16} /></button></td></tr>)}</tbody></table></div><footer className="pagination"><span>{ordered.length === 0 ? "Nenhuma operação" : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, ordered.length)} de ${ordered.length} operações`}</span><div><button className="icon-button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Página anterior"><ChevronLeft size={18} /></button><span>Página {currentPage} de {totalPages}</span><button className="icon-button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Próxima página"><ChevronRight size={18} /></button></div></footer></section></section>;
}

function OperationDetailPage({ selected, onBack, onAddItem, onUpdate }: { selected: ImportOperation; onBack: () => void; onAddItem: () => void; onUpdate: (id: string, changes: Partial<ImportOperation>) => void }) {
  const calculated = calculateImport(selected);
  return <section className="page operations-page"><div className="detail-heading"><button className="back-button" onClick={onBack}><ArrowLeft size={17} /> Todas as operações</button><p className="eyebrow">DETALHE DA OPERAÇÃO</p></div><OperationHeader operation={selected} onUpdate={onUpdate} /><div className="summary-grid"><Summary label="Custo total" value={money.format(calculated.totalCost)} detail="estimativa atual" /><Summary label="Tributos estimados" value={money.format(calculated.taxes)} detail="II + IPI" /><Summary label="Peso bruto" value={`${decimal.format(calculated.totalWeight)} kg`} detail="todos os itens" /></div><section className="panel"><div className="panel-header"><div><h2>Produtos da importação</h2><p>O custo unitário já inclui rateio e tributos.</p></div><button className="button button--secondary" onClick={onAddItem}><PackagePlus size={17} /> Adicionar item</button></div><ProductsTable calculated={calculated} /></section><CostsForm operation={selected} calculated={calculated} onUpdate={onUpdate} /></section>;
}

function OperationHeader({ operation, onUpdate }: { operation: ImportOperation; onUpdate: (id: string, changes: Partial<ImportOperation>) => void }) {
  return <header className="operation-header panel"><div><p className="eyebrow">{operation.reference}</p><h2>{operation.customer}</h2><p className="muted">{operation.supplier} · {operation.container}</p></div><div className="operation-status"><label>Status da operação<select value={operation.status} onChange={(event) => onUpdate(operation.id, { status: event.target.value as ImportStatus })}>{Object.entries(importStatusMeta).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label><StatusBadge status={operation.status} /></div><div className="port-progress"><div><span className="port-pin"><MapPinned size={18} /></span><span><strong>{operation.port}</strong><small>ETA {formatDate(operation.eta)}</small></span></div><label>Status portuário<select value={operation.portStatus} onChange={(event) => onUpdate(operation.id, { portStatus: event.target.value as PortStatus })}>{Object.entries(portStatusMeta).map(([value, meta]) => <option value={value} key={value}>{meta.label}</option>)}</select></label></div></header>;
}

function PortsCatalogView({ facilities, state, error, onRetry }: { facilities: PortFacility[]; state: "idle" | "loading" | "ready" | "error"; error: string; onRetry: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedState, setSelectedState] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [page, setPage] = useState(1);
  const pageSize = 12;
  const states = [...new Set(facilities.map((facility) => facility.state))].sort();
  const types = [...new Set(facilities.map((facility) => facility.type))].sort();
  const filtered = facilities.filter((facility) => (!query || `${facility.name} ${facility.municipality} ${facility.state}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))) && (selectedState === "all" || facility.state === selectedState) && (selectedType === "all" || facility.type === selectedType));
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const resetPage = () => setPage(1);
  return <section className="page ports-catalog-page"><div className="page-heading"><div><p className="eyebrow">DADOS DE REFERÊNCIA</p><h1>Instalações portuárias</h1><p className="muted">Catálogo oficial para padronizar portos e terminais nas operações de importação.</p></div><a className="button button--secondary" href="https://www.gov.br/antaq/pt-br/assuntos/instalacoes-portuarias" target="_blank" rel="noreferrer">Fonte: ANTAQ</a></div><section className="panel ports-catalog-panel"><div className="ports-catalog-context"><span><MapPinned size={18} aria-hidden="true" /><strong>{facilities.length || "—"}</strong> instalações publicadas</span><span>Referência administrativa; o andamento da carga é registrado dentro de cada operação.</span></div><div className="operations-toolbar ports-toolbar"><label className="search-field"><Search size={17} aria-hidden="true" /><input value={query} onChange={(event) => { setQuery(event.target.value); resetPage(); }} placeholder="Buscar por instalação, cidade ou UF" aria-label="Buscar instalações portuárias" /></label><div className="operation-filters"><label><span className="sr-only">UF</span><select value={selectedState} onChange={(event) => { setSelectedState(event.target.value); resetPage(); }}><option value="all">Todas as UFs</option>{states.map((item) => <option value={item} key={item}>{item}</option>)}</select></label><label><span className="sr-only">Tipo</span><select value={selectedType} onChange={(event) => { setSelectedType(event.target.value); resetPage(); }}><option value="all">Todos os tipos</option>{types.map((item) => <option value={item} key={item}>{item}</option>)}</select></label></div></div>{state === "loading" && <div className="catalog-message" role="status">Consultando o catálogo de instalações portuárias…</div>}{state === "error" && <div className="catalog-message catalog-message--error" role="alert"><span>{error}</span><button className="button button--secondary" onClick={onRetry}>Tentar novamente</button></div>}{state === "ready" && <><div className="table-scroll"><table className="ports-table"><thead><tr><th>Instalação</th><th>Localização</th><th>Tipo</th><th>Gestão</th><th>Situação</th></tr></thead><tbody>{visible.length === 0 ? <tr><td className="empty-cell" colSpan={5}>Nenhuma instalação corresponde aos filtros.</td></tr> : visible.map((facility) => <tr key={facility.id}><td><strong>{facility.name}</strong><small>ID ANTAQ {facility.id}</small></td><td><strong>{facility.municipality}</strong><small>{facility.state}</small></td><td><span className="facility-type">{facility.type}</span></td><td>{facility.management || "Não informado"}</td><td><span className="facility-status">{facility.operationalStatus || "Não informado"}</span></td></tr>)}</tbody></table></div><footer className="pagination"><span>{filtered.length === 0 ? "Nenhuma instalação" : `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} de ${filtered.length} instalações`}</span><div><button className="icon-button" disabled={currentPage === 1} onClick={() => setPage((value) => Math.max(1, value - 1))} aria-label="Página anterior"><ChevronLeft size={18} /></button><span>Página {currentPage} de {totalPages}</span><button className="icon-button" disabled={currentPage === totalPages} onClick={() => setPage((value) => Math.min(totalPages, value + 1))} aria-label="Próxima página"><ChevronRight size={18} /></button></div></footer></>}</section></section>;
}

function ProductsTable({ calculated }: { calculated: ReturnType<typeof calculateImport> }) { return <div className="table-scroll"><table><thead><tr><th>Produto / NCM</th><th>Qtd.</th><th>FOB</th><th>Rateio</th><th>Tributos</th><th>Custo unitário</th></tr></thead><tbody>{calculated.items.length === 0 ? <tr><td colSpan={6} className="empty-cell">Adicione os produtos para calcular os custos.</td></tr> : calculated.items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong><small>{item.ncm}</small></td><td>{item.quantity}</td><td>{money.format(item.itemFob)}</td><td>{money.format(item.allocatedExpenses)}</td><td>{money.format(item.ii + item.ipi)}</td><td><strong>{money.format(item.unitCost)}</strong></td></tr>)}</tbody></table></div>; }

function CostsForm({ operation, calculated, onUpdate }: { operation: ImportOperation; calculated: ReturnType<typeof calculateImport>; onUpdate: (id: string, changes: Partial<ImportOperation>) => void }) { return <section className="panel costs-panel"><div className="panel-header"><div><h2>Valores e rateio</h2><p>Os custos logísticos são distribuídos proporcionalmente ao FOB de cada item.</p></div></div><div className="cost-inputs"><NumberField label="Câmbio (R$/US$)" value={operation.exchangeRate} step="0.01" onChange={(value) => onUpdate(operation.id, { exchangeRate: value })} /><NumberField label="Frete internacional" value={operation.freightBrl} onChange={(value) => onUpdate(operation.id, { freightBrl: value })} prefix="R$" /><NumberField label="Seguro" value={operation.insuranceBrl} onChange={(value) => onUpdate(operation.id, { insuranceBrl: value })} prefix="R$" /><NumberField label="Despesas portuárias" value={operation.portExpensesBrl} onChange={(value) => onUpdate(operation.id, { portExpensesBrl: value })} prefix="R$" /></div><div className="cost-result"><span>Base FOB: <strong>{money.format(calculated.fobBrl)}</strong></span><span>Custos rateados: <strong>{money.format(calculated.baseExpenses)}</strong></span><span>Tributos: <strong>{money.format(calculated.taxes)}</strong></span><span className="cost-total">Total projetado <strong>{money.format(calculated.totalCost)}</strong></span></div></section>; }

function NumberField({ label, value, onChange, prefix, step = "1" }: { label: string; value: number; onChange: (value: number) => void; prefix?: string; step?: string }) { return <label className="field"><span>{label}</span><div className="number-input">{prefix && <b>{prefix}</b>}<input type="number" min="0" step={step} value={value} onChange={(event) => onChange(Number(event.target.value) || 0)} /></div></label>; }
function Summary({ label, value, detail }: { label: string; value: string; detail: string }) { return <div className="summary-card"><span>{label}</span><strong>{value}</strong><small>{detail}</small></div>; }
function Metric({ icon, label, value, detail, tone }: { icon: ReactNode; label: string; value: string; detail: string; tone: string }) { return <section className={`metric-card tone-${tone}`}><span className="metric-icon">{icon}</span><p>{label}</p><strong>{value}</strong><small>{detail}</small></section>; }
function StatusBadge({ status }: { status: ImportStatus }) { const meta = importStatusMeta[status]; return <span className={`status status--${meta.tone}`}>{meta.label}</span>; }
function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) { return <DialogRoot open onOpenChange={(open) => { if (!open) onClose(); }}><DialogContent aria-describedby={undefined}><header><DialogTitle asChild><h2>{title}</h2></DialogTitle><DialogClose asChild><button className="icon-button" aria-label="Fechar"><X size={20} /></button></DialogClose></header>{children}</DialogContent></DialogRoot>; }
function ImportForm({ customers, customerId, onCustomerChange, onNewCustomer, onSubmit }: { customers: Customer[]; customerId: string; onCustomerChange: (id: string) => void; onNewCustomer: () => void; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form className="form-grid" onSubmit={onSubmit}><label className="field"><span>Referência</span><input name="reference" placeholder="EB-2026-003" /></label><div className="field"><span>Cliente</span><div className="customer-picker"><select name="customerId" required value={customerId} onChange={(event) => onCustomerChange(event.target.value)}><option value="">Selecione um cliente</option>{customers.filter((customer) => customer.status === "active").map((customer) => <option value={customer.id} key={customer.id}>{customer.tradeName || customer.legalName} · {customer.taxId}</option>)}</select><button className="text-button" type="button" onClick={onNewCustomer}><Plus size={15} /> Novo cliente</button></div></div><label className="field"><span>Fornecedor</span><input name="supplier" required placeholder="Fornecedor internacional" /></label><label className="field"><span>Porto de destino</span><input name="port" required defaultValue="Porto de Santos" /></label><label className="field"><span>Contêiner</span><input name="container" required placeholder="ABCD 123456-7" /></label><label className="field"><span>ETA</span><input name="eta" type="date" required /></label><button className="button button--primary form-submit" type="submit"><Plus size={18} /> Criar importação</button></form>; }
function ItemForm({ onSubmit }: { onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form className="form-grid" onSubmit={onSubmit}><label className="field full"><span>Produto</span><input name="name" required placeholder="Descrição comercial" /></label><label className="field"><span>NCM</span><input name="ncm" required inputMode="numeric" placeholder="00000000" /></label><label className="field"><span>Quantidade</span><input name="quantity" required type="number" min="1" /></label><label className="field"><span>Preço unitário (US$)</span><input name="unitPriceUsd" required type="number" min="0" step="0.01" /></label><label className="field"><span>Peso bruto unitário (kg)</span><input name="grossWeightKg" required type="number" min="0" step="0.01" /></label><label className="field"><span>II (%)</span><input name="iiRate" required type="number" min="0" step="0.01" defaultValue="18" /></label><label className="field"><span>IPI (%)</span><input name="ipiRate" required type="number" min="0" step="0.01" defaultValue="0" /></label><button className="button button--primary form-submit" type="submit"><PackagePlus size={18} /> Adicionar produto</button></form>; }
function CustomerForm({ customer, onSubmit }: { customer: Customer | null; onSubmit: (event: FormEvent<HTMLFormElement>) => void }) { return <form className="form-grid" onSubmit={onSubmit}><label className="field full"><span>Razão social</span><input name="legalName" required defaultValue={customer?.legalName} placeholder="Empresa Importadora Ltda." /></label><label className="field"><span>Nome fantasia</span><input name="tradeName" defaultValue={customer?.tradeName} placeholder="Como será exibido no sistema" /></label><label className="field"><span>CNPJ</span><input name="taxId" required inputMode="numeric" defaultValue={customer?.taxId} placeholder="00.000.000/0000-00" /></label><label className="field"><span>Responsável</span><input name="contactName" required defaultValue={customer?.contactName} placeholder="Nome do contato" /></label><label className="field"><span>E-mail</span><input name="email" required type="email" defaultValue={customer?.email} placeholder="contato@empresa.com.br" /></label><label className="field"><span>Telefone</span><input name="phone" required type="tel" defaultValue={customer?.phone} placeholder="+55 11 99999-9999" /></label><button className="button button--primary form-submit" type="submit"><Users size={18} /> {customer ? "Salvar alterações" : "Salvar cliente"}</button></form>; }
function CustomersView({ customers, operations, onNew, onEdit }: { customers: Customer[]; operations: ImportOperation[]; onNew: () => void; onEdit: (customer: Customer) => void }) { const [query, setQuery] = useState(""); const visibleCustomers = customers.filter((customer) => `${customer.legalName} ${customer.tradeName} ${customer.taxId}`.toLowerCase().includes(query.toLowerCase())); return <section className="page"><div className="page-heading"><div><p className="eyebrow">CADASTRO E RELACIONAMENTO</p><h1>Clientes</h1><p className="muted">Empresas vinculadas às operações de importação.</p></div><button className="button button--primary" onClick={onNew}><Plus size={18} /> Novo cliente</button></div><section className="panel customers-panel"><div className="customers-toolbar"><label className="search-field"><Search size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por empresa ou CNPJ" aria-label="Buscar clientes" /></label><span>{visibleCustomers.length} cliente{visibleCustomers.length === 1 ? "" : "s"}</span></div><div className="table-scroll"><table><thead><tr><th>Empresa</th><th>CNPJ</th><th>Responsável</th><th>Contato</th><th>Operações</th><th>Status</th><th><span className="sr-only">Ações</span></th></tr></thead><tbody>{visibleCustomers.length === 0 ? <tr><td className="empty-cell" colSpan={7}>Nenhum cliente encontrado.</td></tr> : visibleCustomers.map((customer) => <tr key={customer.id}><td><strong>{customer.tradeName || customer.legalName}</strong><small>{customer.legalName}</small></td><td>{customer.taxId}</td><td>{customer.contactName}</td><td><strong>{customer.email}</strong><small>{customer.phone}</small></td><td>{operations.filter((operation) => operation.customerId === customer.id || operation.customer === customer.tradeName).length}</td><td><span className={`status status--${customer.status === "active" ? "success" : "neutral"}`}>{customer.status === "active" ? "Ativo" : "Inativo"}</span></td><td><button className="table-action" onClick={() => onEdit(customer)} aria-label={`Editar ${customer.tradeName || customer.legalName}`}><Pencil size={16} /></button></td></tr>)}</tbody></table></div></section></section>; }
function Placeholder({ view, onNavigate }: { view: View; onNavigate: () => void }) { const title = navigation.find((item) => item.id === view)?.label ?? "Módulo"; return <section className="page"><div className="placeholder panel"><span><Archive size={28} /></span><p className="eyebrow">PRÓXIMA FRENTE</p><h1>{title}</h1><p>Este módulo já está reservado na arquitetura. A primeira entrega concentra a operação de importação ponta a ponta.</p><button className="button button--secondary" onClick={onNavigate}>Abrir operações</button></div></section>; }
