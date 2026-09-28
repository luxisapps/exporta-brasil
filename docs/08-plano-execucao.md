# Plano de execução

Este é o roteiro de trabalho do Exporta Brasil. Cada fase termina com um resultado verificável antes da próxima começar.

## Painel de andamento

| Fase | Estado | Resultado de saída |
| --- | --- | --- |
| 0. Descoberta e direção | Concluída | Produto, POC, arquitetura, domínio, Railway e design documentados. |
| 1. Scaffold do monorepo | Concluída (base temporária) | React 19, API Fastify e pacote de domínio executam localmente. |
| 2. Sistema de UI executável | Concluída (MVP) | Shell responsivo, tokens e componentes da operação prontos. |
| 3. Acesso e organizações | Pendente | Login, papéis e isolamento de dados testados. |
| 4. Operações de importação | Pendente | Fluxo principal de operação e itens utilizável. |
| 5. Documentos e packing list | Pendente | Upload, revisão e confirmação de itens funcionam. |
| 6. Custos e fechamento | Pendente | Cenários, rateio, aprovação e XLSX rastreáveis. |
| 7. Railway e entrega | Pendente | Staging e produção monitorados com migrations seguras. |

## Fase 0 — direção concluída

### Feito por mim

- Analisei a POC e extraí os fluxos que devem permanecer: operações, packing list, NCM, custo e XLSX.
- Defini o monorepo, a API Fastify com Drizzle e PostgreSQL, e o plano de Railway.
- Registrei o produto em [PRODUCT.md](../PRODUCT.md) e o sistema visual em [DESIGN.md](../DESIGN.md).
- Criei o workflow de qualidade visual em [07-workflow-impeccable.md](07-workflow-impeccable.md).

### Acompanhar

- [x] Escopo inicial documentado.
- [x] Arquitetura inicial documentada.
- [x] Direção visual aprovada: OLED, vidro contido, autoridade e mobile-first.
- [x] React 19 definido para o cliente.

## Fase 1 — scaffold do monorepo

### O que farei

1. Criar npm workspaces com `apps/api`, `apps/web` e `packages/domain`.
2. Configurar TypeScript e scripts de desenvolvimento e build.
3. Criar a API Fastify com `GET /health` e contratos iniciais de importações.
4. Criar o cliente React 19 com o shell de backoffice e persistência local temporária para revisão do fluxo.
5. Substituir a persistência temporária por Drizzle/PostgreSQL, adicionar contratos validados, Dockerfile, Railway e CI na próxima fatia de infraestrutura.

### Você acompanha validando

- [x] `npm run dev` inicia cliente e API.
- [x] A tela inicial responde em desktop e mobile.
- [x] `GET /health` responde com sucesso.
- [x] O projeto não contém segredos em arquivos versionados.

### Decisão sua quando chegar o momento

- Confirmar se o cliente React será hospedado na Vercel ou também no Railway. A API e o banco ficam no Railway conforme definido.

## Fase 2 — sistema de UI executável

### O que farei

1. Definir o brief e tokens do `DESIGN.md`: cores OLED, tipografia, espaçamento, foco, raios, vidro e estados semânticos.
2. Criar `AppShell`, sidebar desktop, navegação mobile, cabeçalho de contexto e área principal.
3. Criar componentes fundamentais: botão, campo, status, painel, métrica, tabela e estado vazio.
4. Implementar a lista, detalhe, lançamento de produtos, custos e acompanhamento portuário com dados de demonstração realistas.
5. Rodar o detector do Impeccable na superfície implementada.

### Você acompanha validando

- [x] 375px: navegação, cards e ação principal estão operáveis.
- [x] 1024px: sidebar, lista e tabela são escaneáveis.
- [x] 1440px: há contexto sem desperdiçar espaço ou criar ruído.
- [x] Navegação por teclado e foco visível funcionam.
- [x] Vidro não reduz legibilidade de texto, campos ou valores.

### Decisão sua quando chegar o momento

- Aprovar a primeira tela visualmente antes de replicarmos o sistema em todo o produto.
- Enviar logotipo oficial, se houver. Até isso, usaremos a marca textual “Exporta Brasil”.

## Fase 3 — acesso e organizações

### O que farei

1. Criar migrations para usuário, organização, membro, papel e auditoria.
2. Implementar login, sessão e organização ativa.
3. Aplicar escopo de organização em todas as rotas e queries.
4. Criar a tela de membros e permissões com estados vazios, erro e convite.
5. Testar que uma organização não acessa os dados de outra.

### Você acompanha validando

- [ ] Admin convida e remove membros.
- [ ] Papéis alteram o que cada pessoa pode fazer.
- [ ] Auditoria registra mudanças de acesso.

## Fase 4 — operações de importação

### O que farei

1. Criar cliente, fornecedor, operação, item, etapa e tarefa no banco e na API.
2. Implementar lista, filtros, criação e detalhe de operação.
3. Implementar transições de estado no servidor e bloqueios claros na interface.
4. Exibir próxima ação, prazo, responsável, documentos pendentes e auditoria no detalhe.
5. Testar regras de estado, escopo e rotas críticas.

### Você acompanha validando

- [ ] Uma operação pode ser criada, atualizada e encontrada por filtros.
- [ ] A pessoa responsável enxerga seu próximo passo.
- [ ] Um estado bloqueado explica o que falta para avançar.

## Fase 5 — documentos e packing list

### O que farei

1. Definir o armazenamento de arquivos e implementar metadados, permissões e checksum.
2. Criar upload e visualização de documentos por operação.
3. Implementar parser de XLSX para layouts conhecidos.
4. Adicionar revisão humana para dados extraídos e inconsistências de quantidade, peso e valor.
5. Integrar sugestão de NCM como apoio, com aprovação humana e trilha de evidência.

### Você acompanha validando

- [ ] Um packing list pode ser enviado, revisado e confirmado.
- [ ] Inconsistências aparecem antes de criar itens definitivos.
- [ ] NCM sugerido não é aprovado automaticamente.

## Fase 6 — custos e fechamento

### O que farei

1. Criar cenários de câmbio, despesas, tributos e rateio.
2. Construir regras puras e testadas no pacote de domínio.
3. Exibir comparação entre cenários e a origem de cada valor.
4. Implementar aprovação de fechamento e imutabilidade do cenário aprovado.
5. Gerar XLSX de fechamento por operação e por item.

### Você acompanha validando

- [ ] É possível explicar a composição de qualquer custo final.
- [ ] A mudança de uma premissa cria ou atualiza um cenário, sem alterar histórico silenciosamente.
- [ ] O XLSX corresponde ao cenário aprovado.

## Fase 7 — Railway e entrega

### O que farei

1. Criar o projeto e serviços no Railway quando a API estiver pronta para deploy.
2. Configurar `staging` e `production`, cada um com PostgreSQL próprio.
3. Configurar variáveis, domínio, health check, migrations e logs.
4. Criar CI com typecheck, testes, migration dry-run e deploy para staging.
5. Verificar cada deploy pelo status `SUCCESS` e pelo endpoint `/health`.

### Você acompanha validando

- [ ] Staging tem dados e segredos isolados de produção.
- [ ] Migrations passam em banco descartável antes de produção.
- [ ] Logs e alertas permitem identificar falhas de API e jobs.
- [ ] Produção só recebe uma revisão validada em staging.

## Como vamos trabalhar a cada pedido

1. Você descreve a próxima necessidade ou valida uma decisão pendente.
2. Eu atualizo o brief e implemento a menor fatia completa que atende a necessidade.
3. Eu testo e registro evidências no código e nos documentos quando houver decisão durável.
4. Você revisa uma tela, comportamento ou fluxo concreto.
5. Seguimos para a próxima fatia sem reabrir decisões já confirmadas.

## Próxima ação

Iniciar a Fase 3 e a persistência real da Fase 4: autenticação, organizações, PostgreSQL/Drizzle, migrations e troca da persistência temporária pelo banco.
