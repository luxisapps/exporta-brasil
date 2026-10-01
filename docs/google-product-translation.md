# Tradução de produtos das planilhas

O nome original em chinês é preservado em `chineseName`. O campo `name` passa a conter a tradução em português. Nomes já fornecidos em português são mantidos.

## Fluxo

1. O navegador extrai a planilha em um Worker.
2. Os nomes chineses únicos seguem para `POST /api/products/translate-names`, autenticado, em lotes de até 50 nomes e 10 mil caracteres.
3. A API procura os nomes em `product_name_translations`, no PostgreSQL do Railway.
4. Apenas os nomes ausentes são enviados ao Google Cloud Translation Basic, modelo NMT, como texto simples, de chinês para português.
5. A tradução validada é gravada no banco. Um bloqueio de transação impede chamadas duplicadas para ausências concorrentes. O cache não depende da memória da API nem do navegador.
6. A prévia mostra português e original chinês. O formulário permanece bloqueado até concluir leitura e tradução. Uma falha impede confirmar uma importação parcialmente traduzida; selecione a planilha novamente para tentar de novo. Lotes já concluídos ficam no cache.

O cache usa o texto completo, incluindo modelos e medidas, mais idiomas e provedor. Ele é compartilhado pela empresa. Corrigir o nome de um produto na operação não altera automaticamente o cache das demais importações.

## Configuração necessária

1. No Google Cloud, selecione ou crie o projeto que utilizará a tradução.
2. Ative o faturamento e a **Cloud Translation API**.
3. Crie uma chave de API e restrinja seu acesso à Cloud Translation API.
4. No serviço da API no Railway, adicione `GOOGLE_TRANSLATE_API_KEY` com essa chave. Não adicione a chave no client nem em variáveis `VITE_*`.
5. Após o redeploy, importe uma planilha chinesa. Importe novamente os mesmos nomes para confirmar o reaproveitamento.

A chave do Gemini não é reutilizada automaticamente. Nenhuma chamada ao Google é necessária quando todos os nomes já estão no cache.

## Exportação e compatibilidade

O XLSX de fechamento inclui o nome original em uma coluna adicional na aba de itens e custos. O PDF usa o nome em português; sua fonte atual não suporta caracteres chineses. Operações antigas não são traduzidas automaticamente nesta mudança.

## Validação

Testes cobrem deduplicação, reaproveitamento do cache, concorrência, falhas sem contaminar o cache, associação correta entre linhas, divisão em lotes e preservação dos dados originais. A chamada real ao Google requer a configuração acima.

Referência: https://docs.cloud.google.com/translate/docs/translate-text
