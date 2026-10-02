# Plano: preço por item e fechamento da importação

Referência: `planilha-final-de-custos.xlsx`, abas PREÇO POR ITEM e FECHAMENTO.

## Etapas e critérios de aceite

1. **Motor de cálculo versionado.** Preservar o modelo existente nas operações antigas. Novos orçamentos usam o modelo da planilha; a troca em rascunhos é explícita. Aprovações existentes não mudam de modelo automaticamente.
2. **Bases e pesos.** Registrar peso líquido total por produto; distinguir preço FOB e CIF. Classificar frete, seguro, Siscomex, AFRMM e demais despesas. Em CIF, frete/seguro já embutidos não são somados novamente. Siscomex e AFRMM são valores monetários do processo, nunca percentuais aplicados ao produto.
3. **Entrada.** Converter USD em BRL, calcular II, IPI, PIS e COFINS, distribuir Siscomex/AFRMM pelo peso líquido e despesas pelo critério escolhido. Mostrar alertas quando faltar uma base de rateio; não atribuir peso bruto como líquido.
4. **Venda e saída.** Permitir acréscimo sobre custo (regra da planilha) ou margem sobre venda (regra atual). Calcular venda unitária/total, débitos, créditos de entrada e saldo de PIS/COFINS/IPI; ICMS sobre venda e CSLL/IRPJ/adicional sobre o acréscimo, exatamente como na referência.
5. **Interface.** Visão paginada Preço por item com pesquisa e seções Base, Entrada, Venda e Saída. Resultados são somente leitura; alíquotas são editáveis no produto e herdadas das parametrizações quando não há alteração individual.
6. **Importação de produtos.** Reconhecer a aba PREÇO POR ITEM: peso líquido total, USD total dividido pela quantidade, NCM no nome, alíquotas fracionárias e CIF. Trazer as premissas do FECHAMENTO apenas após informar ao usuário, sem substituir automaticamente um orçamento existente.
7. **Relatórios.** Usar o mesmo motor na tela, PDF e Excel. Exportar bases/pesos, entrada, venda, saída, créditos, ajustes, taxas e metodologia; manter CNY/USD indicativos.
8. **Conferência.** Comparar os 40 produtos (45 linhas, cinco sem quantidade) e seus resultados intermediários com os valores armazenados no arquivo, com tolerância de arredondamento. Testar FOB/CIF sem duplicação, pesos ausentes, créditos negativos, quantidade zero, margens e preservação do legado. Verificar persistência dos novos campos e layouts desktop/mobile.

## Regras e limites deliberados

- O modelo reproduz a planilha fornecida; não representa uma apuração fiscal universal. O adicional IRPJ da referência incide sobre o acréscimo sem faixa de isenção; isso será identificado na metodologia, não tratado como regra legal automática.
- ICMS de importação não aparece nas fórmulas de entrada da referência. Sua parametrização permanece identificada como não aplicada nesse modelo; não será criada uma fórmula fiscal presumida.
- Nenhuma consulta ao Siscomex ou alíquota oficial é inventada. A origem das alíquotas continua registrada.
- No arquivo, a soma dos valores USD por produto corresponde ao CIF, não ao FOB. Não somar novamente o frete do FECHAMENTO.
- A planilha FECHAMENTO contém referência externa em uma célula. A conferência deve usar as fórmulas internas de PREÇO POR ITEM e registrar essa diferença de origem.
- Valores antigos e aprovações permanecem no modelo anterior até uma alteração explícita em orçamento não aprovado.

## Acompanhamento

- [x] Motor e tipos
- [x] Dados e importação
- [x] Interface e alíquotas
- [x] PDF/Excel e relatórios
- [x] Testes contra a planilha, build e publicação

## Como testar

1. Crie uma operação: novos orçamentos usam **Modelo da planilha**.
2. Em **Estimativa de custos**, escolha FOB ou CIF e a regra de venda. Para uma operação antiga em rascunho, troque explicitamente o modelo; os cálculos anteriores são mantidos até essa escolha. Modelos aprovados não são trocados pela interface.
3. No produto, informe **peso líquido total (kg)** e edite as alíquotas de entrada/saída. Cada alíquota usa a parametrização da versão do orçamento ou uma alteração individual, inclusive zero.
4. Lance despesas, identificando seu tipo. Siscomex e AFRMM são valores monetários com rateio por peso líquido; em CIF, frete/seguro internacionais já incluídos não são somados novamente.
5. Para importar a planilha de fechamento, selecione **Aplicar câmbio, margem e despesas da planilha**. Essa opção aparece apenas ao criar uma operação ou importar para um orçamento vazio e não aprovado. Importar só produtos mantém suas premissas atuais e mostra alerta se a base CIF precisar ser selecionada.
6. Consulte **Preço por item**, com pesquisa, paginação de dez itens e visões Base, Entrada, Venda e Saída. Os resultados são somente leitura; **Editar produto** altera suas entradas e alíquotas.
7. Resolva os alertas de cálculo antes de aprovar. Venda e saída ficam sem resultado final quando faltam dados de rateio ou a margem é inválida.
8. Exporte PDF/XLSX: resumo primeiro, todos os itens, bases/pesos, taxas, venda, créditos e impostos de saída em seções próprias. Os relatórios de custos da carteira incluem essas seções também.

## Evidências e divergências da referência

- A referência possui **40 produtos com quantidade**, mais cinco linhas vazias. A conferência usa os valores armazenados no arquivo em todos os cálculos intermediários disponíveis, com tolerância de R$ 0,01.
- Custo total: **R$ 337.478,01**; venda: **R$ 357.726,69**; acréscimo correto: **R$ 20.248,68**; saída líquida: **R$ 35.951,62**.
- A fórmula **R54 = SUM(R8:R53)** inclui indevidamente a alíquota de 6% (R8), acrescentando R$ 0,06 ao subtotal. O sistema soma somente os produtos.
- A coluna D já contém CIF, incluindo o frete internacional de USD 8.000. O valor total em USD é convertido para preço unitário ao importar.
- E3 do FECHAMENTO não é o custo total dos produtos: tem outra composição e depende de referência externa. O sistema identifica separadamente custo de entrada, venda e saída líquida, sem presumir valor a pagar à empresa.
- Adicional IRPJ: a planilha usa 20% sobre o acréscimo. É um parâmetro operacional editável, não a regra fiscal geral. A [Receita Federal](https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/tributos/IRPJ) descreve adicional de 10% sobre o excedente de R$ 20 mil por mês. Revisão contábil necessária antes de tratar o orçamento como apuração fiscal.
- Novos campos são opcionais e persistidos no JSONB das operações pelo fluxo existente, sem migração destrutiva de dados.
- Interface conferida no desktop e em viewport de 390 px, com rolagem horizontal restrita às tabelas/despesas. PDF renderizado e Excel conferido em células numéricas.

## Entrega

- 38 testes passaram (toda a suíte web), incluindo sete testes novos de preço por item, referência Excel, preservação do legado e exportações.
- Build do monorepo passou. O aviso de tamanho dos módulos de exportação já existentes permanece; eles são carregados sob demanda.
- Publicado na Vercel: https://exporta-brasil-gamma.vercel.app
- API no Railway: https://exporta-brasil-production.up.railway.app; health retornou status ok.
- Pendente operacional: validar o modelo tributário com o contador, especialmente ICMS de entrada e adicional IRPJ. Integração autenticada Siscomex permanece fora desta entrega.


## Atualização — 1 de outubro de 2026: cálculo único

O sistema está em beta. Todas as operações passam a usar as fórmulas da planilha da empresa, inclusive registros criados antes da implementação. Não existe seletor de modelo nem de regra de venda: o preço é custo × (1 + acréscimo percentual / 100). Metadados antigos de modelo/margem são aceitos na leitura, mas não escolhem outro motor. Os dados existentes não foram excluídos. Os totais das operações antigas podem mudar para refletir as bases CIF e a regra de acréscimo.

FOB/CIF permanece uma premissa comercial explícita para evitar duplicar frete/seguro. Base, tributos e preço sugerido mostram suas fórmulas junto aos resultados. A composição por produto e os relatórios PDF/XLSX usam o mesmo cálculo central. Despesas por peso usam peso líquido total; nenhum peso é inventado para completar registros antigos.
