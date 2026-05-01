# Ponto de Situação da API (Backend)

## 1. Base Configuration e Convenções

- [x] Prefixo global `/api`
- [x] Proteção JWT nos endpoints privados
- [x] Autenticação WebSocket no handshake restrita a *query params*
- [x] Datas em formato serializável ISO UTC na resposta
- [x] IDs como string (UUID)
- [x] Envelopes paginados onde o contrato pede paginação
- [x] Formato global de erro `type/message/details`
- [~] Content-Type de upload suportado, mas validações finas de tipo/tamanho pendentes
- [~] Mapeamento fino de tipos de erro (`username_taken`, `email_taken` etc.) ainda não 100% específico por cenário

## 2. Authentication & Account

- [x] 1.1 Sign Up
- [x] 1.2 Sign In
- [x] 1.9 Get Current User
- [x] 1.10 Update Profile
- [x] 1.12 Update Preferences
- [x] 1.13 Change Password
- [~] 1.11 Upload Avatar (fluxo básico ok, storage real AWS S3 pendente)
- [ ] 1.3 Refresh Session
- [ ] 1.4 Logout
- [ ] 1.5 Forgot Password
- [ ] 1.6 Reset Password
- [~] 1.7 OAuth 42 Redirect (existe mock)
- [ ] 1.8 OAuth 42 Callback real
- [~] 1.14 2FA Setup (mock)
- [~] 1.15 2FA Verify (mock)
- [~] 1.16 2FA Disable (mock)

## 3. Users, Friends & Presence

- [x] 2.1 Search Users
- [x] 2.2 Get User Public Profile
- [x] 2.3 List Friends
- [x] 2.4 List Friend Requests
- [x] 2.5 Send Friend Request
- [x] 2.6 Accept Friend Request
- [x] 2.7 Reject Friend Request
- [x] 2.8 Remove Friend
- [x] Presence em tempo real para amigos

## 4. Workspaces & Memberships

- [x] 3.1 List Workspaces
- [x] 3.2 Create Workspace
- [x] 3.3 Get Workspace Details
- [x] 3.4 Update Workspace
- [x] 3.5 Delete Workspace
- [x] 3.6 List Workspace Members
- [x] 3.8 List My Workspace Invitations
- [x] 3.9 Respond to Workspace Invitation
- [x] 3.10 Update Member Role
- [x] 3.11 Remove Member
- [x] 3.7 Invite Member by Email
- [ ] 3.7 Envio do E-mail real de Convite via Nodemailer/SendGrid

## 5. Workspace Configuration

- [x] 4.1 List Subjects
- [x] 4.2 Create Subject
- [x] 4.3 Update Subject
- [x] 4.4 Delete Subject
- [x] 4.5 List Fields
- [x] 4.6 Create Field
- [x] 4.7 Update Field
- [x] 4.8 Delete Field

## 6. Tasks, Comments & Attachments

- [x] 5.1 List and Filter Tasks
- [x] 5.2 Create Task
- [x] 5.4 Update Task
- [x] 5.5 Delete Task
- [x] 5.6 List Comments
- [x] 5.7 Add Comment
- [x] 5.8 Update Comment
- [x] 5.9 Delete Comment
- [x] 5.10 List Attachments
- [~] 5.3 Get Task Details (task + contadores ok; shape "full" ainda sujeito a afinação)
- [~] 5.11 Upload Task Attachment (storage AWS S3 pendente)
- [~] 5.12 Download/Preview Attachment (dependente da AWS)
- [~] 5.13 Delete Attachment (remoção física da AWS pendente)

## 7. Chat & Notifications

- [x] 6.1 List Conversations
- [x] 6.2 Get Chat History
- [x] 6.3 Send Message via REST
- [x] 6.4 List Notifications
- [x] 6.5 Get Unread Notification Count
- [x] 6.6 Mark Notification as Read
- [x] 6.7 Read All Notifications
- [x] 6.8 Delete Notification

## 8. WebSocket Protocol (Socket.io)

- [x] 7.1 Handshake e autorização restrita
- [x] 7.2 Rooms user/workspace limpas e separadas
- [x] 7.3 Eventos frontend para backend (`join_workspace`, `leave_workspace` etc.)
- [x] 7.4 Eventos backend para frontend mapeados 100% com a API
- [~] 7.5 Lifecycle de reconexão/rejoin (backend suporta; política é do lado do frontend)

## 9. Core Domain Objects

- [x] Task Object alinhado
- [x] Notification Object alinhado
- [x] Conversation Preview Object alinhado
- [x] Friend Request Object estrito

**Pronto para ser testada e integrada com o frontend:**

- **Utilizadores:** Login, Registo, Edição de Perfil e Preferências. Tudo protegido com JWT.
- **Workspaces (O Core):** Criação, edição, e gestão de permissões de Membros.
- **Kanban:** Gestão de Subjects (Colunas), Fields e Tasks completas com comentários. Tudo traduzido e paginado.
- **Social (REST e Realtime):** Pesquisa de utilizadores, Pedidos de Amizade, histórico do Chat, leitura de Notificações (agora com envio em *batch*) e presença em tempo real.
- **WebSockets (Tempo Real):** Handshake 100% seguro (barrado sem token na *query*), rooms isoladas (`user:{userId}` e `workspace:{wsId}`), e emissão de eventos limpa e alinhada com o contrato da API.
- **Notificações (Triggers Automáticos):** Motor centralizado a gerar e persistir notificações automáticas para menções em comentários (`@`), reatribuição de tarefas, convites de workspace e ciclo de amizades.

**Funcionando em Modo "Mock":**

- **Uploads (Avatares e Attachments):** A rota aceita o ficheiro, mas ainda não guarda na AWS S3 real (pendente também a validação fina de tipo e tamanho).
- **Segurança Extra (2FA e OAuth 42):** As rotas existem e respondem, mas ainda não estão ligadas aos serviços oficiais.

**Pendente:**

- **Autenticação Completa:** Refresh, Logout, Forgot/Reset Password e callback OAuth 42 real.
- **Emails:** Envio real de links de *Reset Password* e *Workspace Invites* via Nodemailer/SendGrid.
