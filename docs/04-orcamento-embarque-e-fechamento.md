# Orçamento, embarque e fechamento de importação

## Decisão de produto

Uma operação terá três camadas independentes:

1. **Solicitação do cliente**: itens e dados de embalagem recebidos em planilha.
2. **Orçamento**: uma ou mais versões calculadas. A versão aprovada é bloqueada e vira a referência comercial.
3. **Embarque e realizado**: confirmação de compra, embarque, chegada e despesas reais. Nenhum valor realizado altera o orçamento aprovado; o sistema mostra a variação.

O status operacional continua descrevendo a carga. O status financeiro descreve o orçamento e as despesas. Uma operação pode ter orçamento aprovado sem estar embarcada, ou estar embarcada com despesas reais ainda pendentes.

## Fluxo

```mermaid
flowchart LR
  A[Planilha do cliente] --> B[Produtos importados]
  B --> C[Orçamento em rascunho]
  C --> D[Orçamento aprovado e bloqueado]
  D --> E[Compra confirmada]
  E --> F[Embarcado]
  F --> G[Chegada e desembaraço]
  G --> H[Fechamento realizado]
  D -. comparação .-> H
```

## Dados de produto

### Recebidos do cliente ou fornecedor

- Foto, nome original, nome comercial e descrição em inglês.
- SKU do fornecedor.
- NCM/HS, sujeito a validação e classificação humana.
- Comprimento, largura, altura da caixa e peso por caixa.
- Unidades por caixa, número de caixas e quantidade.
- Preço unitário em USD.
- Indicadores: drawback/retorno de imposto, certificação, bateria, Bluetooth, tomada e observações.
- Prazo de produção e status de compra.

### Calculados e bloqueados

- Volume por caixa: `comprimento × largura × altura / 1.000.000`.
- Quantidade: `unidades por caixa × número de caixas`.
- Peso total: `peso por caixa × número de caixas`.
- Volume total: `volume por caixa × número de caixas`.
- FOB total em USD: `preço unitário × quantidade`.
- FOB em BRL: `FOB em USD × câmbio`.
- Rateios, tributos, custo total e custo unitário.

O usuário não edita os resultados. A tela informa a fórmula e os insumos que originaram cada valor.

## Perfil tributário por item

Cada item terá um perfil tributário versionado, com origem e data de vigência:

| Campo | Origem prioritária | Pode alterar? |
|---|---|---|
| II e IPI | consulta oficial por NCM, quando disponível | Sim, com justificativa |
| PIS e COFINS-importação | regra oficial ou padrão configurado | Sim, com justificativa |
| ICMS-importação | UF de destino, regime e benefício fiscal | Sim, com justificativa |
| AFRMM | modal, frete, hipóteses legais e perfil operacional | Sim, com justificativa |
| Taxa Siscomex | tabela vigente por declaração/item | Sim, com justificativa |
| PIS, COFINS, IPI, ICMS, CSLL, IRPJ e adicional na saída | perfil fiscal de venda | Sim, com justificativa |

Uma alíquota nunca será considerada “definitiva” apenas por NCM. Regime tributário, origem, acordo comercial, ex-tarifário, benefício fiscal, UF, modal, tipo de operação e data de vigência podem alterar o cálculo. A consulta oficial abastece a sugestão; o perfil salvo e seus overrides tornam o orçamento auditável.

## Fórmulas observadas nas planilhas atuais

### Entrada

- II: `FOB em BRL × alíquota II`.
- IPI: `(FOB em BRL + II) × alíquota IPI`.
- PIS-importação: `FOB em BRL × alíquota PIS`.
- COFINS-importação: `FOB em BRL × alíquota COFINS`.
- Taxa Siscomex: rateio por peso líquido.
- AFRMM e despesas portuárias: rateio por peso líquido na planilha atual.
- Custo do item: `FOB BRL + II + IPI + PIS + COFINS + taxa Siscomex + AFRMM rateado + despesas rateadas`.

### Saída

- Margem: `custo do item × alíquota de margem`.
- Venda total: `custo do item + margem`.
- Venda unitária: `venda total / quantidade`.
- PIS, COFINS e IPI na saída: imposto de venda menos crédito de entrada adotado pela planilha.
- ICMS: `venda total × alíquota ICMS`.
- CSLL, IRPJ e adicional: base de margem multiplicada pelas respectivas alíquotas.

A implementação deverá manter cada fórmula como regra testada e identificada. Quando a regra fiscal correta exigir outra base, a regra será substituída por uma versão de cálculo, sem alterar fechamentos históricos.

## Custos de operação

### Orçados

Câmbio, frete internacional, seguro, THC destino, ISPS, liberação de BL, desconsolidação, drop off, handling, courier, demurrage previsto, AFRMM, SDA, retificação de DI, honorários, laboratório, envio de documentos, escolta, frete de entrega, armazenagem, taxa de desoneração, GNRE antecipação, taxas da importadora e custo financeiro.

### Realizados

Cada lançamento terá categoria, fornecedor, documento, vencimento, valor previsto, valor aprovado, valor contratado, valor faturado, valor pago, moeda, câmbio aplicado e vínculo a arquivo. O comparativo exibirá valor aprovado, realizado e variação absoluta/percentual.

## Parametrizações

A nova área de sidebar será **Parametrizações**.

### Entrada

- Perfis tributários por NCM, UF, regime, origem e vigência.
- Taxa Siscomex vigente e unidade de rateio.
- AFRMM e regras de aplicação.
- Modal e regra de rateio de frete, seguro e despesas.
- Custos padrão por porto, terminal, despachante e importadora.
- Câmbio padrão e fonte de cotação.

### Saída

- Margem padrão por cliente, categoria e operação.
- PIS, COFINS, IPI, ICMS, CSLL, IRPJ e adicional.
- Base de cálculo e crédito dedutível para cada tributo.
- UF, regime fiscal e vigência.

### Governança

- Valores padrão só preenchem novas versões de orçamento.
- Toda alteração possui autor, data, vigência e motivo.
- Fechamentos e orçamentos aprovados usam um snapshot das parametrizações.

## Integração Siscomex

A API do Portal Único é adequada como fonte oficial de apoio para classificação, Catálogo de Produtos e Tratamento Tributário, mas requer integração autenticada e parâmetros completos da operação. O sistema não deve prometer uma “alíquota única por NCM”.

Fase 1: cadastro manual/versionado e importação de tabelas oficiais.

Fase 2: conector Siscomex para sugerir tratamento tributário, requisitos e atributos, registrando a fonte, a consulta e a data.

Fase 3: reconciliação de valores com a DUIMP e com o fechamento realizado.

## Ordem de implementação

1. Expandir o domínio com versões de orçamento, status de embarque, despesas e perfis tributários.
2. Substituir o formulário simples de item pelo produto detalhado e pelo painel de cálculos bloqueados.
3. Melhorar o importador de planilha para os cabeçalhos em chinês/inglês/português e imagens quando disponíveis.
4. Criar a tela de orçamento: resumo, itens, rateios, impostos e aprovação/bloqueio.
5. Criar a tela de embarque e realizado: despesas, documentos e variação contra o orçamento.
6. Criar Parametrizações com auditoria e vigência.
7. Conectar Siscomex em ambiente de validação, depois de obter certificado, credenciais e casos reais para homologação.
