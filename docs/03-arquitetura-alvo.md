# Arquitetura alvo

## Decisão

O repositório será um monorepo Node.js com duas aplicações e pacotes compartilhados:

```text
exporta-brasil/
├── apps/
│   ├── api/                 # Fastify + Drizzle + PostgreSQL
│   └── web/                 # React 19
├── packages/
│   ├── contracts/           # DTOs, schemas de validação e tipos públicos
│   ├── domain/              # Regras puras de custo, rateio e estados
│   └── config/              # ESLint, TypeScript e configurações compartilhadas
├── docs/
├── package.json             # npm workspaces e scripts de orquestração
└── railway.json             # serviço de API no Railway
```

Usaremos npm workspaces de forma explícita, diferente do monorepo informal do Jinvo. Isso reduz comandos por prefixo e permite que `web` e `api` compartilhem contratos sem duplicação.

## API

A API seguirá o padrão já provado no Jinvo ERP:

- Node.js 22 e TypeScript ESM.
- Fastify para HTTP, validação de entrada, hooks e observabilidade.
- Drizzle ORM com `postgres`/Postgres.js e PostgreSQL.
- Rotas finas por módulo, serviços sem dependência de Fastify e injeção de banco.
- Migrations SQL geradas pelo Drizzle e verificadas no CI.
- Health check em `GET /health`.

Estrutura proposta para `apps/api/src`:

```text
src/
├── app.ts
├── container.ts
├── db/                 # conexão, schema Drizzle, migrations e seeds locais
├── modules/
│   ├── auth/
│   ├── organizations/
│   ├── customers/
│   ├── catalog/
│   ├── imports/
│   ├── documents/
│   ├── classifications/
│   ├── costing/
│   └── reports/
├── hooks/              # autenticação, organização ativa e auditoria
├── jobs/               # processamento assíncrono de arquivos e IA
└── lib/                # logger, erros e clientes externos
```

## Cliente web

O cliente será construído em React 19. A escolha de roteamento e build será definida durante o scaffold. Ele consumirá somente a API; não terá credenciais de banco nem regra tributária autoritativa. A interface deve priorizar tabelas densas, revisão de documentos, filtros, estados de operação e comparações entre cenários.

## Domínio e contratos

`packages/domain` conterá regras puras e testáveis: cálculo de bases, rateio, arredondamento, transição de status e validação de consistência. `packages/contracts` conterá schemas compartilhados para requests, responses e formulários. O schema Drizzle permanece interno à API.

## Segurança

- JWT de curta duração com renovação e senha com hash forte.
- Autorização por função e por organização em todos os módulos.
- `organization_id` obrigatório nas tabelas de negócio e aplicado por hook de escopo.
- Arquivos enviados por URL assinada ou endpoint autenticado; acesso verificado antes do download.
- Rate limit, CORS restrito, headers de segurança, validação de payload e logs sem segredos.
- Auditoria para mudanças de status, classificação NCM, parâmetros, despesas, aprovações e fechamento.

## Decisões deliberadamente adiadas

- Provedor de armazenamento de documentos: definir entre Railway Bucket, Cloudflare R2 ou S3 conforme volume e necessidade de domínio público.
- Fila assíncrona: começar com jobs persistidos no PostgreSQL e worker da API; introduzir Redis somente se a carga justificar.
- Hospedagem do cliente: Vercel é a opção preferencial para Next.js; Railway também é possível caso a operação queira concentrar os serviços.
