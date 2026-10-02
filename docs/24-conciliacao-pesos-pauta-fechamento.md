# Pesos, pauta e fechamento da importação

## Fluxo disponível

1. Em **Parametrizações → Produtos e pesos**, definir o desconto do peso bruto. O padrão é 6%. A API grava esse parâmetro no banco em `app_settings/product-defaults`.
2. Importar a planilha do cliente ou cadastrar produtos. Cada novo produto recebe uma cópia do percentual vigente; mudar a parametrização não modifica operações existentes.
3. Editar o produto para preencher **pauta** e **sobra**, ambas em USD/kg, e ajustar o desconto daquele produto.
4. Em **Estimativa de custos**, cadastrar o frete internacional, escolher **USD** e **Por peso**. O peso de referência usa a soma dos pesos líquidos, mas aceita ajuste explícito.
5. Na tabela **Produtos da importação**, abrir **Ver cálculo** para conferir os pesos, FOB/CFR e as memórias de impostos de entrada e saída. Os totais consolidados ficam em **Estimativa de custos**. PDF e XLSX incluem todos os produtos.

A planilha da Rose importa o percentual de cada linha, pauta, sobra, frete e peso de referência. O preço comercial recebido do cliente continua armazenado separadamente do FOB calculado pela pauta. A planilha final importa CIF e peso líquido informado, sem inventar um peso bruto ou aplicar desconto novamente.

## Fórmulas

| Resultado | Fórmula / origem |
| --- | --- |
| Peso bruto total | Peso por caixa × caixas; sem embalagens informadas, peso bruto unitário × quantidade |
| Peso líquido | Peso bruto total × (1 − desconto / 100) |
| P+S | Pauta + sobra, em USD/kg |
| FOB | P+S × peso líquido; sem pauta, quantidade × preço comercial unitário em USD |
| Frete do produto | Frete internacional em USD ÷ peso de referência × peso líquido |
| CFR | FOB + frete do produto |
| Bases tributárias | CFR convertido pelo câmbio da operação, acrescido do seguro quando informado |

Resultados calculados aparecem como texto. O desconto, a pauta, a sobra, o frete, as alíquotas e as demais premissas continuam editáveis. Um peso líquido histórico informado permanece preservado; para recalculá-lo a partir do bruto, preencher o desconto no produto.

## Conciliação das três planilhas fornecidas

Referência: `como-vem-do-cliente.xlsx`, `com-o-preenchimento-da-rose.xlsx` e `planilha-final-de-custos.xlsx`, anexadas nesta conversa.

- 135 linhas de produtos na preparação da Rose.
- Quantidade correta: **38.182 unidades**.
- Peso bruto: **19.329,714 kg**.
- Peso líquido, com os descontos da referência: **17.396,7426 kg**.
- FOB da pauta: **USD 35.507,247444**.
- Frete: **USD 8.000**.
- CFR total: **USD 43.507,247444**, igual à soma da coluna D da aba final por item.
- Câmbio do fechamento: **5,15 BRL/USD**.
- Custo da aba por item, Q54: **R$ 337.478,01**.
- Venda, T54: **R$ 357.726,69**.
- Tributos de saída líquidos: **R$ 35.951,62**.

Os testes conferem peso, FOB, frete e CFR de cada linha da Rose; no fechamento, conferem os tributos líquidos de cada produto e os totais do calculador. O motor mantém precisão interna e arredonda valores monetários apenas na apresentação.

Para repetir os valores originais, usar os percentuais existentes na planilha da Rose (10% nas linhas que contêm essa fórmula), e não substituir todos pelo novo padrão de 6%. A nova premissa gera um orçamento diferente de forma intencional.

## Divergências da referência

### M141 e P141 duplicam o subtotal

M138 e P138 já somam os produtos. M141 e P141 incluem essa linha novamente no intervalo. O arquivo apresenta 76.364 unidades e 38.659,428 kg brutos nessa segunda soma. O sistema soma somente produtos e usa os valores corretos acima.

### AFRMM aparece duas vezes na aba por item

B45 do FECHAMENTO inclui B30 (AFRMM, R$ 4.316). A coluna P da aba por item rateia B45 + B28, e a coluna O também rateia AFRMM separadamente. O importador preserva esses valores para reproduzir Q54 e informa a duplicação na revisão da planilha.

Para corrigir um novo orçamento, lançar AFRMM uma única vez e excluí-lo das outras despesas. Isso reduz o total em R$ 4.316 e altera acréscimo e tributos de saída. Não foi corrigido silenciosamente o orçamento importado.

### R54 inclui a taxa do cabeçalho

R54 soma R8:R53, incluindo o percentual 0,06 do cabeçalho. O acréscimo correto é a soma dos valores R9:R53; o sistema não soma uma taxa a um valor monetário. A diferença é R$ 0,06 em resultados que usam R54.

### E3 é um fechamento distinto do custo dos produtos

E3 do FECHAMENTO é R$ 165.300,04770037724 e soma B18 + B28 + B45 + E20 + D39. Não inclui o valor das mercadorias e inclui o acréscimo; Q54 inclui mercadorias e o AFRMM duplicado explicado acima. Portanto E3, Q54, T54 e “custo + tributos de saída” não são totais equivalentes.

O sistema mantém os nomes e componentes separados nas exportações, em vez de apresentar o valor E3 como custo total da importação. A definição de uma cobrança final ao cliente precisa considerar esses componentes e a duplicação identificada.
