# Plano Railway

## Arquitetura de infraestrutura

O Railway hospedará a API e o PostgreSQL. O padrão seguirá o Jinvo ERP: serviço Node em Docker, banco PostgreSQL separado por ambiente, migrations controladas e health check.

```text
Web client ──HTTPS──> API Fastify (Railway) ──> PostgreSQL (Railway)
                              │
                              ├──────────────> armazenamento de documentos
                              └──────────────> provedores de IA e dados de referência
```

## Ambientes

| Ambiente | Serviço API | Banco | Uso |
| --- | --- | --- | --- |
| `staging` | `exporta-brasil-api` | PostgreSQL próprio | validação interna e migrations antes de produção. |
| `production` | `exporta-brasil-api` | PostgreSQL próprio | operação real. |

Não compartilhar banco entre staging e produção. `DATABASE_URL` será fornecida pela referência do serviço Postgres dentro de cada ambiente.

## Configuração da API

- Dockerfile em `apps/api/Dockerfile`, com build multi-stage Node 22.
- `railway.json` na raiz para permitir build com acesso aos pacotes compartilhados do monorepo.
- Health check em `GET /health`.
- `preDeployCommand` para aplicar migrations; o comando deve falhar se a migration não puder ser concluída.
- Política de reinício `ON_FAILURE` e logs estruturados no stdout.
- Um domínio Railway por ambiente durante o desenvolvimento; domínio próprio somente após o cliente web estar pronto.

## Variáveis iniciais

| Variável | Ambiente | Uso |
| --- | --- | --- |
| `DATABASE_URL` | todos | Conexão PostgreSQL injetada pelo Railway. |
| `JWT_SECRET` | todos | Segredo de sessão, único por ambiente. |
| `CORS_ORIGINS` | todos | URLs exatas do cliente web. |
| `APP_URL` | todos | URL pública do cliente para links e e-mails. |
| `LOG_LEVEL` | todos | Nível de log. |
| `AI_PROVIDER_API_KEY` | conforme uso | Chave do provedor de IA, somente na API. |
| `DOCUMENT_STORAGE_*` | conforme provedor | Credenciais do armazenamento de arquivos. |

Segredos nunca entram no Git nem são enviados ao cliente.

## Processo de deploy

1. Pull request executa lint, typecheck, testes e migration dry-run.
2. Merge na branch de staging faz deploy no ambiente `staging`.
3. Smoke test chama `/health` e uma rota autenticada de baixo impacto.
4. Após validação, a mesma revisão é promovida para `production`.
5. O deploy só é considerado concluído quando o Railway reportar `SUCCESS` e o health check responder.

## Banco e migrations

- Schema Drizzle em `apps/api/src/db/schema.ts`.
- Mudança: schema → `drizzle-kit generate` → migration SQL versionada → revisão → dry-run no CI.
- Nunca usar `drizzle-kit push` em staging ou produção.
- Toda migration expansiva vem antes da alteração de código que depende dela; remoções entram em uma entrega posterior.
- Backups, retenção e capacidade serão revisados antes de colocar dados reais de clientes.

## Estado conhecido que inspira o plano

O projeto Jinvo ERP está saudável no Railway, com uma API Fastify em Docker e serviços PostgreSQL separados por ambiente. O Exporta Brasil adotará esse padrão, simplificado para duas aplicações do monorepo e sem trazer as partes desktop, fiscal ou offline do Jinvo.
