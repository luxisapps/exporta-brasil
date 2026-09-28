# Integração com Portal Único Siscomex e dados de portos

## Decisão

Usaremos duas fontes com responsabilidades separadas:

1. **ANTAQ/Infra S.A.** para um catálogo público de instalações portuárias brasileiras.
2. **Portal Único Siscomex** para dados operacionais de uma importação quando o cliente autorizar o acesso e possuir o perfil exigido.

O Portal Único não deve ser tratado como uma API aberta de rastreamento geral de navios ou contêineres. Os serviços representam atos e consultas aduaneiras de intervenientes habilitados.

## Fonte pública de portos

A camada oficial de Instalações Portuárias da Infra S.A., com dados da ANTAQ, expõe consulta em JSON e GeoJSON:

- Serviço: `https://geo.infrasa.gov.br/server/rest/services/Hosted/Instalações_portuárias/FeatureServer/0`
- Campos úteis: `nome`, `tipo`, `uf`, `municipio`, `hidrovia`, `situacao`, `gestao` e geometria.
- Tipos identificados: Porto Organizado, Terminal de Uso Privado, ETC e IP4.
- Atualização informada pela camada: trimestral.

### Uso no produto

- Criar a tabela `port_facilities` no PostgreSQL.
- Executar job semanal de sincronização, mantendo fonte, data de coleta e o payload original para auditoria.
- No formulário de importação, trocar o campo livre por busca e seleção de instalação. Permitir texto livre somente com justificativa quando o destino não existir no catálogo.
- Exibir tipo, município, UF e coordenadas no detalhe da operação.

Esse catálogo serve para padronizar destino e localizar a operação. Ele não representa a situação individual de uma carga.

## Portal Único Siscomex

O Portal documenta a API REST para integração de sistemas privados e órgãos intervenientes. Apesar de a seção se chamar "API Pública", o acesso às operações depende de perfil autorizado e autenticação.

### Acesso e credenciais

- Perfis privados incluem, entre outros, Declarante Importador/Exportador, Depositário, Operador Portuário, Agente de Carga e Transportador.
- O usuário final gera o par de chaves pelo Portal com certificado digital, restringe os perfis e define expiração/revogação.
- A credencial permite que nosso sistema atue com o perfil do titular da chave. Ela nunca deve ir ao navegador ou ao banco sem criptografia.
- O ambiente de Validação das Empresas é o local inicial de desenvolvimento; produção e validação são URLs distintas. A homologação é restrita a autorizados.
- Existem limites por funcionalidade e bloqueios progressivos quando o limite horário é excedido.

### Escopo útil para importação marítima

O CCT Importação — Modal Aquaviário cobre operações de carga como recepção, entrega, desunitização e consulta de estoque. A consulta de estoque usa DUIMP e/ou CE Mercante e só expõe dados quando a carga está sob responsabilidade do interveniente. Portanto, ela pode alimentar marcos aduaneiros e de estoque para clientes habilitados, mas não substitui o rastreamento do armador, do terminal ou de AIS.

Não devemos automatizar operações de escrita — recepção, entrega e desunitização — na primeira integração. Elas produzem efeitos operacionais e precisam de fluxo explícito, autorização e auditoria.

## Arquitetura proposta

```text
Cliente web
  └── API Exporta Brasil
        ├── port_facilities (catálogo ANTAQ sincronizado)
        ├── port_events (marcos internos e fontes externas)
        └── siscomex connector
              ├── cofre de credenciais cifradas por organização
              ├── cliente HTTP, token e limite de chamadas
              ├── consultas CCT/DUIMP autorizadas
              └── trilha de auditoria de requisição, resposta e consentimento
```

### Regras de segurança

- Credenciais Siscomex são associadas à organização e ao CNPJ autorizado, com data de expiração e revogação.
- Criptografia de aplicação antes de persistir no PostgreSQL; chave mestra somente nas variáveis seguras do Railway.
- Todas as chamadas passam pela API Fastify. O React recebe apenas dados normalizados.
- Rate limit interno, fila para sincronizações e backoff para respostas de limite.
- Registrar finalidade, usuário solicitante, perfil usado, identificador da operação e hash do payload; mascarar dados pessoais e segredos nos logs.

## Entrega recomendada

1. Sincronizar o catálogo ANTAQ e usar a seleção de porto/instalação na criação da operação.
2. Criar `port_events` para marcos manuais, com fonte e horário.
3. Criar o conector Siscomex somente após termos autenticação, organizações e cofre de segredos.
4. Fazer uma prova de conceito no ambiente de Validação com um cliente habilitado e uma DUIMP/CE Mercante permitida.
5. Implementar primeiro a consulta de estoque; avaliar operações de escrita separadamente com fluxo de aprovação.

## Fontes oficiais

- Portal Único Siscomex: https://docs.portalunico.siscomex.gov.br/
- Controle de Carga de Importação — Aquaviário: https://docs.portalunico.siscomex.gov.br/api/cctr/aquaviario/swagger-53d41de6.html
- Chaves de acesso: https://docs.portalunico.siscomex.gov.br/pages/chaves-acesso/
- Ambientes: https://docs.portalunico.siscomex.gov.br/ambientes/
- Instalações Portuárias ANTAQ/Infra S.A.: https://geo.infrasa.gov.br/server/rest/services/Hosted/Instalações_portuárias/FeatureServer/0?f=pjson
