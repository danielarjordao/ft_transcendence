# Planejamento Final de Execucao do Projeto

Este documento consolida o caminho completo ate a finalizacao do ft_transcendence, com foco na parte de backend e nas integracoes que ainda faltam para a entrega final.

## Objetivo

Entregar uma aplicacao funcional, segura e pronta para avaliacao, com:

- backend completo e consistente com o contrato de API
- persistencia real no banco
- autenticacao segura
- recursos de tempo real
- upload de arquivos
- testes basicos e documentacao final
- deploy via Docker funcionando com um comando

## Estado atual resumido

Ja existem partes importantes implementadas:

- estrutura base do NestJS
- Prisma conectado ao PostgreSQL
- modulos de users, workspaces, subjects, fields, tasks, friends, chat, notifications, auth e account
- varios endpoints REST ja criados
- parte do fluxo de workspaces, subjects e fields com persistencia real

Ainda faltam os pontos estruturais:

- autenticao real com JWT, bcrypt, guards e refresh token
- schema Prisma completo para todas as entidades do produto
- migrations e seed
- tasks, comments, attachments, friends, chat e notifications com persistencia real
- gateway WebSocket / Socket.io
- integracao real de upload de arquivos
- extracao real do userId autenticado em todos os controllers
- endurecimento de seguranca e testes

## Fase 1 - Fechar a fundacao tecnica

### 1.1 Autenticacao real

- instalar e configurar dependencias de auth
- implementar JWT access token e refresh token
- implementar hash de senha com bcrypt
- implementar login, signup, refresh, logout, forgot password e reset password com banco real
- implementar OAuth Google e GitHub, se for parte do escopo final
- implementar 2FA real, se for mantido no planejamento final
- criar guards para rotas protegidas
- criar decorador ou estrategia para obter o usuario autenticado do request
- remover todos os hardcodes de `usr_123`

### 1.2 Seguranca de aplicacao

- configurar rate limiting
- configurar CORS de forma restrita por ambiente
- adicionar tratamento global de erros no formato do contrato da API
- validar inputs com DTOs em todos os endpoints
- revisar upload para aceitar apenas tipos permitidos
- limitar tamanho de arquivos de forma real
- garantir que nao existam logs com dados sensiveis

### 1.3 Infraestrutura de banco

- finalizar `schema.prisma` com todas as entidades do produto
- criar migrations iniciais
- criar seed com dados basicos para desenvolvimento
- revisar indices e relacoes
- validar cascatas e regras de integridade
- garantir que o schema cubra todos os fluxos da API

## Fase 2 - Completar o dominio central do produto

### 2.1 Workspaces

- implementar `inviteMember` no service de workspaces
- ajustar convite por email com verificacao de existencia de usuario
- validar roles de workspace corretamente
- revisar listagem, atualizacao e remocao de membros
- tratar erros de autorizacao e conflito de forma consistente

### 2.2 Subjects e Fields

- manter CRUD atual
- revisar regras de permissao em todos os endpoints
- garantir reordenacao correta se isso fizer parte do produto final
- emitir eventos realtime quando criar, alterar ou remover
- padronizar resposta conforme o contrato da API

### 2.3 Tasks

- substituir o mock por persistencia real no banco
- implementar criacao, listagem, detalhes, atualizacao e remocao
- suportar filtro por status, prioridade, responsavel, prazo e busca por texto
- suportar paginação real
- validar transicoes de status
- garantir permissao por workspace
- retornar contagens e relacoes corretas com subject, assignee, comentarios e anexos

### 2.4 Comments

- substituir o armazenamento em memoria por Prisma
- validar autoria e permissao
- implementar criar, listar, editar e remover comentario
- associar comentario ao workspace e a tarefa correta
- emitir eventos realtime para atualizacoes de comentarios

### 2.5 Attachments

- implementar upload real de arquivos
- salvar metadados no banco
- controlar permissao de acesso por workspace e tarefa
- validar extensao, mime type e tamanho
- implementar download ou URL assinada
- implementar remocao de anexo
- garantir armazenamento seguro fora do webroot

## Fase 3 - Colaboracao social

### 3.1 Friends

- criar modelagem real de amizade e pedidos
- implementar envio, aceite, recusa e remocao
- validar conflitos e estados invalidos
- integrar status online no retorno da API
- emitir eventos realtime para pedidos e atualizacoes

### 3.2 Chat

- trocar os mocks por mensagens persistidas
- implementar historico com paginao
- implementar conversas 1:1
- implementar read receipts, se o escopo final exigir
- implementar typing indicators, se o escopo final exigir
- integrar envio via REST e tempo real
- ajustar contractos para lista de conversas e mensagens

### 3.3 Notifications

- persistir notificacoes no banco
- gerar notificacoes para tarefas, comentarios, convites, mensagens e amizades
- implementar listagem com filtros e paginao
- implementar contador de nao lidas
- implementar marcar como lida e remover
- emitir atualizacoes realtime para o usuario correto

## Fase 4 - Tempo real de verdade

### 4.1 Socket.io

- criar gateway WebSocket
- autenticar socket durante o handshake
- criar salas por usuario e por workspace
- implementar join e leave de workspace
- implementar broadcast para eventos de tarefas, comentarios, anexos, convites, amizade, chat e notificacoes
- tratar reconexao e reentrada em salas

### 4.2 Eventos principais

- `task_created`
- `task_updated`
- `task_deleted`
- `task_moved`
- `comment_added`
- `comment_updated`
- `comment_deleted`
- `attachment_uploaded`
- `attachment_deleted`
- `subject_created`
- `subject_updated`
- `subject_deleted`
- `field_created`
- `field_updated`
- `field_deleted`
- `friend_request_received`
- `friend_request_updated`
- `friend_removed`
- `receive_message`
- `notification_received`
- `notification_updated`
- `workspace_invitation_received`

## Fase 5 - Frontend e integracao final

Mesmo sendo um plano focado no backend, esta etapa precisa ficar alinhada para nao travar a entrega:

- garantir que o frontend use os contratos reais da API
- remover dependencias de mocks no cliente
- integrar auth real, refresh token e rotas protegidas
- integrar workspace, tasks, comments, friends, chat, notificacoes e uploads
- revisar estados de loading, erro e vazio
- validar responsividade e fluxo mobile
- testar atualizacao em tempo real entre multiplos clientes

## Fase 6 - Qualidade e entrega

### 6.1 Testes

- criar testes unitarios para services criticos
- criar testes de integracao para auth, workspaces, tasks e notifications
- criar testes e2e para fluxos principais
- validar upload, autorizacao e casos de erro
- validar comportamento de websocket em pelo menos os fluxos essenciais

### 6.2 Documentacao

- atualizar README principal do backend
- documentar variaveis de ambiente finais
- documentar rotas e eventos realtime
- documentar regras de permissao e roles
- documentar limites de upload e seguranca
- revisar politica de privacidade e termos se a entrega final exigir compatibilidade com o frontend

### 6.3 Deploy e operacao

- revisar Dockerfile do backend
- revisar docker-compose para startup confiavel
- garantir que Prisma funciona no container
- garantir que o banco sobe com migrations
- garantir que backend e frontend sobem sem ajuste manual
- revisar variaveis de ambiente e secrets

### 6.4 Hardening final

- remover mocks e consoles de debug
- revisar erros de compilacao e lint
- revisar performance das queries
- revisar indices do banco
- revisar permissao em todas as rotas sensiveis
- revisar mensagens de erro para nao vazar detalhes internos

## Ordem recomendada de execucao

1. autenticacao real e guards
2. schema Prisma completo e migrations
3. workspaces com convite finalizado
4. tasks com persistencia e filtros
5. comments e attachments
6. friends
7. chat
8. notifications
9. websocket
10. integracao com frontend
11. testes
12. documentacao e deploy final
13. limpeza de mocks, logs e ajustes finos

## Definicao de pronto do projeto

O projeto so deve ser considerado concluido quando todos estes pontos estiverem verdadeiros:

- login, signup, refresh e logout funcionam com dados reais
- todas as entidades principais existem no banco
- tasks, comments, attachments, friends, chat e notifications persistem de verdade
- eventos realtime funcionam entre clientes conectados
- uploads estao seguros e limitados
- rotas protegidas usam o usuario autenticado real
- nao existem mocks no caminho principal de execucao
- Docker sobe a aplicacao inteira com sucesso
- nao ha erros de console ou de build nas partes do backend
- documentacao final esta atualizada

## Observacao final

Se a meta for reduzir risco de entrega, a melhor estrategia e fechar primeiro a camada de autenticacao, depois o schema e persistence, e so depois investir nas features de colaboracao e realtime.

## Checklist Detalhada do Estado Atual

### Pronto

- [x] Bootstrap do Nest com prefixo global `/api`, `ValidationPipe` global e CORS em `backend/src/main.ts`
- [x] Conexão do Prisma com PostgreSQL via adapter em `backend/src/prisma/prisma.service.ts`
- [x] Docker Compose sobe banco, backend e frontend em `docker-compose.yml`
- [x] CRUD de workspaces, listagem de membros, update de papel e remoção de membro em `backend/src/workspaces/workspaces.service.ts`
- [x] CRUD de subjects e fields com checagem de permissão admin/owner em `backend/src/subjects/subjects.service.ts` e `backend/src/fields/fields.service.ts`
- [x] Leitura de usuário logado, atualização de perfil, preferências, busca e perfil público em `backend/src/users/users.service.ts`
- [x] Transação para aceitar convite de workspace em `backend/src/workspaces/invitations.service.ts`
- [x] Contrato de API documentado em `docs/project_shared/backend/API.md`

### Parcial

- [~] Auth tem rotas para sign-up, sign-in, refresh, logout, forgot/reset password e OAuth 42 em `backend/src/auth/auth.controller.ts`, mas a implementação ainda usa mocks em `backend/src/auth/auth.service.ts`
  - **Falta:** JWT real, bcrypt, strategies de passport, refresh token persistido

- [~] Upload de avatar já atualiza o banco em `backend/src/users/users.service.ts`, mas o armazenamento físico do arquivo ainda é simulado
  - **Falta:** Storage real (LocalStorage, S3 ou Cloud), validação de arquivo, remoção de arquivo antigo

- [~] Subjects e fields já persistem no banco, mas a emissão de eventos realtime ainda está só como `TODO` em `backend/src/subjects/subjects.service.ts` e `backend/src/fields/fields.service.ts`
  - **Falta:** Gateway WebSocket / Socket.io, injetar gateway nos services, emitir eventos para workspace:wsId

- [~] Há validação com `class-validator` em DTOs como `backend/src/auth/dto/auth.dto.ts`, `backend/src/users/dto/update-profile.dto.ts` e `backend/src/workspaces/dto/create-workspace.dto.ts`, mas ainda falta amarrar isso a autenticação real e ownership real
  - **Falta:** Guards JWT, decorador de usuário autenticado, verificação de ownership em endpoints sensíveis

### Pendente

#### Autenticação e Segurança

- [ ] Instalar dependências: `@nestjs/jwt`, `bcrypt`, `passport`, `@nestjs/passport`, `passport-jwt`, `@nestjs/throttler`
- [ ] Implementar JWT service real (gerar access token e refresh token)
- [ ] Implementar bcrypt para hash de senha
- [ ] Implementar sign-up real com banco
- [ ] Implementar sign-in real com banco
- [ ] Implementar refresh de token real e persistência de refresh token
- [ ] Implementar logout com invalidação de token
- [ ] Implementar forgot password com token de reset persistido
- [ ] Implementar reset password real
- [ ] Implementar OAuth 42 real ou remover se não for escopo
- [ ] Implementar 2FA real (speakeasy + qrcode) ou remover se não for escopo
- [ ] Criar JWT guard global ou por rota
- [ ] Criar decorador `@GetUser()` para extrair userId do request
- [ ] Remover hardcodes `usr_123` de todos os controllers
- [ ] Implementar error filter global com contrato `{ type, message, details }`

#### Schema Prisma e Persistência

- [ ] Adicionar model `Task` ao schema com campos: id, workspaceId, subjectId, title, description, priority, status, dueDate, assigneeId, createdById, createdAt, updatedAt
- [ ] Adicionar model `Comment` ao schema com campos: id, taskId, userId, text, createdAt, updatedAt
- [ ] Adicionar model `Attachment` ao schema com campos: id, taskId, fileName, fileSize, mimeType, fileUrl, uploadedById, createdAt
- [ ] Adicionar model `Friend` e `FriendRequest` ao schema
- [ ] Adicionar model `Message` e `Conversation` ao schema
- [ ] Adicionar model `Notification` ao schema
- [ ] Adicionar RefreshToken model ou coluna para persistir refresh tokens
- [ ] Adicionar PasswordReset model para tokens de reset
- [ ] Adicionar TwoFactorSecret coluna na tabela User
- [ ] Criar primeira migration
- [ ] Criar seed com dados básicos de desenvolvimento

#### Workspaces (Conclusão)

- [ ] Implementar método `inviteMember` no WorkspacesService (hoje o controller chama mas não existe)
- [ ] Validar se email já é membro antes de convidar
- [ ] Implementar lógica de convite para novo usuário (criar ou apenas convidar existente)
- [ ] Testar fluxo completo de convite e aceite

#### Tasks (Completo)

- [ ] Remover mock em memória da TasksService
- [ ] Implementar `create` com persistência
- [ ] Implementar `findAll` com filtros de status, prioridade, assignee, prazo, busca por texto e paginação
- [ ] Implementar `findOne` com detalhes completos
- [ ] Implementar `update` com validação de transição de status
- [ ] Implementar `remove` com cascata de comentários e anexos
- [ ] Validar permissão de workspace em todas as operações
- [ ] Retornar count de comentários e anexos

#### Comments (Completo)

- [ ] Remover mock em memória da CommentsService
- [ ] Implementar `listByTask` com Prisma
- [ ] Implementar `create` com userId real, validação de tarefa e emoji WebSocket
- [ ] Implementar `update` com permissão de autor
- [ ] Implementar `remove` com permissão de autor ou admin
- [ ] Adicionar relação com User (autor) nas respostas
- [ ] Emitir eventos WebSocket para workspace

#### Attachments (Completo)

- [ ] Remover mock em memória da AttachmentsService
- [ ] Instalar multer ou configurar upload real
- [ ] Implementar `upload` com validação de MIME type e tamanho (máx 10MB)
- [ ] Salvar metadados no banco
- [ ] Implementar armazenamento seguro (pasta `/uploads` com nome aleatório ou S3)
- [ ] Implementar `getById` com acesso seguro
- [ ] Implementar `remove` com limpeza de arquivo físico
- [ ] Emitir eventos WebSocket para workspace

#### Friends (Completo)

- [ ] Adicionar models Friend, FriendRequest ao schema
- [ ] Implementar `listFriends` com Prisma (relacionamento aceitado)
- [ ] Implementar `removeFriend` com Prisma
- [ ] Implementar `listRequests` com Prisma (pendentes)
- [ ] Implementar `sendRequest` com validação de duplicata
- [ ] Implementar `respondRequest` com aceitação e recusa
- [ ] Validar que pedido é endereçado ao usuário correto
- [ ] Emitir eventos WebSocket para ambos os usuários
- [ ] Integrar status online

#### Chat (Completo)

- [ ] Adicionar model Message, Conversation (ou usar related field) ao schema
- [ ] Remover mock em memória da ChatService
- [ ] Implementar `getConversations` com Prisma, paginação e última mensagem
- [ ] Implementar `getMessages` com Prisma, paginação, ordem por data
- [ ] Implementar `sendMessage` com persistência
- [ ] Integrar com WebSocket para delivery em tempo real
- [ ] Implementar read receipts, se final scope exigir
- [ ] Implementar typing indicators via WebSocket, se final scope exigir

#### Notifications (Completo)

- [ ] Remover mock em memória da NotificationsService
- [ ] Implementar `findAll` com Prisma, filtros e paginação
- [ ] Implementar `getUnreadCount` com Prisma
- [ ] Implementar `markAllAsRead` com Prisma
- [ ] Implementar `update` de read status com validação de ownership
- [ ] Implementar `remove` com validação de ownership
- [ ] Criar camada de notificações disparada por eventos (task assign, comment mention, friend request, etc)
- [ ] Emitir notificações via WebSocket

#### WebSocket / Socket.io

- [ ] Instalar `@nestjs/websockets` e `socket.io`
- [ ] Criar TasksGateway ou workspace gateway
- [ ] Implementar autenticação no handshake
- [ ] Implementar salas por usuário (`user:{userId}`)
- [ ] Implementar salas por workspace (`workspace:{wsId}`)
- [ ] Implementar handlers para `join_workspace`, `leave_workspace`
- [ ] Implementar broadcast de eventos de tarefas, comentários, anexos
- [ ] Implementar broadcast de eventos de friends, chat, notificações
- [ ] Tratar reconexão e reentrada em salas
- [ ] Testar com múltiplos clientes simultâneos

#### Upload de Arquivos

- [ ] Configurar multer com limites de tamanho
- [ ] Validar MIME types permitidos
- [ ] Gerar nome de arquivo aleatório para segurança
- [ ] Armazenar em diretório seguro fora do webroot
- [ ] Implementar download seguro com permissão
- [ ] Implementar DELETE com limpeza de arquivo físico
- [ ] Gravar URLs no banco

#### Testes

- [ ] Criar testes unitários para AuthService
- [ ] Criar testes unitários para WorkspacesService
- [ ] Criar testes unitários para TasksService
- [ ] Criar testes de integração para fluxo de sign-up → create workspace → create task
- [ ] Criar testes de integração para permissões
- [ ] Criar testes e2e para endpoints principais
- [ ] Criar testes de upload e validação de arquivo
- [ ] Testar WebSocket em cenários de múltiplos clientes

#### Documentação

- [ ] Atualizar README do backend com setup real
- [ ] Documentar variáveis de ambiente finais
- [ ] Documentar estrutura de rotas protegidas vs públicas
- [ ] Documentar eventos WebSocket esperados
- [ ] Documentar limites de upload
- [ ] Documentar regras de permissão por role (owner, admin, member)
- [ ] Documentar fluxo de autenticação e refresh token
- [ ] Documentar como rodar migrations e seed

#### Deploy e Operação

- [ ] Revisar Dockerfile do backend para build multi-stage (opcional)
- [ ] Garantir que docker-compose.yml sobe sem ajustes manuais
- [ ] Garantir que Prisma gera e roda migrations no container
- [ ] Criar script de seed ou fazer via Prisma studio
- [ ] Revisar variáveis de ambiente para produção vs desenvolvimento
- [ ] Documentar processo de deploy
- [ ] Testar startup completo com `docker-compose up` um segundo vez em máquina limpa

#### Hardening Final

- [ ] Remover todos os mocks do caminho principal
- [ ] Remover console.logs deprecados
- [ ] Revisar erros de compilação TypeScript
- [ ] Revisar aviso de lint (deprecated baseUrl, etc)
- [ ] Validar que nenhum senha ou segredo é logado
- [ ] Revisar performance de queries críticas
- [ ] Adicionar índices ao banco se necessário
- [ ] Revisar mensagens de erro para não vazar detalhes internos
- [ ] Validar rate limiting em endpoints sensíveis
- [ ] Revisar CORS para ambientes específicos

## Resumo de Métricas de Conclusão

**Completo:** 8 itens
**Parcial:** 4 itens
**Pendente:** 118+ subtarefas em 12 categorias

**Distribuição de risco:**

- Autenticação: 40% (bloqueia quase tudo)
- Persistência: 30% (sem isso, nada funciona)
- WebSocket: 20% (crítico para tempo real)
- Upload: 10% (funcionalidade isolada mas importante)
