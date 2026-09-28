# Modelo de domínio e dados

## Isolamento e acesso

```text
Organization 1---n Membership n---1 User
Organization 1---n Customer
Organization 1---n ImportOperation 1---n ImportItem
Customer     1---n ImportOperation
```

Uma organização é a empresa que usa o sistema. Um cliente é a empresa atendida em uma importação. Se o sistema inicialmente for interno a uma única importadora, o mesmo modelo ainda permite abrir o portal do cliente depois sem migração estrutural.

## Agregado de operação

`ImportOperation` representa o processo principal. Ele inclui referência interna, cliente, fornecedor principal, Incoterm, moeda, datas, status, responsáveis e dados de transporte. Os itens pertencem à operação e não podem ser alterados depois do fechamento sem criar uma revisão.

Estados propostos:

```text
draft → documentation → classification → costing → clearance → arrival → closing → completed
  └──────────────────────────────────────────────────────────────────────→ cancelled
```

As transições serão verificadas no servidor e gerarão eventos de auditoria.

## Entidades principais

| Entidade | Responsabilidade |
| --- | --- |
| `import_operations` | Processo, status, partes envolvidas, transporte e cronograma. |
| `import_items` | Produto, SKU do fornecedor, medidas, quantidade, valores e classificação aprovada. |
| `operation_documents` | Arquivo, tipo, origem, checksum, revisão, vínculo e permissões. |
| `packing_list_imports` | Arquivo original, dados extraídos, erros, revisão e confirmação. |
| `ncm_candidates` | Sugestões manuais ou por IA, fonte, justificativa, confiança e dados de consulta. |
| `ncm_approvals` | Decisão, responsável, data e motivo da aprovação ou rejeição. |
| `exchange_rates` | Cotação, moeda, data de referência, fonte e valor usado. |
| `cost_scenarios` | Premissas de câmbio, impostos, despesas e resultado calculado versionado. |
| `operation_expenses` | Frete, seguro, taxas, armazenagem, honorários e demais despesas. |
| `expense_allocations` | Rateio de cada despesa aos itens, critério e valor resultante. |
| `tasks` | Pendências, prazo, responsável e conclusão. |
| `audit_events` | Quem alterou o quê, antes/depois, correlação e data. |

## Cálculo de custos

O custo será calculado a partir de um cenário imutável. Cada cenário registra:

- Itens e valores de origem usados.
- Taxa de câmbio e data de referência.
- Perfil tributário e suas alíquotas.
- Despesas informadas e critério de rateio.
- Arredondamentos e versão do motor de cálculo.
- Resultado por item e total da operação.

O sistema deve permitir comparar cenários. Ao aprovar um cenário de fechamento, ele torna-se a referência da operação e seus valores deixam de ser recalculados de forma silenciosa.

## Dados de referência

NCM, tabelas tributárias e câmbio precisam de fonte, vigência e atualização controlada. A primeira versão pode cadastrar esses dados manualmente ou importar arquivos oficiais validados. Integrações externas entram após definir a fonte oficial e os critérios de atualização.
