# Exporta Brasil

Plataforma para gestão operacional e financeira de importações.

## MVP em execução

O primeiro fluxo já cobre a gestão de uma importação: criar operação, incluir produtos, informar câmbio e despesas, calcular rateio/II/IPI e atualizar o estágio da carga no porto. A interface foi criada em React 19 e responde a desktop e mobile.

```powershell
npm install
npm run dev
```

- Cliente: `http://localhost:5173`
- API: `http://localhost:3171/health`

## Ambiente de teste

- API Railway: [health check](https://exporta-brasil-production.up.railway.app/health) · [importações de demonstração](https://exporta-brasil-production.up.railway.app/api/imports)
- Cliente local: `http://localhost:5173`

O Railway possui um serviço de API e um PostgreSQL isolado. `DATABASE_URL` é resolvida internamente pelo Railway e não é armazenada no repositório.

Neste estágio, o cliente guarda os dados de demonstração no navegador e a API usa memória. A próxima etapa troca essas duas persistências temporárias por PostgreSQL com Drizzle, sem mudar os contratos do domínio.

## Dados operacionais oficiais

- A barra superior consulta a PTAX de compra e venda publicada pelo Banco Central e atualiza a cada 15 minutos.
- As notícias exibidas vêm do feed publicado pelo Siscomex, com prioridade para Importação.
- O cadastro de clientes valida CNPJ numérico e alfanumérico. Para preencher os dados cadastrais, configure as variáveis de `apps/api/.env.example` com o serviço oficial de consulta CNPJ contratado junto à Receita Federal. A chave fica somente na API.

## Documentação de base

- [Visão do produto](docs/01-visao-do-produto.md)
- [Análise da POC](docs/02-analise-da-poc.md)
- [Arquitetura alvo](docs/03-arquitetura-alvo.md)
- [Modelo de domínio e dados](docs/04-modelo-de-dominio.md)
- [Plano de entrega](docs/05-plano-de-entrega.md)
- [Plano Railway](docs/06-plano-railway.md)
- [Sistema de design](DESIGN.md)
- [Workflow de design com Impeccable](docs/07-workflow-impeccable.md)
- [Plano de execução](docs/08-plano-execucao.md)
- [Integração Siscomex e portos](docs/09-integracao-portal-unico-e-portos.md)


### Sessões

Defina `AUTH_SECRET` com uma sequência aleatória longa no ambiente da API, especialmente no Railway. A mesma chave mantém as sessões válidas entre reinicializações do serviço.
