# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React 19 for the client. The routing and build tool remain open until the application scaffold is created.

## Users

- Coordenadores e analistas de importação que precisam conduzir processos, documentos, classificações e custos.
- Financeiro e administradores que precisam acompanhar despesas, aprovações, acessos e resultado da operação.
- Clientes e consultores externos terão acesso limitado aos processos autorizados.

## Product Purpose

O Exporta Brasil centraliza a gestão de importações, desde a cotação e documentação até o desembaraço, composição do custo e fechamento. O sucesso é uma operação rastreável, sem planilhas paralelas e com dados claros para cada responsável.

## Positioning

O produto conecta documentos, itens, classificação, premissas de custo, aprovações e fechamento em uma única linha de auditoria por operação.

## Operating Context

O trabalho acontece predominantemente em monitores de escritório, com uso complementar no celular para acompanhar prazos, pendências, aprovações e o estado de uma operação. Os fluxos lidam com packing lists, planilhas XLSX, fornecedores, NCM, câmbio, despesas e documentos vinculados a importações.

## Capabilities and Constraints

- A primeira versão inclui organizações, permissões, operações, itens, documentos, packing list, classificação NCM assistida, cenários de custo, exportação XLSX, painel e auditoria.
- Sugestões por IA são assistivas e exigem revisão humana antes de se tornarem uma classificação ou dado de fechamento.
- O cliente consome uma API; ele não acessa o banco diretamente.
- A aplicação deve funcionar de 375px a monitores amplos, com prioridade para tarefas essenciais no mobile.
- O sistema precisa sustentar tabelas, filtros, formulários extensos e comparação de cenários sem perder legibilidade.

## Brand Commitments

- Nome: Exporta Brasil.
- Direção visual confirmada: glassmorphism contido, dark mode OLED e linguagem de confiança e autoridade.
- O produto deve comunicar rigor operacional e transparência, sem parecer uma ferramenta de trading, entretenimento ou ficção científica.

## Evidence on Hand

- A POC em `C:\Users\lucas\AppData\Local\Temp\exporta-brasil-poc-032d40e4` demonstra operações, packing list, NCM, simulação de custo e XLSX.
- Os documentos em `docs/` registram escopo, domínio, arquitetura e plano de entrega.
- Ainda não há logotipo, fotografia, clientes, métricas ou depoimentos aprovados para uso na interface.

## Product Principles

1. Cada número importante deve mostrar sua origem e contexto.
2. A interface reduz incerteza antes de acelerar a ação.
3. O sistema revela complexidade por etapas, sem escondê-la.
4. Dados operacionais são escaneáveis no desktop e acionáveis no mobile.
5. Uma sugestão automatizada nunca se apresenta como uma decisão aprovada.

## Accessibility & Inclusion

O produto adotará WCAG 2.2 AA como padrão mínimo: contraste suficiente, navegação por teclado, foco visível, rótulos em campos, estados que não dependem apenas de cor e redução de movimento quando solicitada.
