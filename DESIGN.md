# Exporta Brasil — Design System

## Direção

O Exporta Brasil é uma ferramenta operacional. Sua interface deve transmitir controle, procedência e capacidade de decisão, mesmo quando uma operação contém muitos documentos, prazos e valores.

A linguagem visual combina **dark mode OLED**, **glassmorphism contido** e **autoridade operacional**. O vidro cria profundidade em navegação, painéis de resumo e camadas temporárias. Dados, formulários e tabelas usam superfícies escuras estáveis e com contraste alto. A interface não adota estética de trading, cyberpunk ou painel de entretenimento.

## Princípios visuais

1. **A origem do dado aparece junto do dado.** Valores críticos mostram fonte, vigência, status ou última atualização quando isso muda a decisão.
2. **Profundidade tem função.** Blur e transparência separam contexto, não decoram cada cartão.
3. **Densidade sem ruído.** Desktop exibe mais contexto; grupos, alinhamento e espaço tornam a leitura rápida.
4. **Ação antes de detalhe no mobile.** Status, bloqueios, prazo e próxima ação ficam acima de totais e informações secundárias.
5. **Estados são explícitos.** Cor sempre vem acompanhada de texto, ícone ou rótulo.

## Cor e superfícies

O produto inicia somente em tema escuro OLED. Um tema claro não será derivado por inversão automática.

| Token | Valor | Uso |
| --- | --- | --- |
| `--bg-canvas` | `#05070A` | Fundo OLED principal. |
| `--bg-elevated` | `#0B1017` | Páginas, tabelas, campos e painéis de trabalho. |
| `--bg-raised` | `#111924` | Menus, hover e superfícies elevadas. |
| `--glass-surface` | `rgb(15 23 34 / 76%)` | Resumos, barras e cartões de contexto. |
| `--glass-border` | `rgb(191 219 254 / 16%)` | Contorno das superfícies de vidro. |
| `--text-primary` | `#F1F5F9` | Títulos e conteúdo principal. |
| `--text-secondary` | `#B8C4D4` | Metadados e texto auxiliar legível. |
| `--text-muted` | `#8C9AAF` | Informação terciária, nunca instruções essenciais. |
| `--brand-primary` | `#2563EB` | Ação primária, seleção e links. |
| `--brand-focus` | `#93C5FD` | Foco de teclado e estado de navegação. |
| `--status-success` | `#22C55E` | Concluído, disponível ou validado. |
| `--status-warning` | `#F59E0B` | Pendente, atenção ou prazo próximo. |
| `--status-danger` | `#F05252` | Erro, bloqueio ou risco. |
| `--status-info` | `#60A5FA` | Informação e etapa em andamento. |

Fundos usam preto e azul-noturno. Verde, âmbar e vermelho são reservados a estados. Gradientes não devem carregar significado operacional. O halo azul de foco pode aparecer em superfícies de vidro, com opacidade baixa e sem brilho permanente.

## Tipografia e números

- **Interface e texto:** IBM Plex Sans, com fallback para `system-ui`. É uma fonte sóbria e de leitura segura para operações e finanças.
- **Identificadores, valores e referências:** IBM Plex Mono apenas para NCM, contêiner, moeda, percentuais, datas operacionais e totais tabulares.
- Corpo: 16px e line-height de 1.5 no mobile; 14–16px em listas densas no desktop.
- Títulos: IBM Plex Sans 600 ou 700; não usar caixa alta em títulos extensos.
- Números financeiros: `font-variant-numeric: tabular-nums` e alinhamento à direita em tabelas.

## Espaçamento, forma e elevação

- Escala base: `4, 8, 12, 16, 24, 32, 48, 64`.
- Raios: 10px para controles, 14px para painéis, 18px apenas para superfícies de contexto maiores.
- Borda: 1px; a elevação vem de contraste e sombra suave, não de sombras negras grandes.
- Glass panel: `backdrop-filter: blur(16px) saturate(120%)`; usar somente sobre um fundo visualmente simples.
- Formulários e tabelas: fundo `--bg-elevated`, borda visível e sem transparência que reduza contraste.

## Layout adaptativo

| Largura | Navegação | Conteúdo |
| --- | --- | --- |
| 375–639px | Barra superior compacta e navegação inferior com até cinco destinos. | Uma coluna; resumo da operação, bloqueios e próxima ação aparecem primeiro. Tabelas viram lista de cartões com link para detalhes. |
| 640–767px | Barra superior e menu contextual. | Duas colunas apenas para métricas curtas; formulários continuam em uma coluna. |
| 768–1023px | Rail de navegação recolhível. | Conteúdo em duas colunas quando a tarefa permitir; tabela pode ter rolagem horizontal dentro de um contêiner identificado. |
| 1024–1439px | Sidebar fixa, cabeçalho de contexto e atalhos. | Painel de operação com conteúdo principal e coluna de contexto; tabelas densas, filtros persistentes e ações em linha. |
| 1440px+ | Sidebar fixa e trilha contextual. | Grade de 12 colunas, largura máxima de 1600px e painel lateral para auditoria, tarefas ou documentos. |

No mobile, o botão primário de um fluxo longo fica em uma barra inferior fixa que respeita safe area e reserva espaço no conteúdo. No desktop, a mesma ação fica no cabeçalho da página. Estado, filtro e posição de rolagem são preservados ao voltar.

## Navegação e informação

### Destinos principais

- Início
- Operações
- Pendências
- Clientes
- Relatórios

Configurações, organização, usuários e ajuda ficam em uma área secundária. Em mobile, o quinto item pode ser `Mais`, que abre os destinos secundários; a navegação nunca mistura sidebar, tabs e barra inferior no mesmo nível.

### Tela de operação

O detalhe de uma importação é o centro do produto. A ordem deve ser:

1. Referência, cliente, status, próximo prazo e ação primária.
2. Linha de etapas com bloqueios visíveis.
3. Resumo financeiro e documentos pendentes.
4. Itens, classificação, despesas e cenários em seções com URLs próprias.
5. Auditoria e histórico em painel lateral no desktop e seção expansível no mobile.

## Componentes fundamentais

| Componente | Regras |
| --- | --- |
| `AppShell` | Fundo OLED, grid estável e navegação adaptativa. |
| `GlassPanel` | Usado em resumo, navegação e contextos; nunca como base de uma tabela longa. |
| `DataTable` | Cabeçalho visível, coluna de identificação fixável em desktop, estado vazio útil e alternativa em cartão no mobile. |
| `StatusBadge` | Ícone, texto e cor. Rótulos não dependem apenas de verde, âmbar ou vermelho. |
| `MetricCard` | Valor tabular, unidade, período e fonte/atualização quando relevantes. |
| `FormField` | Label persistente, texto de apoio e erro específico próximo ao campo. Altura mínima de 44px. |
| `AuditItem` | Autor, horário, ação e diferença resumida; link para o contexto alterado. |
| `ApprovalAction` | Exibe responsável, consequência e confirmação para decisões de alto impacto. |
| `EmptyState` | Explica o que falta e fornece uma ação clara, sem ilustrações genéricas excessivas. |

## Interação e movimento

- Hover, seleção e expansão: 150–220ms, apenas `opacity`, `transform` ou cor.
- Painéis e drawers usam entrada curta com `opacity` e deslocamento máximo de 12px.
- Listas não recebem animação em massa; somente itens recém-criados ou resultados carregados podem ter realce discreto.
- `prefers-reduced-motion` remove transições não essenciais e mostra o estado final de imediato.
- Ações assíncronas mantêm rótulo, estado de progresso e feedback de conclusão ou falha.

## Acessibilidade e confiança

- Texto normal atende contraste mínimo de 4.5:1; superfícies compostas por vidro devem ser medidas sobre seu fundo real.
- Todo controle possui foco visível de 3px com `--brand-focus`, inclusive dentro de modal e menu.
- Header, barra inferior e overlays não podem ocultar o elemento focado; usar `scroll-padding` e espaçamento reservado.
- Ícones decorativos usam `aria-hidden`; controles apenas com ícone possuem nome acessível.
- Tabelas extensas preservam semântica de tabela no desktop. A visão em cartões no mobile mantém rótulos e acesso a todos os dados.
- Campos permitem autofill, colar senha e mostram erros com causa e caminho de correção.

## O que evitar

- Vidro translúcido sobre texto, tabelas ou campos de alta densidade.
- Neon constante, grades HUD, reflexos metálicos ou animações que sugiram especulação financeira.
- Gradientes coloridos para indicar status ou prioridade.
- Cards genéricos demais onde uma tabela ou timeline explica melhor o trabalho.
- Controles sem rótulo, ações críticas escondidas em hover e mensagens vagas como “erro ao salvar”.
