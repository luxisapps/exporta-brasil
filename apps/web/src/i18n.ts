export const locales = ["pt-BR", "en-US", "zh-CN"] as const;
export type Locale = typeof locales[number];

export const languageOptions: Record<Locale, { flag: string; label: string }> = {
  "pt-BR": { flag: "🇧🇷", label: "Português" },
  "en-US": { flag: "🇺🇸", label: "English" },
  "zh-CN": { flag: "🇨🇳", label: "中文" }
};

type MessageKey = keyof typeof messages["pt-BR"];
const messages = {
  "pt-BR": {
    language: "Idioma", home: "Início", operations: "Operações", customers: "Clientes", ports: "Portos", reports: "Relatórios", pending: "Pendências", users: "Usuários", settings: "Parametrizações", profile: "Meu perfil", signOut: "Sair", search: "Buscar", notifications: "Notificações", help: "Ajuda",
    controlCenter: "CENTRO DE CONTROLE", operationsUnderControl: "Operações sob controle.", dashboardDescription: "Acompanhe custos, cargas e decisões que pedem atenção.", viewOperations: "Ver operações", activeImports: "Importações ativas", ongoingProcesses: "processos em andamento", costsPhase: "Custos", approvedPhase: "Aprovadas", cargoAtPort: "Cargas em porto", needsUpdate: "com atualização necessária", projectedCost: "Custo projetado", approvedCost: "Custo aprovado", unapprovedCostsDetail: "Orçamentos ainda não aprovados", approvedCostsDetail: "Operações com custos aprovados", openOperations: "nas operações abertas",
    customsLight: "Farol aduaneiro", customsDescription: "Operações por canal de conferência. A cor é sempre acompanhada pelo nome e pela etapa aplicável.", noChannel: "Sem canal", channelNotDefined: "Canal ainda não informado", latestNews: "Últimas notícias", officialNewsDescription: "Fontes oficiais de comércio exterior, regulação e portos.", updated: "Atualizado", readNews: "Ler notícia", newsUnavailable: "As fontes oficiais não retornaram notícias agora. Tente atualizar novamente em alguns minutos.", openSiscomex: "Abrir Siscomex",
    recentOperations: "Operações recentes", recentOperationsDescription: "Os processos que exigem acompanhamento.", nextDecision: "Próxima decisão", operationalContext: "Contexto operacional atual", sale: "venda", operationalDataUnavailable: "Dados operacionais indisponíveis", refreshingOperationalData: "Atualizando dados operacionais", recentlyUpdated: "Atualização recente", greenChannel: "Canal verde", yellowChannel: "Canal amarelo", redChannel: "Canal vermelho", grayChannel: "Canal cinza", automaticClearance: "Desembaraço automático", documentInspection: "Exame documental", documentPhysicalInspection: "Exame documental e físico", fraudInvestigation: "Apuração de indícios de fraude", noChannelDefined: "Canal ainda não informado"
  },
  "en-US": {
    language: "Language", home: "Home", operations: "Operations", customers: "Customers", ports: "Ports", reports: "Reports", pending: "Pending", users: "Users", settings: "Settings", profile: "My profile", signOut: "Sign out", search: "Search", notifications: "Notifications", help: "Help",
    controlCenter: "CONTROL CENTER", operationsUnderControl: "Operations under control.", dashboardDescription: "Track costs, cargo, and decisions that need attention.", viewOperations: "View operations", activeImports: "Active imports", ongoingProcesses: "ongoing processes", costsPhase: "Cost estimates", approvedPhase: "Approved", cargoAtPort: "Cargo at port", needsUpdate: "requiring an update", projectedCost: "Projected cost", approvedCost: "Approved cost", unapprovedCostsDetail: "Estimates awaiting approval", approvedCostsDetail: "Operations with approved costs", openOperations: "across open operations",
    customsLight: "Customs signal", customsDescription: "Operations by inspection channel. Each color is always paired with its name and applicable stage.", noChannel: "No channel", channelNotDefined: "Customs channel not provided", latestNews: "Latest news", officialNewsDescription: "Official sources for trade, regulation, and ports.", updated: "Updated", readNews: "Read article", newsUnavailable: "Official sources did not return news right now. Try again in a few minutes.", openSiscomex: "Open Siscomex",
    recentOperations: "Recent operations", recentOperationsDescription: "Processes that need follow-up.", nextDecision: "Next decision", operationalContext: "Current operating context", sale: "sell", operationalDataUnavailable: "Operational data unavailable", refreshingOperationalData: "Updating operational data", recentlyUpdated: "Recent update", greenChannel: "Green channel", yellowChannel: "Yellow channel", redChannel: "Red channel", grayChannel: "Gray channel", automaticClearance: "Automatic clearance", documentInspection: "Document inspection", documentPhysicalInspection: "Document and physical inspection", fraudInvestigation: "Fraud investigation", noChannelDefined: "Customs channel not provided"
  },
  "zh-CN": {
    language: "语言", home: "首页", operations: "业务", customers: "客户", ports: "港口", reports: "报告", pending: "待办", users: "用户", settings: "参数设置", profile: "我的资料", signOut: "退出", search: "搜索", notifications: "通知", help: "帮助",
    controlCenter: "控制中心", operationsUnderControl: "进口业务尽在掌控。", dashboardDescription: "跟踪成本、货物和需要关注的决策。", viewOperations: "查看业务", activeImports: "进行中的进口", ongoingProcesses: "进行中的业务", costsPhase: "成本估算", approvedPhase: "已批准", cargoAtPort: "港口货物", needsUpdate: "需要更新", projectedCost: "预计成本", approvedCost: "已批准成本", unapprovedCostsDetail: "尚未批准的预算", approvedCostsDetail: "成本已批准的业务", openOperations: "所有未结业务",
    customsLight: "海关信号灯", customsDescription: "按查验通道查看业务。每种颜色均配有名称和适用阶段。", noChannel: "未分配通道", channelNotDefined: "尚未提供海关通道", latestNews: "最新资讯", officialNewsDescription: "来自贸易、监管和港口的官方资讯。", updated: "更新于", readNews: "阅读资讯", newsUnavailable: "官方来源暂未返回资讯，请稍后再试。", openSiscomex: "打开 Siscomex",
    recentOperations: "最近业务", recentOperationsDescription: "需要跟进的业务。", nextDecision: "下一项决策", operationalContext: "当前运营信息", sale: "卖出价", operationalDataUnavailable: "运营数据暂不可用", refreshingOperationalData: "正在更新运营数据", recentlyUpdated: "最近更新", greenChannel: "绿色通道", yellowChannel: "黄色通道", redChannel: "红色通道", grayChannel: "灰色通道", automaticClearance: "自动放行", documentInspection: "文件查验", documentPhysicalInspection: "文件与实物查验", fraudInvestigation: "欺诈迹象核查", noChannelDefined: "尚未提供海关通道"
  }
} as const;

export function t(locale: Locale, key: MessageKey) { return messages[locale][key] ?? messages["pt-BR"][key]; }

export const uiText: Record<string, Partial<Record<Exclude<Locale, "pt-BR">, string>>> = {
  "A planilha contém valores CIF. Selecione o modelo da planilha e a base CIF antes de concluir o orçamento.": { "en-US": "The spreadsheet contains CIF values. Select the spreadsheet model and CIF basis before completing the estimate.", "zh-CN": "表格包含CIF价格。完成预算前请选择电子表格模型及CIF基数。" },
  "Premissas da planilha": { "en-US": "Spreadsheet assumptions", "zh-CN": "电子表格参数" },
  "Importar somente produtos": { "en-US": "Import products only", "zh-CN": "仅导入产品" },
  "Aplicar câmbio, margem e despesas da planilha": { "en-US": "Apply spreadsheet exchange rate, markup and expenses", "zh-CN": "应用表格汇率、加价及费用" },
  "As premissas só podem ser aplicadas a um orçamento vazio e não aprovado.": { "en-US": "Assumptions can only be applied to an empty, unapproved estimate.", "zh-CN": "参数仅适用于没有产品且尚未批准的预算。" },
  "Preço por item": {"en-US": "Item pricing", "zh-CN": "单项定价"},
  "Base e custos": {"en-US": "Basis and costs", "zh-CN": "基数与成本"},
  "Bases, entrada, venda e saída calculadas pelo modelo da planilha.": {"en-US": "Bases, import taxes, sales and output taxes from the spreadsheet model.", "zh-CN": "按照电子表格模型计算基数、进口税、销售及销项税。"},
  "Peso líquido total (kg)": {"en-US": "Total net weight (kg)", "zh-CN": "总净重（公斤）"},
  "Peso bruto unitário (kg)": {"en-US": "Gross weight per unit (kg)", "zh-CN": "单件毛重（公斤）"},
  "Impostos de entrada": {"en-US": "Import taxes", "zh-CN": "进口税"},
  "Impostos de saída": {"en-US": "Output taxes", "zh-CN": "销项税"},
  "Origem da alíquota": {"en-US": "Rate source", "zh-CN": "税率来源"},
  "Usar parametrização": {"en-US": "Use default settings", "zh-CN": "使用默认参数"},
  "Definir no produto": {"en-US": "Override for this product", "zh-CN": "为此产品单独设置"},
  "Visão dos cálculos": {"en-US": "Calculation view", "zh-CN": "计算视图"},
  "Valor total USD": {"en-US": "Total USD value", "zh-CN": "美元总价"},
  "Valor convertido": {"en-US": "Converted value", "zh-CN": "换算金额"},
  "Base CIF": {"en-US": "CIF basis", "zh-CN": "CIF基数"},
  "Venda": {"en-US": "Sales", "zh-CN": "销售"},
  "Venda total": {"en-US": "Total sales", "zh-CN": "销售总额"},
  "Venda unitária": {"en-US": "Unit selling price", "zh-CN": "单件售价"},
  "Acréscimo para venda": {"en-US": "Selling markup", "zh-CN": "销售加价"},
  "Saída: saldo total": {"en-US": "Net output taxes", "zh-CN": "销项税净额"},
  "Custo + saldo de saída": {"en-US": "Cost + net output taxes", "zh-CN": "成本加销项税净额"},
  "Alíquotas": {"en-US": "Tax rates", "zh-CN": "税率"},
  "Taxa Siscomex": {"en-US": "Siscomex fee", "zh-CN": "Siscomex费用"},
  "PIS: débito": {"en-US": "PIS: debit", "zh-CN": "PIS：销项"},
  "PIS: crédito": {"en-US": "PIS: credit", "zh-CN": "PIS：进项抵扣"},
  "PIS: saldo": {"en-US": "PIS: net", "zh-CN": "PIS：净额"},
  "COFINS: débito": {"en-US": "COFINS: debit", "zh-CN": "COFINS：销项"},
  "COFINS: crédito": {"en-US": "COFINS: credit", "zh-CN": "COFINS：进项抵扣"},
  "COFINS: saldo": {"en-US": "COFINS: net", "zh-CN": "COFINS：净额"},
  "IPI: débito": {"en-US": "IPI: debit", "zh-CN": "IPI：销项"},
  "IPI: crédito": {"en-US": "IPI: credit", "zh-CN": "IPI：进项抵扣"},
  "IPI: saldo": {"en-US": "IPI: net", "zh-CN": "IPI：净额"},
  "ICMS-saída": {"en-US": "ICMS on sales", "zh-CN": "销售ICMS"},
  "Adicional IRPJ": {"en-US": "Additional IRPJ", "zh-CN": "附加IRPJ"},
  "Modelo de cálculo": {"en-US": "Calculation model", "zh-CN": "计算模型"},
  "Modelo anterior": {"en-US": "Previous model", "zh-CN": "原有模型"},
  "Modelo da planilha": {"en-US": "Spreadsheet model", "zh-CN": "电子表格模型"},
  "Base dos produtos": {"en-US": "Product price basis", "zh-CN": "产品价格基数"},
  "FOB · frete e seguro separados": {"en-US": "FOB · freight and insurance separate", "zh-CN": "FOB · 运费与保险另计"},
  "CIF · frete e seguro incluídos": {"en-US": "CIF · freight and insurance included", "zh-CN": "CIF · 已含运费和保险"},
  "Regra de venda": {"en-US": "Pricing rule", "zh-CN": "销售定价规则"},
  "Acréscimo sobre custo": {"en-US": "Markup on cost", "zh-CN": "成本加价"},
  "Margem sobre venda": {"en-US": "Margin on selling price", "zh-CN": "销售利润率"},
  "Acréscimo sobre custo (%)": {"en-US": "Markup on cost (%)", "zh-CN": "成本加价率（%）"},
  "Margem sobre venda (%)": {"en-US": "Margin on selling price (%)", "zh-CN": "销售利润率（%）"},
  "CIF dos produtos": {"en-US": "Product CIF value", "zh-CN": "产品CIF金额"},
  "Revise os alertas da estimativa antes de aprovar.": {"en-US": "Review calculation alerts before approval.", "zh-CN": "批准前请检查估算提示。"},
  "Revise a margem e as bases de rateio.": {"en-US": "Review the margin and allocation bases.", "zh-CN": "请检查利润率和费用分摊基数。"},
  "Tipo de despesa": {"en-US": "Expense type", "zh-CN": "费用类型"},
  "Outras despesas": {"en-US": "Other expenses", "zh-CN": "其他费用"},
  "Despesa / tipo": {"en-US": "Expense / type", "zh-CN": "费用及类型"},
  "Por valor dos produtos": {"en-US": "By product value", "zh-CN": "按产品金额"},
  "Igual por item": {"en-US": "Equal per item", "zh-CN": "按产品平均分摊"},
  "Importar premissas do fechamento": {"en-US": "Import closing assumptions", "zh-CN": "导入结算参数"},
  "Somente produtos": {"en-US": "Products only", "zh-CN": "仅产品"},
  "Produtos e premissas do fechamento": {"en-US": "Products and closing assumptions", "zh-CN": "产品及结算参数"},
  "As premissas só podem ser aplicadas em uma operação vazia e ainda não aprovada.": {"en-US": "Assumptions can only be applied to empty, unapproved operations.", "zh-CN": "参数仅适用于没有产品且尚未批准的业务。"},
  "Informe um câmbio positivo para concluir o cálculo.": {"en-US": "Enter a positive exchange rate to complete calculations.", "zh-CN": "请输入正汇率以完成计算。"},
  "Preencha quantidade e preço positivos em todos os produtos.": {"en-US": "Enter positive quantities and prices for every product.", "zh-CN": "请为所有产品填写正数数量和价格。"},
  "A planilha contém valores CIF. Selecione a base CIF antes de concluir o orçamento.": {"en-US": "The spreadsheet contains CIF values. Select CIF before completing the estimate.", "zh-CN": "表格包含CIF价格。完成预算前请选择CIF基数。"},
  "Preencha o peso líquido total de todos os produtos para completar o rateio por peso.": {"en-US": "Enter every product’s total net weight to complete weight allocation.", "zh-CN": "请填写所有产品的总净重以完成按重量分摊。"},
  "Preencha o volume dos produtos para completar o rateio por volume.": {"en-US": "Enter product volumes to complete volume allocation.", "zh-CN": "请填写产品体积以完成按体积分摊。"},
  "Adicione produtos para distribuir as despesas.": {"en-US": "Add products to allocate expenses.", "zh-CN": "添加产品以分摊费用。"},
  "Frete e seguro classificados como internacionais já estão no CIF e foram excluídos das despesas somadas.": {"en-US": "International freight and insurance are included in CIF and excluded from additional expenses.", "zh-CN": "CIF已含国际运费及保险，因此不再计入额外费用。"},
  "Há despesas sem rateio completo; os valores por item ainda não fecham com o total da operação.": {"en-US": "Some expenses remain unallocated; item values do not yet reconcile with the operation total.", "zh-CN": "部分费用尚未完成分摊，单项金额与业务总额尚不一致。"},
  "Informe uma margem válida para calcular os valores de venda e saída.": {"en-US": "Enter a valid margin to calculate sales and output taxes.", "zh-CN": "请输入有效利润率以计算销售金额及销项税。"},
  "Base dos produtos + despesas + tributos de entrada. Não inclui acréscimo de venda nem tributos de saída.": {"en-US": "Product basis + expenses + import taxes. Excludes sales markup and output taxes.", "zh-CN": "产品基数加费用加进口税。不包含销售加价及销项税。"},
  "Modelo operacional da empresa. ICMS de entrada não calculado; Siscomex e AFRMM são despesas em reais. Revise o enquadramento tributário com o contador.": {"en-US": "Company operating model. Import ICMS is not calculated; Siscomex and AFRMM are monetary expenses in BRL. Review tax treatment with your accountant.", "zh-CN": "企业运营模型。不计算进口ICMS；Siscomex及AFRMM为雷亚尔费用。请与会计核实税务适用规则。"},
  "PIS, COFINS e IPI de saída descontam os créditos de entrada. Saldos negativos representam créditos no modelo da planilha.": {"en-US": "Output PIS, COFINS and IPI deduct import credits. Negative balances represent credits in the spreadsheet model.", "zh-CN": "销项PIS、COFINS及IPI扣除进项抵扣。表格模型中的负余额表示抵扣余额。"},
  "CSLL, IRPJ e adicional são estimativas sobre o acréscimo, conforme a planilha da empresa. Confirme o enquadramento com o contador.": {"en-US": "CSLL, IRPJ and additional IRPJ are estimated on the markup, as in the company spreadsheet. Confirm applicability with your accountant.", "zh-CN": "按照企业表格，CSLL、IRPJ及附加税基于加价估算。请与会计确认适用规则。"},
  "Os valores USD da aba são totais por produto e foram convertidos para preços unitários.": {"en-US": "USD values are totals per product and were converted into unit prices.", "zh-CN": "表中的美元金额为各产品总额，已换算为单价。"},
  "Os valores dos produtos incluem frete (CIF). Revise as premissas antes de aplicar.": {"en-US": "Product values include freight (CIF). Review assumptions before applying.", "zh-CN": "产品价格包含运费（CIF）。应用前请检查参数。"},
  "As alíquotas e fórmulas foram trazidas da planilha da empresa; revise o adicional de IRPJ com o contador.": {"en-US": "Rates and formulas were imported from the company spreadsheet; review additional IRPJ with your accountant.", "zh-CN": "税率及公式源自企业表格；请与会计核实附加IRPJ。"},
  "Base dos produtos (FOB/CIF)": {"en-US": "Product basis (FOB/CIF)", "zh-CN": "产品基数（FOB/CIF）"},
  "Referência automática": { "en-US": "Automatic reference", "zh-CN": "自动编号" },
  "ACESSO OPERACIONAL": { "en-US": "OPERATIONAL ACCESS", "zh-CN": "运营访问" },
  "Boas-vindas.": { "en-US": "Welcome.", "zh-CN": "欢迎。" },
  "Entre para acompanhar suas operações, custos e decisões portuárias.": { "en-US": "Sign in to track your operations, costs, and port decisions.", "zh-CN": "登录以跟踪您的业务、成本和港口决策。" },
  "E-mail": { "en-US": "Email", "zh-CN": "电子邮件" }, "Senha": { "en-US": "Password", "zh-CN": "密码" },
  "Entrar no sistema": { "en-US": "Sign in", "zh-CN": "登录系统" }, "Entrando...": { "en-US": "Signing in...", "zh-CN": "正在登录..." },
  "Use as credenciais recebidas do administrador.": { "en-US": "Use the credentials provided by your administrator.", "zh-CN": "请使用管理员提供的凭据。" },
  "PRIMEIRO ACESSO": { "en-US": "FIRST ACCESS", "zh-CN": "首次访问" }, "Defina sua senha.": { "en-US": "Set your password.", "zh-CN": "设置您的密码。" },
  "Escolha uma senha pessoal para concluir a ativação da sua conta.": { "en-US": "Choose a personal password to complete your account activation.", "zh-CN": "选择个人密码以完成帐户激活。" },
  "Nova senha": { "en-US": "New password", "zh-CN": "新密码" }, "Confirme a senha": { "en-US": "Confirm password", "zh-CN": "确认密码" },
  "Concluir acesso": { "en-US": "Complete access", "zh-CN": "完成访问" }, "Concluindo...": { "en-US": "Completing...", "zh-CN": "正在完成..." },
  "Ocultar senha": { "en-US": "Hide password", "zh-CN": "隐藏密码" }, "Mostrar senha": { "en-US": "Show password", "zh-CN": "显示密码" }, "Sua senha": { "en-US": "Your password", "zh-CN": "您的密码" },
  "GESTÃO DE IMPORTAÇÕES": { "en-US": "IMPORT MANAGEMENT", "zh-CN": "进口管理" }, "Operações": { "en-US": "Operations", "zh-CN": "业务" },
  "Encontre uma operação, filtre a fila e abra um processo para trabalhar nos detalhes.": { "en-US": "Find an operation, filter the queue, and open a process to work on its details.", "zh-CN": "查找业务、筛选队列并打开业务处理详细信息。" },
  "Nova importação": { "en-US": "New import", "zh-CN": "新建进口" }, "Buscar por referência, cliente ou porto": { "en-US": "Search by reference, customer, or port", "zh-CN": "按参考号、客户或港口搜索" },
  "Buscar operações": { "en-US": "Search operations", "zh-CN": "搜索业务" }, "Todos os status": { "en-US": "All statuses", "zh-CN": "所有状态" }, "Todos os canais": { "en-US": "All channels", "zh-CN": "所有通道" },
  "Ordenação": { "en-US": "Sorting", "zh-CN": "排序" }, "Mais antigas primeiro": { "en-US": "Oldest first", "zh-CN": "最早优先" }, "Mais recentes primeiro": { "en-US": "Newest first", "zh-CN": "最新优先" }, "Atualizadas recentemente": { "en-US": "Recently updated", "zh-CN": "最近更新" },
  "Limpar filtros": { "en-US": "Clear filters", "zh-CN": "清除筛选" }, "Referência": { "en-US": "Reference", "zh-CN": "参考号" }, "Cliente": { "en-US": "Customer", "zh-CN": "客户" }, "Destino": { "en-US": "Destination", "zh-CN": "目的地" }, "Status": { "en-US": "Status", "zh-CN": "状态" }, "Canal": { "en-US": "Channel", "zh-CN": "通道" }, "Criada em": { "en-US": "Created on", "zh-CN": "创建日期" }, "Ações": { "en-US": "Actions", "zh-CN": "操作" },
  "Nenhuma operação corresponde aos filtros.": { "en-US": "No operations match the filters.", "zh-CN": "没有业务符合筛选条件。" }, "Nenhuma operação": { "en-US": "No operations", "zh-CN": "没有业务" },
  "Ver detalhes": { "en-US": "View details", "zh-CN": "查看详情" }, "Página anterior": { "en-US": "Previous page", "zh-CN": "上一页" }, "Próxima página": { "en-US": "Next page", "zh-CN": "下一页" },
  "Todas as operações": { "en-US": "All operations", "zh-CN": "所有业务" }, "DETALHE DA OPERAÇÃO": { "en-US": "OPERATION DETAILS", "zh-CN": "业务详情" },
  "Exportar XLSX": { "en-US": "Export XLSX", "zh-CN": "导出 XLSX" }, "Exportar PDF": { "en-US": "Export PDF", "zh-CN": "导出 PDF" }, "Gerando XLSX…": { "en-US": "Creating XLSX…", "zh-CN": "正在生成 XLSX…" }, "Gerando PDF…": { "en-US": "Creating PDF…", "zh-CN": "正在生成 PDF…" },
  "Custo total projetado": { "en-US": "Projected total cost", "zh-CN": "预计总成本" }, "estimativa atual da operação": { "en-US": "current operation estimate", "zh-CN": "当前业务估算" }, "Pendências abertas": { "en-US": "Open tasks", "zh-CN": "未完成事项" }, "tarefas para concluir": { "en-US": "tasks to complete", "zh-CN": "待完成任务" },
  "Documentos": { "en-US": "Documents", "zh-CN": "文件" }, "disponíveis": { "en-US": "available", "zh-CN": "可用" }, "Pendências": { "en-US": "Tasks", "zh-CN": "待办事项" }, "Controle de responsáveis e prazos.": { "en-US": "Track owners and due dates.", "zh-CN": "跟踪负责人和截止日期。" }, "Nova pendência": { "en-US": "New task", "zh-CN": "新建待办" },
  "Registrar documento": { "en-US": "Register document", "zh-CN": "登记文件" }, "Referências, validade e disponibilidade da documentação do processo.": { "en-US": "References, validity, and availability of process documents.", "zh-CN": "业务文件的参考信息、有效期和可用性。" },
  "Produtos da importação": { "en-US": "Import products", "zh-CN": "进口产品" }, "O custo unitário já inclui rateio e tributos.": { "en-US": "Unit cost already includes allocation and taxes.", "zh-CN": "单位成本已包含分摊和税费。" }, "Adicionar item": { "en-US": "Add item", "zh-CN": "添加项目" },
  "Linha do tempo": { "en-US": "Timeline", "zh-CN": "时间线" }, "Marcos e atualizações registrados na operação.": { "en-US": "Milestones and updates recorded in the operation.", "zh-CN": "业务中记录的里程碑和更新。" }, "Registrar marco": { "en-US": "Record milestone", "zh-CN": "记录里程碑" },
  "Responsável": { "en-US": "Owner", "zh-CN": "负责人" }, "Sem responsável": { "en-US": "Unassigned", "zh-CN": "未分配" }, "Pessoa responsável pelo acompanhamento desta importação.": { "en-US": "Person responsible for monitoring this import.", "zh-CN": "负责跟进此进口业务的人员。" }, "Atribua uma pessoa para acompanhar esta importação.": { "en-US": "Assign someone to monitor this import.", "zh-CN": "分配人员跟进此进口业务。" },
  "Status da operação": { "en-US": "Operation status", "zh-CN": "业务状态" }, "Status portuário": { "en-US": "Port status", "zh-CN": "港口状态" }, "Canal aduaneiro": { "en-US": "Customs channel", "zh-CN": "海关通道" }, "Atualização manual": { "en-US": "Manual update", "zh-CN": "手动更新" },
  "Documento": { "en-US": "Document", "zh-CN": "文件" }, "Emissão": { "en-US": "Issue date", "zh-CN": "签发日期" }, "Validade": { "en-US": "Validity", "zh-CN": "有效期" }, "Situação": { "en-US": "Situation", "zh-CN": "状态" }, "Disponível": { "en-US": "Available", "zh-CN": "可用" }, "Vencido": { "en-US": "Expired", "zh-CN": "已过期" }, "Pendente": { "en-US": "Pending", "zh-CN": "待处理" },
  "CADASTRO E RELACIONAMENTO": { "en-US": "CUSTOMERS", "zh-CN": "客户管理" }, "Clientes": { "en-US": "Customers", "zh-CN": "客户" }, "Empresas vinculadas às operações de importação.": { "en-US": "Companies linked to import operations.", "zh-CN": "与进口业务关联的公司。" }, "Novo cliente": { "en-US": "New customer", "zh-CN": "新建客户" }, "Buscar por empresa ou CNPJ": { "en-US": "Search by company or CNPJ", "zh-CN": "按公司或 CNPJ 搜索" }, "Buscar clientes": { "en-US": "Search customers", "zh-CN": "搜索客户" }, "Todos": { "en-US": "All", "zh-CN": "全部" }, "Ativos": { "en-US": "Active", "zh-CN": "活跃" }, "Inativos": { "en-US": "Inactive", "zh-CN": "停用" }, "Ordenar": { "en-US": "Sort", "zh-CN": "排序" }, "Mais operações": { "en-US": "Most operations", "zh-CN": "业务最多" }, "Nome da empresa": { "en-US": "Company name", "zh-CN": "公司名称" }, "Cadastro mais recente": { "en-US": "Most recently registered", "zh-CN": "最近注册" }, "Empresa": { "en-US": "Company", "zh-CN": "公司" }, "Contato": { "en-US": "Contact", "zh-CN": "联系人" }, "Nenhum cliente encontrado.": { "en-US": "No customers found.", "zh-CN": "未找到客户。" }, "Ativo": { "en-US": "Active", "zh-CN": "活跃" }, "Inativo": { "en-US": "Inactive", "zh-CN": "停用" },
  "Dados principais": { "en-US": "Main details", "zh-CN": "主要信息" }, "Endereço": { "en-US": "Address", "zh-CN": "地址" }, "Nome completo": { "en-US": "Full name", "zh-CN": "全名" }, "Razão social": { "en-US": "Legal name", "zh-CN": "法定名称" }, "Nome fantasia": { "en-US": "Trading name", "zh-CN": "商号" }, "Situação cadastral": { "en-US": "Registration status", "zh-CN": "注册状态" }, "Número": { "en-US": "Number", "zh-CN": "门牌号" }, "Logradouro": { "en-US": "Street", "zh-CN": "街道" }, "Complemento": { "en-US": "Additional address info", "zh-CN": "补充地址" }, "Bairro": { "en-US": "District", "zh-CN": "街区" }, "Cidade": { "en-US": "City", "zh-CN": "城市" }, "Telefone": { "en-US": "Phone", "zh-CN": "电话" }, "Anterior": { "en-US": "Back", "zh-CN": "上一步" }, "Continuar": { "en-US": "Continue", "zh-CN": "继续" }, "Salvar cliente": { "en-US": "Save customer", "zh-CN": "保存客户" }, "Salvar alterações": { "en-US": "Save changes", "zh-CN": "保存更改" },
  "ADMINISTRAÇÃO DE ACESSOS": { "en-US": "ACCESS ADMINISTRATION", "zh-CN": "访问管理" }, "Usuários": { "en-US": "Users", "zh-CN": "用户" }, "Usuários cadastrados": { "en-US": "Registered users", "zh-CN": "已注册用户" }, "Novo usuário": { "en-US": "New user", "zh-CN": "新建用户" }, "Perfil": { "en-US": "Role", "zh-CN": "角色" }, "Cadastro": { "en-US": "Registration", "zh-CN": "注册" }, "Acesso": { "en-US": "Access", "zh-CN": "访问" }, "Administrador": { "en-US": "Administrator", "zh-CN": "管理员" }, "Operador": { "en-US": "Operator", "zh-CN": "操作员" }, "Primeiro acesso": { "en-US": "First access", "zh-CN": "首次访问" }, "Nome da pessoa": { "en-US": "Person's name", "zh-CN": "姓名" }, "E-mail corporativo": { "en-US": "Business email", "zh-CN": "企业邮箱" }, "Senha inicial": { "en-US": "Initial password", "zh-CN": "初始密码" }, "Cadastrar usuário": { "en-US": "Create user", "zh-CN": "创建用户" },
  "CONTA PESSOAL": { "en-US": "PERSONAL ACCOUNT", "zh-CN": "个人账户" }, "Meu perfil": { "en-US": "My profile", "zh-CN": "我的资料" }, "Alterar foto": { "en-US": "Change photo", "zh-CN": "更换照片" }, "Cargo ou área": { "en-US": "Job title or area", "zh-CN": "职位或部门" }, "Salvar perfil": { "en-US": "Save profile", "zh-CN": "保存资料" }, "Salvando…": { "en-US": "Saving…", "zh-CN": "正在保存…" },
  "Selecionar cliente": { "en-US": "Select customer", "zh-CN": "选择客户" }, "Editar cliente": { "en-US": "Edit customer", "zh-CN": "编辑客户" }, "Editar produto": { "en-US": "Edit product", "zh-CN": "编辑产品" }, "Adicionar produto": { "en-US": "Add product", "zh-CN": "添加产品" }, "Remover produto": { "en-US": "Remove product", "zh-CN": "移除产品" }, "Cancelar": { "en-US": "Cancel", "zh-CN": "取消" }, "Fechar": { "en-US": "Close", "zh-CN": "关闭" }, "Voltar": { "en-US": "Back", "zh-CN": "返回" }, "Criar importação": { "en-US": "Create import", "zh-CN": "创建进口业务" }, "Fornecedor": { "en-US": "Supplier", "zh-CN": "供应商" }, "Porto de destino": { "en-US": "Destination port", "zh-CN": "目的港" }, "Contêiner": { "en-US": "Container", "zh-CN": "集装箱" },
  "Marco": { "en-US": "Milestone", "zh-CN": "里程碑" }, "Data e hora": { "en-US": "Date and time", "zh-CN": "日期和时间" }, "Tipo": { "en-US": "Type", "zh-CN": "类型" }, "Detalhes": { "en-US": "Details", "zh-CN": "详情" }, "Criar pendência": { "en-US": "Create task", "zh-CN": "创建待办" }, "Prazo": { "en-US": "Due date", "zh-CN": "截止日期" }, "Produto": { "en-US": "Product", "zh-CN": "产品" }, "Quantidade": { "en-US": "Quantity", "zh-CN": "数量" }, "Custo total": { "en-US": "Total cost", "zh-CN": "总成本" },
  "Navegação principal": { "en-US": "Main navigation", "zh-CN": "主导航" }, "Navegação móvel": { "en-US": "Mobile navigation", "zh-CN": "移动导航" }, "Abrir menu": { "en-US": "Open menu", "zh-CN": "打开菜单" }, "Fechar menu": { "en-US": "Close menu", "zh-CN": "关闭菜单" }, "Caminho de navegação": { "en-US": "Breadcrumb", "zh-CN": "面包屑导航" },
  "Sem canal": { "en-US": "No channel", "zh-CN": "未分配通道" }, "Sem prazo": { "en-US": "No due date", "zh-CN": "无截止日期" }, "Sistema": { "en-US": "System", "zh-CN": "系统" }, "Hoje": { "en-US": "Today", "zh-CN": "今天" }, "Módulo": { "en-US": "Module", "zh-CN": "模块" }, "PRÓXIMA FRENTE": { "en-US": "NEXT AREA", "zh-CN": "下一模块" }, "Abrir operações": { "en-US": "Open operations", "zh-CN": "打开业务" }
};

export function localizeUiText(locale: Locale, source: string) {
  if (locale === "pt-BR") return source;
  const direct = uiText[source]?.[locale];
  if (direct) return direct;
  const page = source.match(/^Página (\d+) de (\d+)$/);
  if (page) return locale === "en-US" ? `Page ${page[1]} of ${page[2]}` : `第 ${page[1]} 页，共 ${page[2]} 页`;
  const edit = source.match(/^Editar (.+)$/);
  if (edit) return locale === "en-US" ? `Edit ${edit[1]}` : `编辑 ${edit[1]}`;
  return source;
}

Object.assign(uiText, {
  "Início": { "en-US": "Home", "zh-CN": "首页" }, "Portos": { "en-US": "Ports", "zh-CN": "港口" }, "Relatórios": { "en-US": "Reports", "zh-CN": "报告" }, "Sair": { "en-US": "Sign out", "zh-CN": "退出" }, "Buscar": { "en-US": "Search", "zh-CN": "搜索" }, "Notificações": { "en-US": "Notifications", "zh-CN": "通知" }, "Ajuda": { "en-US": "Help", "zh-CN": "帮助" },
  "CENTRO DE CONTROLE": { "en-US": "CONTROL CENTER", "zh-CN": "控制中心" }, "Operações sob controle.": { "en-US": "Operations under control.", "zh-CN": "进口业务尽在掌控。" }, "Acompanhe custos, cargas e decisões que pedem atenção.": { "en-US": "Track costs, cargo, and decisions that need attention.", "zh-CN": "跟踪成本、货物和需要关注的决策。" }, "Ver operações": { "en-US": "View operations", "zh-CN": "查看业务" },
  "Importações ativas": { "en-US": "Active imports", "zh-CN": "进行中的进口" }, "processos em andamento": { "en-US": "ongoing processes", "zh-CN": "进行中的业务" }, "Cargas em porto": { "en-US": "Cargo at port", "zh-CN": "港口货物" }, "com atualização necessária": { "en-US": "requiring an update", "zh-CN": "需要更新" }, "Custo projetado": { "en-US": "Projected cost", "zh-CN": "预计成本" }, "nas operações abertas": { "en-US": "across open operations", "zh-CN": "所有未结业务" },
  "Farol aduaneiro": { "en-US": "Customs signal", "zh-CN": "海关信号灯" }, "Operações por canal de conferência. A cor é sempre acompanhada pelo nome e pela etapa aplicável.": { "en-US": "Operations by inspection channel. Each color is paired with its name and applicable stage.", "zh-CN": "按查验通道查看业务。每种颜色均配有名称和适用阶段。" }, "Canal ainda não informado": { "en-US": "Customs channel not provided", "zh-CN": "尚未提供海关通道" },
  "Últimas notícias": { "en-US": "Latest news", "zh-CN": "最新资讯" }, "Fontes oficiais de comércio exterior, regulação e portos.": { "en-US": "Official sources for trade, regulation, and ports.", "zh-CN": "来自贸易、监管和港口的官方资讯。" }, "Atualizado": { "en-US": "Updated", "zh-CN": "更新于" }, "Ler notícia": { "en-US": "Read article", "zh-CN": "阅读资讯" }, "Abrir Siscomex": { "en-US": "Open Siscomex", "zh-CN": "打开 Siscomex" },
  "Operações recentes": { "en-US": "Recent operations", "zh-CN": "最近业务" }, "Os processos que exigem acompanhamento.": { "en-US": "Processes that need follow-up.", "zh-CN": "需要跟进的业务。" }, "Próxima decisão": { "en-US": "Next decision", "zh-CN": "下一项决策" }, "Contexto operacional atual": { "en-US": "Current operating context", "zh-CN": "当前运营信息" }, "venda": { "en-US": "sell", "zh-CN": "卖出价" }, "Dados operacionais indisponíveis": { "en-US": "Operational data unavailable", "zh-CN": "运营数据暂不可用" }, "Atualizando dados operacionais": { "en-US": "Updating operational data", "zh-CN": "正在更新运营数据" }, "Atualização recente": { "en-US": "Recent update", "zh-CN": "最近更新" },
  "Canal verde": { "en-US": "Green channel", "zh-CN": "绿色通道" }, "Canal amarelo": { "en-US": "Yellow channel", "zh-CN": "黄色通道" }, "Canal vermelho": { "en-US": "Red channel", "zh-CN": "红色通道" }, "Canal cinza": { "en-US": "Gray channel", "zh-CN": "灰色通道" }, "Desembaraço automático": { "en-US": "Automatic clearance", "zh-CN": "自动放行" }, "Exame documental": { "en-US": "Document inspection", "zh-CN": "文件查验" }, "Exame documental e físico": { "en-US": "Document and physical inspection", "zh-CN": "文件与实物查验" }, "Apuração de indícios de fraude": { "en-US": "Fraud investigation", "zh-CN": "欺诈迹象核查" }
});

Object.assign(uiText, {
  "Idioma": { "en-US": "Language", "zh-CN": "语言" }, "Português": { "en-US": "Portuguese", "zh-CN": "葡萄牙语" }, "Responsável pela importação": { "en-US": "Import owner", "zh-CN": "进口负责人" },
  "0 disponíveis": { "en-US": "0 available", "zh-CN": "0 个可用" }, "Registre os documentos recebidos para acompanhar validade e disponibilidade.": { "en-US": "Register received documents to track their validity and availability.", "zh-CN": "登记收到的文件以跟踪其有效期和可用性。" },
  "Produto / NCM": { "en-US": "Product / NCM", "zh-CN": "产品 / NCM" }, "Qtd.": { "en-US": "Qty.", "zh-CN": "数量" }, "Rateio": { "en-US": "Allocation", "zh-CN": "分摊" }, "Tributos": { "en-US": "Taxes", "zh-CN": "税费" }, "Custo unitário": { "en-US": "Unit cost", "zh-CN": "单位成本" },
  "Valores e rateio": { "en-US": "Values and allocation", "zh-CN": "金额与分摊" }, "Os custos logísticos são distribuídos proporcionalmente ao FOB de cada item.": { "en-US": "Logistics costs are allocated proportionally to each item's FOB value.", "zh-CN": "物流成本按每项 FOB 价值比例分摊。" }, "Câmbio (R$/US$)": { "en-US": "Exchange rate (BRL/USD)", "zh-CN": "汇率（BRL/USD）" }, "Frete internacional": { "en-US": "International freight", "zh-CN": "国际运费" }, "Seguro": { "en-US": "Insurance", "zh-CN": "保险" }, "Despesas portuárias": { "en-US": "Port expenses", "zh-CN": "港口费用" }, "Base FOB": { "en-US": "FOB base", "zh-CN": "FOB 基础" }, "Custos rateados": { "en-US": "Allocated costs", "zh-CN": "已分摊成本" }, "Total projetado": { "en-US": "Projected total", "zh-CN": "预计总额" }, "estimativa atual": { "en-US": "current estimate", "zh-CN": "当前估算" },
  "Rascunho": { "en-US": "Draft", "zh-CN": "草稿" }, "Em cotação": { "en-US": "Quoting", "zh-CN": "询价中" }, "Em trânsito": { "en-US": "In transit", "zh-CN": "运输中" }, "No porto": { "en-US": "At port", "zh-CN": "在港" }, "Em desembaraço": { "en-US": "In customs clearance", "zh-CN": "清关中" }, "Liberada": { "en-US": "Released", "zh-CN": "已放行" }, "Concluída": { "en-US": "Completed", "zh-CN": "已完成" },
  "Aguardando embarque": { "en-US": "Awaiting shipment", "zh-CN": "等待装运" }, "Em trânsito marítimo": { "en-US": "In ocean transit", "zh-CN": "海运途中" }, "Aguardando atracação": { "en-US": "Awaiting berth", "zh-CN": "等待靠泊" }, "Em descarga": { "en-US": "Unloading", "zh-CN": "卸货中" }, "Em desembaraço aduaneiro": { "en-US": "In customs clearance", "zh-CN": "海关清关中" }, "Carga liberada": { "en-US": "Cargo released", "zh-CN": "货物已放行" },
  "Responsável atribuído": { "en-US": "Owner assigned", "zh-CN": "已分配负责人" }, "Responsável removido": { "en-US": "Owner removed", "zh-CN": "已移除负责人" }, "Operação criada": { "en-US": "Operation created", "zh-CN": "业务已创建" }, "Processo aberto para acompanhamento operacional.": { "en-US": "Process opened for operational monitoring.", "zh-CN": "业务已开通以进行运营跟踪。" }, "Processo sob análise da alfândega": { "en-US": "Process under customs review", "zh-CN": "业务正在接受海关审核" }, "Registrado por": { "en-US": "Recorded by", "zh-CN": "记录人" },
  "Revisar documentação da operação": { "en-US": "Review operation documents", "zh-CN": "审核业务文件" }, "Operação": { "en-US": "Operation", "zh-CN": "业务" }, "Concluir": { "en-US": "Complete", "zh-CN": "完成" }, "Reabrir": { "en-US": "Reopen", "zh-CN": "重新打开" }, "Remover": { "en-US": "Remove", "zh-CN": "移除" }
});

Object.assign(uiText, {
  "Importar produtos por planilha": { "en-US": "Import products from spreadsheet", "zh-CN": "通过表格导入产品" },
  "Produtos por planilha": { "en-US": "Products from spreadsheet", "zh-CN": "通过表格导入产品" },
  "Envie XLSX, XLS ou CSV. As colunas Produto e Quantidade são obrigatórias; NCM, valores em USD, peso, II e IPI são opcionais.": { "en-US": "Upload XLSX, XLS, or CSV. Product and Quantity are required; NCM, USD values, weight, import duty, and IPI are optional.", "zh-CN": "上传 XLSX、XLS 或 CSV。产品和数量为必填项；NCM、美元金额、重量、进口税和 IPI 为选填项。" },
  "Selecionar planilha": { "en-US": "Select spreadsheet", "zh-CN": "选择表格" },
  "Lendo planilha…": { "en-US": "Reading spreadsheet…", "zh-CN": "正在读取表格…" },
  "produto(s) encontrados": { "en-US": "product(s) found", "zh-CN": "找到的产品" },
  "Mostrando os primeiros 5 itens da planilha.": { "en-US": "Showing the first 5 items from the spreadsheet.", "zh-CN": "显示表格中的前 5 个项目。" },
  "Importar planilha": { "en-US": "Import spreadsheet", "zh-CN": "导入表格" },
  "Incluir": { "en-US": "Add", "zh-CN": "添加" },
  "produto": { "en-US": "product", "zh-CN": "产品" },
  "produtos": { "en-US": "products", "zh-CN": "产品" },
  "linha(s) sem quantidade válida foram ignoradas.": { "en-US": "row(s) without a valid quantity were ignored.", "zh-CN": "没有有效数量的行已被忽略。" },
  "Não foi possível ler a planilha.": { "en-US": "Could not read the spreadsheet.", "zh-CN": "无法读取表格。" }
});


Object.assign(uiText, {
  "INTELIGÊNCIA OPERACIONAL": { "en-US": "OPERATIONAL INTELLIGENCE", "zh-CN": "运营智能" },
  "Transforme a carteira de importações em decisões de custo, risco e prioridade.": { "en-US": "Turn your import portfolio into cost, risk, and priority decisions.", "zh-CN": "将进口业务组合转化为成本、风险和优先级决策。" },
  "Visão executiva": { "en-US": "Executive overview", "zh-CN": "管理层概览" }, "Custo, volume, risco e prioridades no mesmo recorte.": { "en-US": "Cost, volume, risk, and priorities in one view.", "zh-CN": "在同一视图中查看成本、数量、风险和优先事项。" },
  "Operação e riscos": { "en-US": "Operations and risks", "zh-CN": "业务与风险" }, "ETA, canais, pendências e pontos que pedem ação.": { "en-US": "ETA, channels, tasks, and items requiring action.", "zh-CN": "预计到港日、通道、待办事项和需要处理的项目。" },
  "Custos e fechamento": { "en-US": "Costs and closing", "zh-CN": "成本与结算" }, "Composição projetada e concentração por NCM.": { "en-US": "Projected composition and concentration by NCM.", "zh-CN": "按 NCM 查看预计构成和集中度。" },
  "Clientes e portos": { "en-US": "Customers and ports", "zh-CN": "客户与港口" }, "Concentração por cliente e porto.": { "en-US": "Concentration by customer and port.", "zh-CN": "按客户和港口查看集中度。" },
  "Documentos e pendências": { "en-US": "Documents and tasks", "zh-CN": "文件与待办事项" }, "Conformidade operacional por processo.": { "en-US": "Operational compliance by process.", "zh-CN": "按流程查看运营合规性。" },
  "Mercado e benchmark": { "en-US": "Market and benchmark", "zh-CN": "市场与基准" }, "Câmbio, referências oficiais e categorias acompanhadas.": { "en-US": "Exchange rates, official references, and tracked categories.", "zh-CN": "汇率、官方参考和跟踪的类别。" },
  "Recorte do relatório": { "en-US": "Report scope", "zh-CN": "报告范围" }, "Período e filtros ficam registrados na URL para compartilhar a mesma análise.": { "en-US": "The period and filters remain in the URL so this analysis can be shared.", "zh-CN": "期间和筛选条件保留在 URL 中，以便共享同一分析。" },
  "De": { "en-US": "From", "zh-CN": "从" }, "Até": { "en-US": "To", "zh-CN": "至" }, "Todos os clientes": { "en-US": "All customers", "zh-CN": "所有客户" }, "Todos os portos": { "en-US": "All ports", "zh-CN": "所有港口" },
  "Custo projetado": { "en-US": "Projected cost", "zh-CN": "预计成本" }, "Risco de ETA": { "en-US": "ETA risk", "zh-CN": "预计到港日风险" }, "documentos pendentes": { "en-US": "pending documents", "zh-CN": "待处理文件" }, "Custo médio": { "en-US": "Average cost", "zh-CN": "平均成本" }, "kg estimados": { "en-US": "estimated kg", "zh-CN": "预计公斤" },
  "Composição de custo": { "en-US": "Cost composition", "zh-CN": "成本构成" }, "FOB, logística e tributos no valor projetado.": { "en-US": "FOB, logistics, and taxes in the projected amount.", "zh-CN": "预计金额中的 FOB、物流和税费。" }, "Carteira por etapa": { "en-US": "Portfolio by stage", "zh-CN": "按阶段查看业务组合" }, "Operações por status atual.": { "en-US": "Operations by current status.", "zh-CN": "按当前状态查看业务。" },
  "Prioridades operacionais": { "en-US": "Operational priorities", "zh-CN": "运营优先事项" }, "Itens que precisam de acompanhamento no recorte selecionado.": { "en-US": "Items requiring follow-up in the selected scope.", "zh-CN": "所选范围内需要跟进的项目。" }, "Prioridade": { "en-US": "Priority", "zh-CN": "优先级" }, "Motivo": { "en-US": "Reason", "zh-CN": "原因" }, "Abrir": { "en-US": "Open", "zh-CN": "打开" }, "Alta": { "en-US": "High", "zh-CN": "高" }, "Média": { "en-US": "Medium", "zh-CN": "中" }, "Baixa": { "en-US": "Low", "zh-CN": "低" },
  "Canal aduaneiro": { "en-US": "Customs channel", "zh-CN": "海关通道" }, "Distribuição atual por canal informado.": { "en-US": "Current distribution by registered channel.", "zh-CN": "按已登记通道的当前分布。" }, "Etapa da operação": { "en-US": "Operation stage", "zh-CN": "业务阶段" }, "Carteira operacional no período.": { "en-US": "Operational portfolio for the selected period.", "zh-CN": "所选期间的运营业务组合。" },
  "Valores estimados na carteira selecionada.": { "en-US": "Estimated values in the selected portfolio.", "zh-CN": "所选业务组合中的预计金额。" }, "NCMs com maior custo": { "en-US": "Highest-cost NCMs", "zh-CN": "成本最高的 NCM" }, "Concentração estimada por classificação fiscal.": { "en-US": "Estimated concentration by tax classification.", "zh-CN": "按税则分类查看预计集中度。" }, "Fornecedores": { "en-US": "Suppliers", "zh-CN": "供应商" }, "Custo projetado por cliente.": { "en-US": "Projected cost by customer.", "zh-CN": "按客户查看预计成本。" }, "Custo projetado por fornecedor.": { "en-US": "Projected cost by supplier.", "zh-CN": "按供应商查看预计成本。" }, "Custo projetado por porto de destino.": { "en-US": "Projected cost by destination port.", "zh-CN": "按目的港查看预计成本。" },
  "Conformidade do recorte": { "en-US": "Scope compliance", "zh-CN": "范围合规性" }, "Contexto externo": { "en-US": "External context", "zh-CN": "外部信息" }, "Câmbio e referências oficiais": { "en-US": "Exchange rate and official references", "zh-CN": "汇率与官方参考" }, "O benchmark por NCM será habilitado quando a base mensal do Comex Stat estiver sincronizada. Até lá, a comparação externa não é inferida.": { "en-US": "NCM benchmarking will be enabled once the monthly Comex Stat dataset is synchronized. Until then, no external comparison is inferred.", "zh-CN": "当 Comex Stat 月度数据同步后，将启用按 NCM 的基准比较。在此之前，系统不会推断外部比较。" }, "Cotação indisponível": { "en-US": "Quote unavailable", "zh-CN": "汇率不可用" }, "Abrir Comex Stat": { "en-US": "Open Comex Stat", "zh-CN": "打开 Comex Stat" }, "Estatístico ANTAQ": { "en-US": "ANTAQ statistics", "zh-CN": "ANTAQ 统计数据" }, "Categorias internas por NCM": { "en-US": "Internal categories by NCM", "zh-CN": "按 NCM 的内部类别" }, "Base para futura comparação com dados mensais do comércio exterior.": { "en-US": "Basis for a future comparison with monthly trade data.", "zh-CN": "为未来与月度外贸数据比较提供基础。" }, "Ainda não há dados para este recorte.": { "en-US": "There is no data for this scope yet.", "zh-CN": "此范围内尚无数据。" }, "Nenhuma prioridade encontrada neste recorte.": { "en-US": "No priorities were found in this scope.", "zh-CN": "此范围内未发现优先事项。" }, "Precisa aprofundar uma operação específica?": { "en-US": "Need to explore a specific operation?", "zh-CN": "需要深入查看某项业务吗？" }
});

const dynamicUiText = (locale: Exclude<Locale, "pt-BR">, source: string) => {
  const ownerAssigned = source.match(/^(.+) passou a acompanhar esta importação\.$/);
  if (ownerAssigned) return locale === "en-US" ? `${ownerAssigned[1]} started monitoring this import.` : `${ownerAssigned[1]} 开始跟进此进口业务。`;
  const remove = source.match(/^Remover (.+)$/);
  if (remove) return locale === "en-US" ? `Remove ${remove[1]}` : `移除 ${remove[1]}`;
  const complete = source.match(/^Concluir (.+)$/);
  if (complete) return locale === "en-US" ? `Complete ${complete[1]}` : `完成 ${complete[1]}`;
  const reopen = source.match(/^Reabrir (.+)$/);
  if (reopen) return locale === "en-US" ? `Reopen ${reopen[1]}` : `重新打开 ${reopen[1]}`;
  const available = source.match(/^(\d+) disponíveis$/);
  if (available) return locale === "en-US" ? `${available[1]} available` : `${available[1]} 个可用`;
  const foundProducts = source.match(/^(\d+) produto\(s\) encontrados$/);
  if (foundProducts) return locale === "en-US" ? `${foundProducts[1]} product(s) found` : `找到 ${foundProducts[1]} 个产品`;
  const importedProducts = source.match(/^Incluir (\d+) produto(s)?$/);
  if (importedProducts) return locale === "en-US" ? `Add ${importedProducts[1]} product${importedProducts[2] ? "s" : ""}` : `添加 ${importedProducts[1]} 个产品`;
  const invalidRows = source.match(/^(\d+) linha\(s\) sem quantidade válida foram ignoradas\.$/);
  if (invalidRows) return locale === "en-US" ? `${invalidRows[1]} row(s) without a valid quantity were ignored.` : `${invalidRows[1]} 个没有有效数量的行已被忽略。`;
  return source;
};

const baseLocalizeUiText = localizeUiText;
function uiSourceText(value: string) {
  if (uiText[value]) return value;
  for (const [source, translations] of Object.entries(uiText)) if (Object.values(translations).includes(value)) return source;
  return value;
}
export function translateUiText(locale: Locale, source: string) {
  const base = uiSourceText(source);
  const translated = baseLocalizeUiText(locale, base);
  return translated === base && locale !== "pt-BR" ? dynamicUiText(locale, base) : translated;
}

Object.assign(uiText, {
  "Porto a definir": { "en-US": "Port to be determined", "zh-CN": "港口待定" },
  "Selecionar porto": { "en-US": "Select port", "zh-CN": "选择港口" },
  "Definir porto": { "en-US": "Set port", "zh-CN": "设置港口" },
  "Alterar porto": { "en-US": "Change port", "zh-CN": "更改港口" },
  "Ainda não sei o porto": { "en-US": "Port not yet known", "zh-CN": "尚未确定港口" },
  "Pode ser definido depois nos detalhes da importação.": { "en-US": "You can set it later in the import details.", "zh-CN": "可稍后在进口详情中设置。" },
  "Definir depois nos detalhes da importação": { "en-US": "Set later in the import details", "zh-CN": "稍后在进口详情中设置" },
  "Buscar por porto, cidade ou estado": { "en-US": "Search by port, city or state", "zh-CN": "按港口、城市或州搜索" },
  "Buscar portos": { "en-US": "Search ports", "zh-CN": "搜索港口" },
  "Nenhum porto corresponde à busca.": { "en-US": "No ports match your search.", "zh-CN": "没有符合搜索条件的港口。" },
  "Porto de destino atualizado": { "en-US": "Destination port updated", "zh-CN": "目的港已更新" }
});

Object.assign(uiText, {
  "Paginação da linha do tempo": { "en-US": "Timeline pagination", "zh-CN": "时间线分页" },
  "Anterior": { "en-US": "Previous", "zh-CN": "上一页" },
  "Próxima": { "en-US": "Next", "zh-CN": "下一页" }
});

Object.assign(uiText, {
 "Extraindo os produtos e valores. Aguarde para continuar.": { "en-US": "Extracting products and prices. Please wait to continue.", "zh-CN": "正在提取产品和价格，请等待完成。" },
 "Dados da importação": { "en-US": "Import information", "zh-CN": "进口信息" }
});

Object.assign(uiText, {
 "Definir contêiner": { "en-US": "Set container", "zh-CN": "设置集装箱" },
 "Editar contêiner": { "en-US": "Edit container", "zh-CN": "编辑集装箱" },
 "Contêiner atualizado": { "en-US": "Container updated", "zh-CN": "集装箱已更新" },
 "Disponível após aprovação do orçamento.": { "en-US": "Available after budget approval.", "zh-CN": "预算批准后可用。" }
});

Object.assign(uiText, {
 "Salvar": { "en-US": "Save", "zh-CN": "保存" },
 "Não informado": { "en-US": "Not provided", "zh-CN": "未填写" }
});

Object.assign(uiText, {
 "Criando importação…": { "en-US": "Creating import…", "zh-CN": "正在创建进口业务…" },
 "Selecione um cliente.": { "en-US": "Select a customer.", "zh-CN": "请选择客户。" },
 "Não foi possível criar a importação. Tente novamente.": { "en-US": "Could not create the import. Please try again.", "zh-CN": "无法创建进口业务，请重试。" }
});

Object.assign(uiText, { "Sua sessão expirou. Entre novamente.": { "en-US": "Your session has expired. Please sign in again.", "zh-CN": "您的会话已过期，请重新登录。" } });

Object.assign(uiText, {
  "Traduzindo produtos…": { "en-US": "Translating products…", "zh-CN": "正在翻译产品…" },
  "Nome em chinês (original)": { "en-US": "Chinese name (original)", "zh-CN": "中文名称（原文）" }
});

Object.assign(uiText, {
  "Nome em português pendente": { "en-US": "Portuguese name pending", "zh-CN": "待填写葡萄牙语名称" },
  "Preencha o nome em português nos detalhes da importação.": { "en-US": "Enter the Portuguese name in the import details.", "zh-CN": "请在进口详情中填写葡萄牙语名称。" }
});

Object.assign(uiText, {
  "Buscar produtos": {
    "en-US": "Search products",
    "zh-CN": "搜索产品"
  },
  "Nome, SKU ou NCM": {
    "en-US": "Name, SKU or NCM",
    "zh-CN": "名称、SKU 或 NCM"
  },
  "Ordenar produtos": {
    "en-US": "Sort products",
    "zh-CN": "产品排序"
  },
  "Por página": {
    "en-US": "Per page",
    "zh-CN": "每页"
  },
  "Produtos por página": {
    "en-US": "Products per page",
    "zh-CN": "每页产品数"
  },
  "Ordem de cadastro": {
    "en-US": "Original order",
    "zh-CN": "原始顺序"
  },
  "Nome: A a Z": {
    "en-US": "Name: A to Z",
    "zh-CN": "名称：升序"
  },
  "Nome: Z a A": {
    "en-US": "Name: Z to A",
    "zh-CN": "名称：降序"
  },
  "Maior quantidade": {
    "en-US": "Quantity: highest first",
    "zh-CN": "数量：从高到低"
  },
  "Menor quantidade": {
    "en-US": "Quantity: lowest first",
    "zh-CN": "数量：从低到高"
  },
  "Maior FOB": {
    "en-US": "FOB: highest first",
    "zh-CN": "FOB：从高到低"
  },
  "Ex.: Conferir invoice antes do registro": { "en-US": "E.g.: Check invoice before registration", "zh-CN": "例如：登记前核对发票" },
  "Editar pendência": { "en-US": "Edit task", "zh-CN": "编辑待办" },
  "Todas as fases": { "en-US": "All phases", "zh-CN": "所有阶段" },
  "Fase": { "en-US": "Phase", "zh-CN": "阶段" },
  "Disponível após aprovação dos custos.": { "en-US": "Available after cost approval.", "zh-CN": "批准成本后可用。" },
  "Custos": { "en-US": "Costs", "zh-CN": "成本" },
  "Preenchimento": { "en-US": "Completeness", "zh-CN": "填写完整性" },
  "Preenchimento dos produtos": { "en-US": "Product completeness", "zh-CN": "产品填写完整性" },
  "Todos os produtos": { "en-US": "All products", "zh-CN": "所有产品" },
  "Dados incompletos": { "en-US": "Incomplete data", "zh-CN": "数据不完整" },
  "Dados completos": { "en-US": "Complete data", "zh-CN": "数据完整" },
  "com dados incompletos": { "en-US": "with incomplete data", "zh-CN": "项数据不完整" },
  "Faltam dados": { "en-US": "Missing data", "zh-CN": "缺少数据" },
  "Nome em português": { "en-US": "Portuguese name", "zh-CN": "葡萄牙语名称" },
  "NCM (8 dígitos)": { "en-US": "NCM (8 digits)", "zh-CN": "NCM（8位数字）" },
  "Peso para rateio": { "en-US": "Weight for allocation", "zh-CN": "分摊重量" },
  "Volume para rateio": { "en-US": "Volume for allocation", "zh-CN": "分摊体积" },
  "Volume total (m³)": { "en-US": "Total volume (m³)", "zh-CN": "总体积（立方米）" },
  "Preço sugerido": { "en-US": "Suggested price", "zh-CN": "建议售价" },
  "Margem sobre o preço de venda; não altera o custo da importação.": { "en-US": "Margin on selling price; does not change import costs.", "zh-CN": "以售价为基础的利润率，不改变进口成本。" },
  "Informe uma margem menor que 100%.": { "en-US": "Enter a margin below 100%.", "zh-CN": "请输入低于100%的利润率。" },
  "Aprovado": { "en-US": "Approved", "zh-CN": "已批准" },
  "Os custos foram aprovados. A operação está pronta para acompanhar o embarque.": { "en-US": "Costs approved. The operation is ready for shipment tracking.", "zh-CN": "成本已批准。业务已可跟踪装运。" },
  "Fase da importação": { "en-US": "Import phase", "zh-CN": "进口阶段" },
  "Custos da importação": { "en-US": "Import costs", "zh-CN": "进口成本" },
  "Custos aprovados": { "en-US": "Approved costs", "zh-CN": "已批准成本" },
  "Custos aprovados e realizados": { "en-US": "Approved and actual costs", "zh-CN": "已批准及实际成本" },
  "Despesas estimadas": { "en-US": "Estimated expenses", "zh-CN": "预计费用" },
  "Subtotal das despesas": { "en-US": "Expenses subtotal", "zh-CN": "费用小计" },
  "Preço sugerido de venda": { "en-US": "Suggested selling price", "zh-CN": "建议售价" },
  "Considera a margem desejada.": { "en-US": "Includes the desired margin.", "zh-CN": "包含期望利润率。" },
  "FOB + despesas + tributos. Não inclui margem de venda.": { "en-US": "FOB + expenses + taxes. Excludes the selling margin.", "zh-CN": "FOB + 费用 + 税费。不含销售利润。" },
  "Estimativa de custos": { "en-US": "Cost estimate", "zh-CN": "成本估算" },
  "Estimando custos": { "en-US": "Estimating costs", "zh-CN": "正在估算成本" },
  "Aguardando aprovação": { "en-US": "Awaiting approval", "zh-CN": "等待批准" },
  "Aprovar Custos": { "en-US": "Approve costs", "zh-CN": "批准成本" },
  "Aprovado por": { "en-US": "Approved by", "zh-CN": "批准人" },
  "Usuário não registrado": { "en-US": "User not recorded", "zh-CN": "未记录用户" },
  "Data não registrada": { "en-US": "Date not recorded", "zh-CN": "未记录日期" },
  "Aprovado em": { "en-US": "Approved on", "zh-CN": "批准日期" },
  "Adicione produtos antes de aprovar os custos.": { "en-US": "Add products before approving costs.", "zh-CN": "请先添加产品再批准成本。" },
  "Prepare a estimativa e aprove os custos para iniciar o acompanhamento da importação.": { "en-US": "Prepare the estimate and approve costs to start tracking the import.", "zh-CN": "准备估算并批准成本后开始跟踪进口。" },
  "Acompanhe o embarque, a chegada e as despesas realizadas.": { "en-US": "Track shipment, arrival and actual expenses.", "zh-CN": "跟踪装运、到货及实际费用。" },
  "Compare os custos aprovados com as despesas registradas na operação.": { "en-US": "Compare approved costs with expenses recorded for the operation.", "zh-CN": "将已批准成本与业务中记录的费用进行比较。" },
  "Lance os produtos, tributos e despesas para preparar os custos da importação.": { "en-US": "Enter products, taxes and expenses to prepare import costs.", "zh-CN": "录入产品、税费和费用以准备进口成本。" },
  "Despesas realizadas": { "en-US": "Actual expenses", "zh-CN": "实际费用" },
  "Organize os custos da importação": { "en-US": "Organize import costs", "zh-CN": "整理进口成本" },
  "Estruturar custos": { "en-US": "Set up costs", "zh-CN": "建立成本结构" },
  "Excluir pendência": { "en-US": "Delete task", "zh-CN": "删除待办" },
  "Deseja excluir esta pendência?": { "en-US": "Delete this task?", "zh-CN": "确定删除此待办？" },
  "Nenhuma pendência cadastrada.": { "en-US": "No tasks yet.", "zh-CN": "暂无待办。" },
  "Pendência atualizada": { "en-US": "Task updated", "zh-CN": "待办已更新" },
  "Pendência excluída": { "en-US": "Task deleted", "zh-CN": "待办已删除" },
  "Menor FOB": {
    "en-US": "FOB: lowest first",
    "zh-CN": "FOB：从低到高"
  },
  "Maiores tributos": {
    "en-US": "Taxes: highest first",
    "zh-CN": "税费：从高到低"
  },
  "Menores tributos": {
    "en-US": "Taxes: lowest first",
    "zh-CN": "税费：从低到高"
  },
  "Maior custo unitário": {
    "en-US": "Unit cost: highest first",
    "zh-CN": "单位成本：从高到低"
  },
  "Menor custo unitário": {
    "en-US": "Unit cost: lowest first",
    "zh-CN": "单位成本：从低到高"
  },
  "Nenhum produto encontrado.": {
    "en-US": "No products found.",
    "zh-CN": "未找到产品。"
  },
  "Paginação dos produtos": {
    "en-US": "Product pagination",
    "zh-CN": "产品分页"
  },
  "Adicione os produtos para calcular os custos.": {
    "en-US": "Add products to calculate costs.",
    "zh-CN": "添加产品以计算成本。"
  }
});

Object.assign(uiText, {
  "Editar usuário": { "en-US": "Edit user", "zh-CN": "编辑用户" },
  "Perfil de acesso": { "en-US": "Access role", "zh-CN": "访问角色" },
  "Usuário atualizado.": { "en-US": "User updated.", "zh-CN": "用户已更新。" },
  "Não foi possível atualizar o usuário.": { "en-US": "Unable to update the user.", "zh-CN": "无法更新用户。" },
  "Mantenha ao menos um administrador no sistema.": { "en-US": "Keep at least one administrator in the system.", "zh-CN": "系统中必须保留至少一位管理员。" },
  "Informe nome, e-mail válido e perfil. Verifique os dados de contato.": { "en-US": "Enter a name, valid email and role. Check the contact details.", "zh-CN": "请输入姓名、有效邮箱和角色，并检查联系信息。" }
});

Object.assign(uiText, {
  "Confira a composição do custo, o preço de venda e os tributos de cada produto.": { "en-US": "Review each product’s cost breakdown, selling price and taxes.", "zh-CN": "查看每项产品的成本构成、销售价格及税费。" },
  "Custo total × (1 + acréscimo / 100).": { "en-US": "Total cost × (1 + markup / 100).", "zh-CN": "总成本 ×（1 + 加价率 / 100）。" },
  "Quantidade × preço em USD × câmbio.": { "en-US": "Quantity × USD price × exchange rate.", "zh-CN": "数量 × 美元单价 × 汇率。" },
  "II + IPI + PIS-importação + COFINS-importação.": { "en-US": "II + IPI + import PIS + import COFINS.", "zh-CN": "II + IPI + 进口 PIS + 进口 COFINS。" }
});

Object.assign(uiText, {
  "País do cliente": {"en-US":"Customer country","zh-CN":"客户所在国家"},
  "CNPJ (opcional)": {"en-US":"CNPJ (optional)","zh-CN":"巴西 CNPJ（可选）"},
  "Documento fiscal / registro da empresa (opcional)": {"en-US":"Tax ID / company registration (optional)","zh-CN":"税号 / 企业注册号（可选）"},
  "Identificação da empresa no país de origem": {"en-US":"Company identification in its country","zh-CN":"企业在所在国家的登记号码"},
  "Nome legal da empresa": {"en-US":"Legal company name","zh-CN":"企业法定名称"},
  "Situação do CNPJ na Receita Federal": {"en-US":"CNPJ status at the Brazilian Federal Revenue","zh-CN":"巴西联邦税务局 CNPJ 登记状态"},
  "Informação retornada pela consulta do CNPJ.": {"en-US":"Information returned by the CNPJ lookup.","zh-CN":"CNPJ 查询返回的信息。"},
  "Informe o endereço no país do cliente. O código postal é opcional.": {"en-US":"Enter the address in the customer's country. Postal code is optional.","zh-CN":"填写客户所在国家的地址。邮政编码为可选项。"},
  "CEP (opcional)": {"en-US":"Brazilian postal code (optional)","zh-CN":"巴西邮政编码（可选）"},
  "Código postal (opcional)": {"en-US":"Postal code (optional)","zh-CN":"邮政编码（可选）"},
  "Código postal": {"en-US":"Postal code","zh-CN":"邮政编码"},
  "Estado / província / região": {"en-US":"State / province / region","zh-CN":"州 / 省 / 地区"},
  "Província ou região": {"en-US":"Province or region","zh-CN":"省或地区"},
  "Telefone com código do país": {"en-US":"Phone with country calling code","zh-CN":"电话（含国家区号）"},
  "Documento fiscal": {"en-US":"Tax ID","zh-CN":"税号"}
});

Object.assign(uiText, {
  "Preencha este campo.": {
    "en-US": "Fill in this field.",
    "zh-CN": "请填写此字段。"
  },
  "Informe um e-mail válido.": {
    "en-US": "Enter a valid email address.",
    "zh-CN": "请输入有效的电子邮箱地址。"
  },
  "A senha deve ter pelo menos 8 caracteres.": {
    "en-US": "The password must have at least 8 characters.",
    "zh-CN": "密码至少需要8个字符。"
  },
  "As senhas não coincidem.": {
    "en-US": "Passwords do not match.",
    "zh-CN": "两次输入的密码不一致。"
  },
  "Informe uma data e um horário válidos.": {
    "en-US": "Enter a valid date and time.",
    "zh-CN": "请输入有效的日期和时间。"
  },
  "Selecione uma data válida.": {
    "en-US": "Select a valid date.",
    "zh-CN": "请选择有效日期。"
  },
  "Informe um número válido.": {
    "en-US": "Enter a valid number.",
    "zh-CN": "请输入有效数字。"
  },
  "O valor não pode ser negativo.": {
    "en-US": "The value cannot be negative.",
    "zh-CN": "数值不能为负数。"
  },
  "Informe uma quantidade maior que zero.": {
    "en-US": "Enter a quantity greater than zero.",
    "zh-CN": "请输入大于零的数量。"
  },
  "Informe um número inteiro.": {
    "en-US": "Enter a whole number.",
    "zh-CN": "请输入整数。"
  },
  "Informe um CNPJ válido.": {
    "en-US": "Enter a valid CNPJ.",
    "zh-CN": "请输入有效的CNPJ。"
  },
  "O NCM deve ter 8 dígitos.": {
    "en-US": "The NCM must have 8 digits.",
    "zh-CN": "NCM必须为8位数字。"
  },
  "Informe uma alíquota válida, igual ou maior que zero.": {
    "en-US": "Enter a valid tax rate of zero or more.",
    "zh-CN": "请输入大于或等于零的有效税率。"
  },
  "Revise os campos destacados antes de salvar.": {
    "en-US": "Review the highlighted fields before saving.",
    "zh-CN": "保存前请检查突出显示的字段。"
  }
});

Object.assign(uiText, { "Não foi possível salvar. Tente novamente.": { "en-US": "Unable to save. Try again.", "zh-CN": "无法保存，请重试。" } });

Object.assign(uiText, {
  "Peso líquido e formação do FOB": {
    "en-US": "Net weight and FOB calculation",
    "zh-CN": "净重与FOB计算"
  },
  "Desconto do peso bruto (%)": {
    "en-US": "Gross weight deduction (%)",
    "zh-CN": "毛重扣减比例（%）"
  },
  "Peso líquido informado (kg)": {
    "en-US": "Reported net weight (kg)",
    "zh-CN": "录入净重（kg）"
  },
  "Peso líquido calculado (kg)": {
    "en-US": "Calculated net weight (kg)",
    "zh-CN": "计算净重（kg）"
  },
  "Peso bruto total (kg)": {
    "en-US": "Total gross weight (kg)",
    "zh-CN": "总毛重（kg）"
  },
  "Peso líquido total (kg)": {
    "en-US": "Total net weight (kg)",
    "zh-CN": "总净重（kg）"
  },
  "Pauta (USD/kg)": {
    "en-US": "Reference value (USD/kg)",
    "zh-CN": "基准价（美元/kg）"
  },
  "Sobra (USD/kg)": {
    "en-US": "Additional value (USD/kg)",
    "zh-CN": "附加价（美元/kg）"
  },
  "Pauta + sobra (USD/kg)": {
    "en-US": "Reference + additional value (USD/kg)",
    "zh-CN": "基准价+附加价（美元/kg）"
  },
  "FOB calculado (USD)": {
    "en-US": "Calculated FOB (USD)",
    "zh-CN": "计算FOB（美元）"
  },
  "Formação dos valores dos produtos": {
    "en-US": "Product value calculation",
    "zh-CN": "产品金额计算"
  },
  "Do peso bruto ao CFR: valores calculados por produto, antes dos impostos.": {
    "en-US": "From gross weight to CFR: calculated product amounts before taxes.",
    "zh-CN": "从毛重到CFR：各产品税前计算金额。"
  },
  "Quantidade total": {
    "en-US": "Total quantity",
    "zh-CN": "总数量"
  },
  "Os valores importados já incluem frete; não some o frete novamente.": {
    "en-US": "Imported values already include freight; do not add it again.",
    "zh-CN": "导入金额已包含运费，请勿重复计入。"
  },
  "Peso de referência do frete (kg)": {
    "en-US": "Freight allocation reference weight (kg)",
    "zh-CN": "运费分摊参考重量（kg）"
  },
  "Frete por produto = frete internacional ÷ peso de referência × peso líquido do produto. Deixe vazio para usar a soma dos pesos líquidos.": {
    "en-US": "Product freight = international freight ÷ reference weight × product net weight. Leave blank to use total net weight.",
    "zh-CN": "产品运费=国际运费÷参考重量×产品净重。留空则使用总净重。"
  },
  "Peso líquido = peso bruto × (1 − desconto / 100). FOB = (pauta + sobra) × peso líquido. Sem pauta, usamos quantidade × preço unitário.": {
    "en-US": "Net weight = gross weight × (1 − deduction / 100). FOB = (reference + additional value) × net weight. Without a reference value, use quantity × unit price.",
    "zh-CN": "净重=毛重×（1−扣减比例/100）。FOB=（基准价+附加价）×净重。未填写基准价时使用数量×单价。"
  },
  "Produtos e pesos": {
    "en-US": "Products and weights",
    "zh-CN": "产品与重量"
  },
  "Aplicado a novos produtos. Cada produto pode ter seu próprio desconto, sem alterar operações existentes.": {
    "en-US": "Applies to new products. Each product can have its own deduction; existing operations stay unchanged.",
    "zh-CN": "应用于新产品。每个产品可设置独立扣减比例，不影响已有业务。"
  },
  "Informe um percentual entre 0 e 100.": {
    "en-US": "Enter a percentage between 0 and 100.",
    "zh-CN": "请输入0到100之间的百分比。"
  },
  "O peso de referência do frete difere do peso líquido dos produtos; revise o rateio.": {
    "en-US": "The freight reference weight differs from total product net weight; review the allocation.",
    "zh-CN": "运费参考重量与产品总净重不一致，请检查分摊。"
  },
  "Moeda da despesa": {
    "en-US": "Expense currency",
    "zh-CN": "费用币种"
  }
});

Object.assign(uiText, {"Ver cálculo": {"en-US": "View calculation", "zh-CN": "查看计算"}, "Memória de cálculo": {"en-US": "Calculation details", "zh-CN": "计算明细"}, "CFR = FOB + frete internacional. Seguro é somado à base CIF quando informado.": {"en-US": "CFR = FOB + international freight. Insurance is added to the CIF basis when provided.", "zh-CN": "CFR=FOB+国际运费。填写保险费后计入CIF基数。"}, "II = CIF × alíquota; IPI = (CIF + II) × alíquota; PIS e COFINS = CIF × alíquota. Despesas são rateadas conforme a operação.": {"en-US": "II = CIF × rate; IPI = (CIF + II) × rate; PIS and COFINS = CIF × rate. Expenses use the operation allocation rules.", "zh-CN": "II=CIF×税率；IPI=（CIF+II）×税率；PIS和COFINS=CIF×税率。费用按业务规则分摊。"}});

Object.assign(uiText, {"Preencha por produto; use zero quando isento.": {"en-US": "Enter per product; use zero for exempt items.", "zh-CN": "请逐项填写，免税时填零。"}, "Preencha II, IPI de entrada e IPI de saída em cada produto, incluindo zero quando isento.": {"en-US": "Enter import duty, input IPI and output IPI for each product, including zero when exempt.", "zh-CN": "请为每个产品填写进口税、进项IPI和销项IPI，免税时填零。"}, "Alíquotas fixas usadas como padrão nas operações.": {"en-US": "Fixed rates used as defaults for operations.", "zh-CN": "作为业务默认值的固定税率。"}, "IPI de saída (%)": {"en-US": "Output IPI (%)", "zh-CN": "销项IPI（%）"}});
