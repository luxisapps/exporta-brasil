# Plano de entrega

## Fase 0 — alinhamento e fundação

Objetivo: deixar o monorepo executável e com regras claras antes de construir telas.

- Criar npm workspaces, `apps/api`, `apps/web`, `packages/contracts` e `packages/domain`.
- Configurar TypeScript, lint, formatação, testes e variáveis de ambiente de exemplo.
- Subir Fastify com `GET /health` e conexão Drizzle/PostgreSQL.
- Definir schema inicial de usuários, organizações, membros e auditoria.
- Criar Dockerfile da API, configuração Railway e CI mínimo.

Critério de saída: API sobe localmente e no ambiente de desenvolvimento, aplica migrations vazias com segurança e responde ao health check.

## Fase 1 — acesso e operações

Objetivo: substituir a POC por uma base segura para o fluxo principal.

- Login, sessão, organização ativa, papéis e convite de membros.
- Clientes, fornecedores e catálogo de produtos.
- CRUD de operações e itens, com estados controlados.
- Lista de operações com filtros por status, cliente, responsável e prazo.
- Eventos de auditoria para ações críticas.

Critério de saída: dois clientes não acessam dados um do outro e a equipe consegue abrir e acompanhar uma operação ponta a ponta até a etapa de custo.

## Fase 2 — documentos e classificação

Objetivo: transformar arquivos em dados revisáveis.

- Upload de packing list e outros documentos.
- Parser determinístico de XLSX para layouts conhecidos.
- Extração assistida por IA para layouts desconhecidos, sempre com fila de revisão.
- Validações de quantidade, peso e valor.
- Sugestão de NCM com histórico de evidência, revisão e aprovação.

Critério de saída: o analista importa um packing list, corrige exceções e confirma os itens sem redigitar a planilha.

## Fase 3 — custos e fechamento

Objetivo: produzir um fechamento rastreável por item.

- Cenários de câmbio, tributos, despesas e critérios de rateio.
- Comparação de cenários e aprovação do fechamento.
- Custo unitário final, margem de referência e exportação XLSX.
- Pendências e bloqueios antes de concluir a operação.

Critério de saída: a equipe gera a planilha final e explica a composição de qualquer valor exibido.

## Fase 4 — operação ampliada

Objetivo: reduzir acompanhamento manual e abrir colaboração externa.

- Painel de prazos, tarefas e alertas.
- Portal de cliente com escopo limitado.
- Integrações priorizadas com fontes de NCM, câmbio, documentos ou parceiros.
- Relatórios de custos, prazo, fornecedor e carteira de clientes.

## Ordem de implementação recomendada

1. Fundação e Railway.
2. Auth, organização e auditoria.
3. Operações, itens e tela de acompanhamento.
4. Documentos e packing list.
5. Cenários de custo e exportação.
6. NCM assistido, aprovações e integrações.

## Qualidade mínima por fase

- Testes unitários para regras de domínio e transições de status.
- Testes de integração para rotas com escopo de organização.
- Migration dry-run contra PostgreSQL descartável no CI.
- Teste de health check e smoke test após o deploy.
- Revisão de permissões em qualquer novo endpoint ou arquivo.
