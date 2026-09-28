# Workflow de design com Impeccable

## Papel no projeto

O Impeccable será o processo de qualidade da interface do Exporta Brasil. Ele não substitui requisitos de produto, nem gera uma identidade diferente para cada tela. `PRODUCT.md` registra o produto; `DESIGN.md` registra a linguagem visual. Cada nova superfície recebe uma breve estratégia antes de virar código.

## Ciclo obrigatório por superfície

```text
brief → shape → implementação React → detect → audit + critique → polish → harden
```

| Etapa | Comando | Quando usar | Resultado esperado |
| --- | --- | --- | --- |
| Contexto | `impeccable context` | No início de uma sessão de design. | Confirma produto, design, superfície e necessidade de detector. |
| Brief | `impeccable shape <superfície>` | Antes de uma página, fluxo ou módulo novo. | Define usuário, tarefa, estados, conteúdo, limites e responsividade. Não escreve código. |
| Implementação | React 19 + `DESIGN.md` | Após o brief. | Componentes e páginas com tokens, sem valores visuais improvisados. |
| Detector | `impeccable detect --json <arquivos>` | Uma vez após terminar os arquivos de UI. | Aponta regras mecânicas de HTML e CSS para corrigir. |
| Auditoria | `impeccable audit <superfície>` | Após o detector. | Checa responsividade, acessibilidade, performance e comportamento técnico. |
| Crítica | `impeccable critique <superfície>` | Quando a superfície pode ser avaliada visualmente. | Avalia hierarquia, clareza, identidade e experiência operacional. |
| Polimento | `impeccable polish <superfície>` | Quando auditoria e crítica gerarem um backlog. | Fecha problemas encontrados sem ampliar o escopo. |
| Robustez | `impeccable harden <superfície>` | Antes de considerar um fluxo pronto. | Fecha estados vazios, erro, carregamento, permissões, excesso de dados e i18n. |

## Aplicação no Exporta Brasil

### 1. Shell e dashboard de operações

Começar pelo shell da aplicação e pela lista de operações. O brief deve validar:

- Como o coordenador prioriza processos vencidos, bloqueados e próximos do prazo.
- Quais números precisam aparecer sem abrir um detalhe.
- Qual é a densidade real de uma lista comum e de uma lista longa.
- Quais ações podem ser feitas no celular sem abrir um notebook.

Depois de implementado, usar `adapt` para testar as larguras de 375px, 768px, 1024px e 1440px. A tabela deve ter uma visão em cartões no mobile e uma visão de tabela no desktop.

### 2. Detalhe de uma operação

O detalhe será a superfície mais importante. O brief precisa definir etapas, bloqueios, documentos, valores, auditoria e a ação principal em cada estado. Aplicar `clarify` para revisar textos de status e erros, e `harden` para cobrir rascunho, ausência de documentos, permissão insuficiente, falha de upload e conflito de atualização.

### 3. Packing list e classificação NCM

São fluxos de alta complexidade. Usar `shape` antes de implementar para modelar revisão humana, dados incompletos, inconsistências de peso/quantidade, sugestão de IA, aprovação e reversão. Aplicar `audit` para foco de teclado, ordem de leitura e mensagens de erro por campo.

### 4. Cenários de custo e fechamento

O foco é confiança. `critique` deve verificar se premissas, fontes, vigência, diferenças entre cenários e aprovações ficam compreensíveis sem depender de explicações externas. `typeset` e `layout` são úteis para valores tabulares, colunas e comparação de números.

## Comandos de ajuste

| Comando | Uso permitido no produto |
| --- | --- |
| `adapt` | Corrige comportamento entre mobile, tablet e desktop. Usar após existir interface funcional. |
| `typeset` | Ajusta hierarquia, medidas de leitura e números tabulares. |
| `layout` | Corrige ritmo, grupos e alinhamento em telas densas. |
| `clarify` | Revisa labels, mensagens de erro, estados e microcopy operacional. |
| `colorize` | Só para reforçar semântica e hierarquia; nunca para substituir status por decoração. |
| `quieter` | Remove brilho, gradiente, efeito de vidro ou movimento excessivo. Provável ferramenta recorrente neste produto. |
| `bolder` | Aumenta presença quando uma tela perde hierarquia ou autoridade. Não deve criar estética de trading. |
| `delight` | Apenas em momentos de conclusão, como fechamento aprovado; sem animações em fluxos críticos. |
| `animate` | Apenas para transições funcionais e sempre respeitando redução de movimento. |
| `optimize` | Quando tabelas, filtros, upload ou gráficos tiverem problema de desempenho percebido. |
| `live` | Iteração visual no navegador quando o cliente React estiver rodando localmente. |

## Critérios de aceite para cada UI

- Desktop e mobile foram revisados no mesmo ciclo.
- A ação principal está visível e há apenas uma ação visualmente primária por tela.
- Nenhum dado essencial depende de cor ou hover para ser compreendido.
- Campos têm labels, ajuda quando necessária e erros próximos ao campo.
- Navegação por teclado tem foco visível e não fica coberta por sidebar, header ou barra inferior.
- Tabelas extensas continuam acessíveis e apresentam alternativa coerente no mobile.
- Vidro não reduz contraste de texto, campos ou valores financeiros.
- O detector, a auditoria e a crítica não têm pendências críticas abertas.

## O que não fazer

- Não usar `bolder`, `colorize` ou `delight` para resolver problema de hierarquia, fluxo ou conteúdo.
- Não executar `polish` antes de haver uma superfície funcional para avaliar.
- Não rodar `detect` durante a escolha de conceito; ele pertence ao fim da implementação.
- Não deixar um modo de ajuste substituir `DESIGN.md`; mudanças duráveis do sistema devem ser registradas lá.
- Não tratar uma recomendação automática como aprovação de produto ou de design.

## Primeiro passo prático

Quando o scaffold React 19 existir, a primeira execução deve ser:

```text
impeccable shape "dashboard e lista de operações"
```

O resultado será o brief confirmado da primeira superfície. Só então criamos os componentes, tokens e rotas correspondentes.
