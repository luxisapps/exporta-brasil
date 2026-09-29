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
    language: "Idioma", home: "Início", operations: "Operações", customers: "Clientes", ports: "Portos", reports: "Relatórios", pending: "Pendências", users: "Usuários", profile: "Meu perfil", signOut: "Sair", search: "Buscar", notifications: "Notificações", help: "Ajuda",
    controlCenter: "CENTRO DE CONTROLE", operationsUnderControl: "Operações sob controle.", dashboardDescription: "Acompanhe custos, cargas e decisões que pedem atenção.", viewOperations: "Ver operações", activeImports: "Importações ativas", ongoingProcesses: "processos em andamento", cargoAtPort: "Cargas em porto", needsUpdate: "com atualização necessária", projectedCost: "Custo projetado", openOperations: "nas operações abertas",
    customsLight: "Farol aduaneiro", customsDescription: "Operações por canal de conferência. A cor é sempre acompanhada pelo nome e pela etapa aplicável.", noChannel: "Sem canal", channelNotDefined: "Canal ainda não informado", latestNews: "Últimas notícias", officialNewsDescription: "Fontes oficiais de comércio exterior, regulação e portos.", updated: "Atualizado", readNews: "Ler notícia", newsUnavailable: "As fontes oficiais não retornaram notícias agora. Tente atualizar novamente em alguns minutos.", openSiscomex: "Abrir Siscomex",
    recentOperations: "Operações recentes", recentOperationsDescription: "Os processos que exigem acompanhamento.", nextDecision: "Próxima decisão", operationalContext: "Contexto operacional atual", sale: "venda", operationalDataUnavailable: "Dados operacionais indisponíveis", refreshingOperationalData: "Atualizando dados operacionais", recentlyUpdated: "Atualização recente", greenChannel: "Canal verde", yellowChannel: "Canal amarelo", redChannel: "Canal vermelho", grayChannel: "Canal cinza", automaticClearance: "Desembaraço automático", documentInspection: "Exame documental", documentPhysicalInspection: "Exame documental e físico", fraudInvestigation: "Apuração de indícios de fraude", noChannelDefined: "Canal ainda não informado"
  },
  "en-US": {
    language: "Language", home: "Home", operations: "Operations", customers: "Customers", ports: "Ports", reports: "Reports", pending: "Pending", users: "Users", profile: "My profile", signOut: "Sign out", search: "Search", notifications: "Notifications", help: "Help",
    controlCenter: "CONTROL CENTER", operationsUnderControl: "Operations under control.", dashboardDescription: "Track costs, cargo, and decisions that need attention.", viewOperations: "View operations", activeImports: "Active imports", ongoingProcesses: "ongoing processes", cargoAtPort: "Cargo at port", needsUpdate: "requiring an update", projectedCost: "Projected cost", openOperations: "across open operations",
    customsLight: "Customs signal", customsDescription: "Operations by inspection channel. Each color is always paired with its name and applicable stage.", noChannel: "No channel", channelNotDefined: "Customs channel not provided", latestNews: "Latest news", officialNewsDescription: "Official sources for trade, regulation, and ports.", updated: "Updated", readNews: "Read article", newsUnavailable: "Official sources did not return news right now. Try again in a few minutes.", openSiscomex: "Open Siscomex",
    recentOperations: "Recent operations", recentOperationsDescription: "Processes that need follow-up.", nextDecision: "Next decision", operationalContext: "Current operating context", sale: "sell", operationalDataUnavailable: "Operational data unavailable", refreshingOperationalData: "Updating operational data", recentlyUpdated: "Recent update", greenChannel: "Green channel", yellowChannel: "Yellow channel", redChannel: "Red channel", grayChannel: "Gray channel", automaticClearance: "Automatic clearance", documentInspection: "Document inspection", documentPhysicalInspection: "Document and physical inspection", fraudInvestigation: "Fraud investigation", noChannelDefined: "Customs channel not provided"
  },
  "zh-CN": {
    language: "语言", home: "首页", operations: "业务", customers: "客户", ports: "港口", reports: "报告", pending: "待办", users: "用户", profile: "我的资料", signOut: "退出", search: "搜索", notifications: "通知", help: "帮助",
    controlCenter: "控制中心", operationsUnderControl: "进口业务尽在掌控。", dashboardDescription: "跟踪成本、货物和需要关注的决策。", viewOperations: "查看业务", activeImports: "进行中的进口", ongoingProcesses: "进行中的业务", cargoAtPort: "港口货物", needsUpdate: "需要更新", projectedCost: "预计成本", openOperations: "所有未结业务",
    customsLight: "海关信号灯", customsDescription: "按查验通道查看业务。每种颜色均配有名称和适用阶段。", noChannel: "未分配通道", channelNotDefined: "尚未提供海关通道", latestNews: "最新资讯", officialNewsDescription: "来自贸易、监管和港口的官方资讯。", updated: "更新于", readNews: "阅读资讯", newsUnavailable: "官方来源暂未返回资讯，请稍后再试。", openSiscomex: "打开 Siscomex",
    recentOperations: "最近业务", recentOperationsDescription: "需要跟进的业务。", nextDecision: "下一项决策", operationalContext: "当前运营信息", sale: "卖出价", operationalDataUnavailable: "运营数据暂不可用", refreshingOperationalData: "正在更新运营数据", recentlyUpdated: "最近更新", greenChannel: "绿色通道", yellowChannel: "黄色通道", redChannel: "红色通道", grayChannel: "灰色通道", automaticClearance: "自动放行", documentInspection: "文件查验", documentPhysicalInspection: "文件与实物查验", fraudInvestigation: "欺诈迹象核查", noChannelDefined: "尚未提供海关通道"
  }
} as const;

export function t(locale: Locale, key: MessageKey) { return messages[locale][key] ?? messages["pt-BR"][key]; }
