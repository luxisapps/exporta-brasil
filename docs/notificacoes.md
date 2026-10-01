# Notificações por usuário

## Eventos e destinatários

| Evento | Quem recebe | Destino |
| --- | --- | --- |
| Importação atribuída | Novo responsável | Linha do tempo |
| Responsável da importação removido ou substituído | Responsável anterior | Linha do tempo |
| Status da operação, do porto, embarque ou canal alterado | Responsável da importação | Linha do tempo |
| Custos aprovados ou previsão de chegada alterada | Responsável da importação | Linha do tempo |
| Pendência criada ou atribuída | Responsável da pendência e da importação | Pendências |
| Pendência editada, concluída, reaberta ou excluída | Responsável da pendência e da importação | Pendências |
| Responsável da pendência substituído | Responsável anterior | Pendências |
| Documento registrado ou atualizado | Responsável da importação | Documentos |
| Marco ou nota manual registrado | Responsável da importação | Linha do tempo |
| Pendência vencendo hoje ou atrasada | Responsável da pendência e da importação | Pendências |
| Documento vencido ou vencendo em até três dias | Responsável da importação | Documentos |
| Chegada prevista para hoje, em operação aprovada aguardando embarque ou em trânsito | Responsável da importação | Linha do tempo |

O autor não recebe notificações das próprias ações. Destinatários repetidos recebem um único aviso. Administradores recebem avisos quando são responsáveis pela operação ou pendência; o perfil de administrador não gera uma assinatura de todas as operações.

## Uso

O sino no header mostra a quantidade não lida. A lista apresenta referência, resumo, autor, data e hora. Clicar abre a operação e rola até a seção correta. A ação ao lado do título marca todas como lidas. O histórico usa páginas de 30 registros e botão “Ver mais”. A caixa é traduzida em português, inglês e chinês.

Lembretes são verificados a cada minuto e gerados no máximo uma vez por dia, evento e destinatário, considerando o fuso de São Paulo. Pendências concluídas e operações concluídas ou fechadas não geram lembretes. Avisos antigos permanecem no histórico; concluir uma pendência não apaga uma notificação anterior.

## Persistência e transporte

- PostgreSQL guarda operações em `app_operation_snapshots` e avisos em `app_notifications`.
- Os dados existentes no navegador são copiados quando ainda não existe a operação no banco. Essa cópia não sobrescreve dados persistidos nem envia avisos de ações históricas.
- A gravação da operação e dos avisos acontece na mesma transação. Uma revisão numérica impede sobrescrever alterações concorrentes. Em conflito, o app carrega a versão atual, avisa o usuário e preserva uma cópia do envio rejeitado no navegador para recuperação técnica.
- SSE autenticado pelo header Authorization envia invalidações. O cliente lê os dados persistidos via HTTP após cada evento ou reconexão. O token não aparece na URL.
- PostgreSQL LISTEN/NOTIFY distribui eventos entre instâncias da API. Há heartbeat, reconexão automática e atualização HTTP periódica de segurança.
- Os endpoints de listagem e leitura sempre limitam as notificações ao usuário autenticado. Não há envio de e-mail, WhatsApp nem notificações externas ao aplicativo.
- Mudanças portuárias e de canal são aquelas registradas na plataforma; esta entrega não cria uma integração automática com o Siscomex.

## Teste manual

1. Abra duas sessões com usuários diferentes.
2. No usuário A, atribua uma importação ao usuário B. O sino de B deve atualizar sem recarregar.
3. Ainda como A, registre um documento na importação. B deve receber o aviso e abrir a seção Documentos ao clicar.
4. Crie uma pendência para B. O aviso deve abrir Pendências e mostrar o título da tarefa.
5. Como B, conclua sua própria pendência: B não recebe aviso da própria ação. O responsável da importação recebe se for outra pessoa.
6. Marque um aviso como lido e recarregue. A leitura deve permanecer. “Marcar todas como lidas” deve zerar somente o contador dessa conta.
7. Crie uma pendência vencendo hoje, atribuída a B, e aguarde até um minuto. Verifique que não duplica ao aguardar mais um ciclo.
8. Edite a mesma operação simultaneamente em duas sessões. A gravação com revisão antiga deve exibir o conflito, sem sobrescrever a outra edição.

## Verificação automatizada

`npx tsx --test apps/api/tests/notifications.test.ts` verifica destinatários, exclusão do autor, canal crítico, documentos, pendências e chaves dos lembretes.

Após compilar a API, `node apps/api/tests/notifications.integration.mjs` usa `DATABASE_URL` para criar e remover exclusivamente um schema temporário de teste. Verifica autenticação, isolamento de leitura, SSE entre duas instâncias, gravação atômica, revisões, duplicações e paginação com timestamps idênticos. Não usa dados reais da empresa.
