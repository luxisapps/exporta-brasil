# Plano de conclusão: orçamento, NCM, tributos e fechamento

Atualizado em 30/09/2026. Este documento distingue trabalho implementado de trabalho planejado; os critérios abaixo definem conclusão.

## Entrega atual: catálogo NCM e sugestões

- Busca pelo catálogo oficial Classif, por código ou descrição hierárquica, incluindo validação de vigência.
- Seleção e validação no cadastro/edição de produto. Descrição oficial exibida junto do código.
- Conector de IA no servidor, autenticado: identifica posições SH, recebe candidatos existentes e sugere até três códigos com justificativas e perguntas pendentes.
- A IA só ordena candidatos; códigos e descrições vêm do catálogo oficial. Não gera alíquotas.
- A sugestão usa Gemini na API do servidor, com GEMINI_API_KEY no serviço API do Railway. NCM_AI_MODEL permite configurar o modelo; padrão gemini-3.8-flash. A resposta é validada contra o catálogo vigente e exige confirmação humana. As chamadas usam store=false.
- Cache de catálogo por 24 horas, chamadas concorrentes compartilham a mesma consulta. Em falha de atualização, a API identifica o uso de cache antigo.
- Ainda não há consulta tributária oficial nem comprovação de qualidade das sugestões em produtos reais.

## 1. Persistência e sessões

- Persistir clientes, operações, itens, despesas, versões, tarefas, documentos e eventos no PostgreSQL.
- Migrar os dados locais com revisão, identificação de proprietário e deduplicação; guardar cópia recuperável antes da migração.
- Autorizar todos os endpoints, validar payloads e proteger alterações concorrentes por versão da operação.
- Carregar parametrizações do servidor antes de criar orçamentos. Expiração de sessão leva ao login.
- Arquivos da operação em R2 com acesso autorizado; evidências financeiras não ficam em bucket público.
- Critério: operação criada aparece em outro navegador/usuário autorizado e sobrevive a reinícios; alteração concorrente não sobrescreve silenciosamente.

## 2. Produtos e planilhas

- Revisar as três planilhas reais com a Rose; documentar entradas, fórmulas, unidades e campos de saída.
- Importador com prévia, associação de colunas, erros por linha, duplicidades e confirmação antes de gravar.
- Quantidade calculada por unidades/caixa × caixas quando ambos informados; peso unitário e total com rótulos separados.
- Calcular volume por dimensões e volume total. Resultados exibidos como texto; edição nos insumos.
- Validar NCM em produtos importados, sem forçar sugestão automática em lote; destacar itens sem classificação revisada.
- Preservar nome chinês, inglês, SKU, características, documentos técnicos e imagens quando recuperáveis da planilha.
- Critério: arquivos fornecidos importam com totais e unidades reconciliados, sem linhas descartadas silenciosamente.

## 3. Classificação assistida por IA

- Completar produto com material/composição, uso, função, princípio de funcionamento, modelo e especificações; foto como apoio opcional.
- Exibir até três candidatos: código, descrição hierárquica oficial, justificativa, diferenças relevantes e informação faltante.
- Pedir detalhes quando a descrição for insuficiente; não inventar três opções nem probabilidades de acerto.
- Permitir busca manual, confirmação/rejeição e registrar autor, data, versão do catálogo, modelo e justificativa da escolha.
- Consultas repetidas podem ser reaproveitadas por descrição normalizada + versão do catálogo. Medir custo e limitar uso por usuário/empresa.
- Avaliar com produtos reais previamente classificados pela equipe: presença do código correto entre candidatos, códigos inválidos, abstenção, custo e tempo.
- Critério: nenhum código inexistente/vencido é oferecido; a equipe aprova a qualidade dos casos reais antes de uso operacional.

## 4. Consulta oficial Siscomex

- Usar Classif público para nomenclatura; implementar TTCE apenas nos serviços e permissões efetivamente disponíveis ao representante.
- Confirmar certificado e perfil autorizado. Preferência técnica: A1 de representante autorizado para serviço no servidor; A3 exige estratégia própria.
- Autenticação TLS no backend; tratar Set-Token, X-CSRF-Token, expiração e renovação conforme documentação.
- Primeiro validar contratos em ambiente de validação das empresas, depois homologar acesso em produção. Atributos podem ter códigos diferentes por ambiente.
- Consultar tratamento tributário, regimes, fundamentos e atributos adicionais. Mapear alíquotas somente quando o serviço realmente as retornar; avaliar separadamente serviço de simulação e seu acesso.
- Distinguir consulta incompleta, indisponível, não autorizada, válida e vencida. Nunca substituir falha por alíquota zero.
- Guardar entrada e resposta oficiais, ambiente, data, fundamentos legais e origem. Segredos só no servidor, fora de logs e repositório.
- Nas sugestões NCM, consultar os candidatos com o contexto fiscal da operação e mostrar tributos disponíveis, perguntas pendentes e fonte. O usuário escolhe pela mercadoria, não pelo menor tributo.
- Critério: chamadas reais autorizadas, resultados conferidos pela equipe, cenários sem acesso/expiração testados. Um conector sem credenciais não conta como integração concluída.

## 5. Parametrizações e motor de cálculo

- Perfis de entrada/saída por vigência, UF, regime, origem, moeda/modal e condições aplicáveis.
- Separar alíquota percentual, taxa fixa, base de cálculo e método de rateio; taxa Siscomex não é um percentual genérico.
- II, IPI, PIS, COFINS, ICMS, AFRMM e taxas conforme regras validadas; venda, margem, créditos e tributos de saída conforme perfil fiscal.
- Revisar a validade das bases das planilhas: reproduzir uma fórmula histórica não a torna regra fiscal correta. Considerar regras transitórias/IBS/CBS conforme vigência e validação fiscal.
- Valores decimais precisos, política explícita de arredondamento, detalhamento de fórmulas e reconciliação entre item e total.
- Permitir substituição de alíquota com motivo/autor/data, preservando sugestão e origem oficiais.
- Critério: casos reais de referência aprovados pela equipe fiscal; todos os campos configuráveis têm efeito verificável ou são identificados como não aplicáveis.

## 6. Orçamento e aprovação visíveis

- Lista: colunas separadas Orçamento e Embarque, valor rotulado estimado/aprovado, filtros em parâmetros ingleses na URL.
- Orçamento: elaboração → aguardando aprovação → aprovado; rejeição/cancelamento com motivo.
- Detalhes: resumo financeiro e ação Registrar aprovação do cliente no topo.
- Aprovação inclui aprovador pelo cliente, data, evidência opcional e usuário interno responsável pelo registro.
- Aprovar cria cópia imutável de produtos, despesas, taxas, consultas e fórmulas. Alterações geram revisão nova; versão aprovada permanece comparável.
- Critério: editar padrão, produto ou revisão não altera orçamento já aprovado; aprovação é fácil de encontrar e auditável.

## 7. Embarque, realizado e fechamento

- Compra confirmada → embarcado → chegou → desembaraçado/entregue → fechado, com datas e responsáveis.
- Despesas contratadas, faturadas e pagas com fornecedor, moeda, câmbio, vencimento, comprovante e status.
- Comparar a mesma base orçada/realizada, por item/categoria, incluindo falta de dados; evitar somar etapas do mesmo lançamento em duplicidade.
- Fechamento reconcilia produtos efetivamente embarcados, tributos, despesas, venda e margem; ajustes registrados.
- Critério: diferença orçado × realizado explicada por valores/rateios; fechamento identifica pendências e preserva histórico.

## 8. Relatórios, qualidade e publicação

- PDF: resumo na primeira página; depois itens, impostos, despesas, variações, premissas, versão e aprovações.
- XLSX: Resumo, Produtos, Tributos, Despesas e Comparativo; números exportados como números e textos externos protegidos contra interpretação como fórmulas.
- Usar o mesmo resultado versionado na tela, PDF e XLSX; demonstrar valores estimados/oficiais/manuais.
- Traduzir novos fluxos PT/EN/ZH; usar shadcn para controles disponíveis, teclado/foco, mobile e skeletons coerentes.
- Testar persistência, regras financeiras, importação, aprovação, expiração, falta de contexto tributário e indisponibilidade de provedores.
- Publicar incrementos verificados em Railway/Vercel; só declarar recurso pronto quando seu critério estiver cumprido.

## Dependências externas

1. GEMINI_API_KEY com faturamento/limites para IA no aplicativo.
2. Certificado e representante com perfil autorizado no Portal Único, conforme serviços desejados.
3. Revisão dos casos reais com Rose/despachante/contador para validar classificação e regras fiscais.

Essas dependências não impedem persistência, catálogo público, edição de produtos, fluxo de aprovação e relatórios.

## Fontes oficiais

- Catálogo NCM JSON: https://portalunico.siscomex.gov.br/classif/api/publico/nomenclatura/download/json
- Classif: https://www.gov.br/receitafederal/pt-br/assuntos/aduana-e-comercio-exterior/classificacao-fiscal-de-mercadorias/classif
- Autenticação Portal Único: https://docs.portalunico.siscomex.gov.br/introducao-api-publica/
- TTCE: https://docs.portalunico.siscomex.gov.br/api/ttce/
- Consulta individual e atributos: https://docs.portalunico.siscomex.gov.br/pages/exemplos/ttce/documentacao-adicional-api-consulta-individual/
- Respostas estruturadas de IA: https://developers.openai.com/api/docs/guides/structured-outputs
