# Análise da POC

## O que a POC já demonstra

A POC é uma aplicação Next.js com React, TypeScript e Tailwind. Ela combina interface, rotas de API e acesso ao Supabase no mesmo projeto. O núcleo de negócio identificado é:

- Operações de importação com status, contêiner, FOB, frete, seguro, câmbio e datas.
- Itens por operação, com quantidade, peso, preço em USD, NCM e alíquotas.
- Leitura de packing list XLSX, com extração assistida pelo Gemini e validações de quantidade e peso.
- Sugestão de NCM pelo Gemini a partir do produto e descrição.
- Simulador de tributos e preço de venda.
- Exportação de fechamento em XLSX.

## Elementos que devem ser preservados

| Fluxo | Como reaproveitar na versão real |
| --- | --- |
| Operação e itens | Converter em agregados de domínio, com histórico e estados controlados. |
| Packing list | Manter upload e revisão em tabela antes da confirmação dos itens. |
| NCM | Manter a assistência por IA, acrescentando fontes, confiança, revisão e aprovação humana. |
| Simulação de custos | Transformar em um motor de cenários versionados no servidor. |
| XLSX | Preservar importação e exportação como interfaces de trabalho da equipe. |

## Limites da POC

| Área | Situação encontrada | Decisão para o produto |
| --- | --- | --- |
| Segurança | O cliente acessa o Supabase diretamente e as políticas permitem leitura e escrita para todos. | Apenas a API acessará o banco; autenticação, autorização e escopo serão obrigatórios. |
| Multiempresa | Não há organização, cliente, membro ou isolamento de dados. | Todas as entidades de negócio terão `organization_id`; operações também terão o cliente atendido. |
| Cálculos | Fórmulas e taxas estão no frontend, com valores fixos. | Cálculo no servidor, parâmetros versionados e resultado imutável por cenário. |
| NCM | A IA sugere o código e enfatiza redução tributária. | A IA será assistiva. A aprovação exigirá responsável, justificativa e evidência. |
| Documentos | Não há armazenamento, versionamento nem vínculo formal do arquivo à operação. | Arquivos terão metadados, checksum, permissões e vínculo com a operação ou item. |
| Auditoria | Alterações e exclusões não geram trilha de auditoria. | Eventos de domínio e registro de auditoria serão obrigatórios para dados críticos. |
| Qualidade | Não há camadas separadas para regras, validação ou testes do domínio. | API organizada por módulos, contratos compartilhados e testes de regras de custo. |

## Pontos que exigem validação de negócio

- Quais regimes tributários, estados de desembaraço e tipos de operação precisam entrar na primeira versão.
- Qual regra de rateio é usada hoje: valor FOB, peso, quantidade, volume ou uma combinação configurável.
- Quais documentos precisam ser obrigatórios em cada etapa.
- Quem aprova NCM, custos e encerramento.
- Se a empresa opera para vários clientes externos, empresas do mesmo grupo ou ambos.

## Conclusão

A POC é uma boa referência de linguagem de produto e jornada inicial. A implementação real deve recomeçar com uma API central, banco PostgreSQL próprio, controle de acesso, rastreabilidade e regras de cálculo testadas.
