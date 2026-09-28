# Visão do produto

## Propósito

O Exporta Brasil será a plataforma operacional de uma empresa que gerencia importações. Ela organizará cada processo desde a cotação e a documentação até o desembaraço, a composição do custo e o fechamento da operação.

O produto deve permitir que a equipe trabalhe sobre uma fonte de verdade, com histórico de decisões e valores. O cálculo não substitui a validação fiscal, aduaneira ou contábil; ele registra premissas, aplica regras configuradas e torna o resultado auditável.

## Usuários iniciais

| Perfil | Necessidade principal |
| --- | --- |
| Administrador | Configurar a organização, acessos e parâmetros globais. |
| Coordenador de importação | Abrir operações, distribuir tarefas e acompanhar prazos. |
| Analista | Importar documentos, cadastrar itens, simular custos e preparar o fechamento. |
| Financeiro | Registrar despesas, câmbio, pagamentos e resultado da operação. |
| Cliente da assessoria | Consultar o andamento, documentos, custos e pendências da própria operação. |
| Despachante ou consultor | Colaborar em itens e classificações quando receber acesso explícito. |

## Resultado esperado

Para cada operação, o sistema deve responder com clareza:

1. Qual é o status, o responsável e o próximo prazo.
2. Quais produtos, quantidades, documentos e fornecedores fazem parte dela.
3. Qual NCM foi sugerido, aprovado e por quem, incluindo a evidência usada.
4. Quais premissas de câmbio, frete, tributos e despesas formaram cada simulação.
5. Como as despesas foram rateadas entre os itens e qual é o custo unitário final.
6. Quais alterações ocorreram e quem as realizou.

## Escopo do primeiro produto utilizável

- Autenticação, organizações e permissões.
- Cadastro de clientes, fornecedores e produtos de referência.
- Operação de importação com itens, etapas, responsáveis e datas.
- Upload e leitura assistida de packing list em XLSX, com revisão humana antes de persistir.
- Classificação NCM como sugestão, revisão e aprovação; nunca como decisão automática.
- Cenários de custo, despesas e rateio por critérios explícitos.
- Fechamento de custo por item e exportação em XLSX.
- Painel de operações, pendências e indicadores básicos.
- Histórico de alterações e trilha de aprovação.

## Fora do primeiro ciclo

- Integração direta com Siscomex, Receita Federal, armadores, bancos ou despachantes.
- Emissão fiscal, câmbio contratado e pagamentos automatizados.
- Portal externo completo de autosserviço para clientes.
- Motor tributário que se apresente como fonte legal autônoma.

Esses itens ficam preparados no domínio e entram somente após validar o fluxo interno.

## Critérios de sucesso

- Uma operação pode ser aberta, preenchida, revisada, calculada, fechada e exportada sem planilhas paralelas.
- Um gestor entende o status e os bloqueios de uma operação em uma única tela.
- Todo valor exibido no fechamento pode ser rastreado até sua despesa, regra, taxa de câmbio ou rateio.
- Dados de um cliente não são visíveis a outro cliente.
