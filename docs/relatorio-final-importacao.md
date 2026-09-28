# Relatório final de importação

## Fontes analisadas

- `planilha1-produtos.xlsx`: packing list, composição comercial e rateio do frete.
- `planilha2-tributos.xlsx`: fechamento financeiro, tributos, despesas e preço por item.

Os arquivos representam um fluxo em duas etapas. A primeira consolida os produtos e o custo de chegada. A segunda estima tributos, despesas posteriores e preço de venda. O sistema deve manter essa separação para que cada valor tenha origem e momento de confirmação claros.

## Etapa 1: produtos e custo de chegada

O packing list usa, por item:

- referência, descrição original e descrição comercial;
- NCM, material, observações e variações de cor;
- caixas, quantidade por caixa e quantidade total;
- peso líquido, peso bruto, dimensões e cubagem;
- preço unitário de composição, FOB e frete internacional rateado;
- CFR e custo CFR unitário.

Relações encontradas no arquivo:

1. Quantidade total = caixas × quantidade por caixa.
2. FOB = preço de composição × peso líquido.
3. Frete internacional é distribuído proporcionalmente ao peso líquido total.
4. CFR = FOB + frete rateado.
5. CFR unitário = CFR ÷ quantidade total.

O app já possui quantidade, NCM, preço unitário em USD, peso bruto, II e IPI. Para reproduzir o modelo oficial sem perda de informação, faltam peso líquido, embalagem, dimensões/cubagem, material, descrição comercial e base de preço por item.

## Etapa 2: fechamento e estimativas

O arquivo de fechamento organiza a operação em cinco blocos.

| Bloco | Campos identificados |
| --- | --- |
| Dados da operação | Processo, BL, DI, taxa de câmbio, FOB USD, frete USD, CIF USD e CIF em reais. |
| Tributos de entrada | II, IPI, PIS, COFINS e taxa Siscomex. |
| Despesas de desembaraço | THC, ISPS, liberação de BL, desconsolidação, drop off, handling, courier e demurrage. |
| Despesas portuárias e entrega | AFRMM, S.D.A., retificação de DI, honorários, laboratório, envio de documentos, escolta, frete de entrega, armazenagem, desoneração, GNRE e taxas da importadora. |
| Projeção de venda | IRPJ, CSLL, ICMS, margem, NF de entrada, NF de saída, total de unidades e valor de venda. |

O custo por item distribui AFRMM e despesas por peso líquido. Depois calcula impostos de entrada, custo de compra, margem, valor de venda e impostos de saída por produto.

## Regras que precisam ser parametrizadas

As planilhas usam alíquotas e fórmulas que não podem ser tratadas como regras universais. O sistema deve registrar a versão das premissas aplicada à estimativa:

- alíquotas de II e IPI por NCM;
- PIS, COFINS e ICMS, com origem, destino, regime tributário e benefícios;
- taxa Siscomex e AFRMM;
- margem comercial;
- despesas de desembaraço, portuárias, entrega e honorários;
- base de rateio: peso líquido, FOB, quantidade ou regra específica;
- data, responsável e motivo de cada ajuste manual.

Até essas premissas estarem configuradas, o relatório deve identificar os valores como **estimativas** e não apresentar tributos ausentes como zero confirmado.

## Inconsistências encontradas nos arquivos

- `FECHAMENTO!D37` contém uma referência quebrada (`#REF!`).
- `PREÇO POR ITEM` contém 61 erros `#DIV/0!`, causados por linhas reservadas sem quantidade.

O importador deve ignorar linhas vazias, apontar referências inválidas e exigir quantidade maior que zero antes de calcular custo unitário. Não devemos copiar esses erros para o novo modelo.

## Tela de relatório final

A tela ficará dentro do detalhe da operação e terá quatro áreas:

1. **Resumo da operação**: cliente, fornecedor, porto, contêiner, ETA, canal aduaneiro e data da estimativa.
2. **Custo de chegada**: FOB, câmbio, frete, seguro, despesas portuárias, impostos e custo total projetado.
3. **Detalhamento por produto**: NCM, quantidade, peso, FOB, rateios, impostos, custo total e custo unitário.
4. **Premissas e pendências**: valores estimados, valores confirmados, origem do dado e campos ainda necessários.

## Exportações

As duas exportações devem ser geradas a partir do mesmo retrato da operação, identificado por data e hora.

- **XLSX**: abas `Relatório final`, `Custo por item` e `Premissas`. O arquivo preserva fórmulas onde o usuário precisar continuar trabalhando no Excel.
- **PDF**: versão paginada, com resumo financeiro, totais, tabela de itens e premissas aplicadas. Campos longos e tabelas extensas continuam em páginas seguintes com cabeçalho repetido.

## Sequência de implementação

1. Ampliar o cadastro de item e a estrutura de custos com os campos do packing list.
2. Criar a área de premissas da operação e o cálculo auditável de rateios e tributos.
3. Implementar a tela de relatório final no detalhe da operação.
4. Gerar XLSX e PDF a partir do mesmo modelo de relatório.
5. Validar os totais contra uma operação oficial conhecida antes de liberar o uso operacional.
