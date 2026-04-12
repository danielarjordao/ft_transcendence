# Modelagem

## Grupo: User, AuthAccount, Session, PasswordResetToken e TwoFactorBackupCode

Esse grupo representa a identidade da conta, os meios de autenticacao e os mecanismos de seguranca do usuario:
- `User` representa o perfil principal e o estado geral da conta.
- `AuthAccount` representa como esse usuario autentica no sistema.
- `Session` representa sessoes autenticadas com refresh token.
- `PasswordResetToken` representa o fluxo de recuperacao de senha.
- `TwoFactorBackupCode` representa os codigos de recuperacao do 2FA.

### 1. User

`User` representa a entidade principal da conta no sistema.

Campos principais:
- `email` e `username`: identificadores unicos do usuario
- `fullName`, `avatarUrl` e `bio`: dados de perfil
- `accountType`: campo mantido por compatibilidade com o contrato atual do projeto
- `preferences`: configuracoes do usuario em JSON
- `isOnline`: estado de presenca
- `emailVerifiedAt`: momento em que o email foi confirmado
- `passwordChangedAt`: ultimo momento em que a senha foi alterada
- `lastLoginAt`: ultimo login bem-sucedido
- `twoFactorEnabled`: indica se o 2FA esta ativo
- `twoFactorSecretEnc`: segredo do autenticador usado no 2FA
- `twoFactorConfirmedAt`: momento em que o 2FA foi confirmado pela primeira vez
- `createdAt` e `updatedAt`: auditoria basica

Relacoes principais:
- `authAccounts -> AuthAccount[]`
- `sessions -> Session[]`
- `passwordResets -> PasswordResetToken[]`
- `backupCodes -> TwoFactorBackupCode[]`

Outras relacoes de dominio:
- `createdWorkspaces -> Workspace[]`
- `workspaceMemberships -> WorkspaceMember[]`
- `sentWorkspaceInvitations -> WorkspaceInvitation[]`
- `receivedWorkspaceInvitations -> WorkspaceInvitation[]`
- `createdTasks -> Task[]`
- `taskComments -> Comment[]`
- `uploadedAttachments -> Attachment[]`
- `sentFriendRequests -> FriendRequest[]`
- `receivedFriendRequests -> FriendRequest[]`
- `friendshipsAsUserA -> Friendship[]`
- `friendshipsAsUserB -> Friendship[]`
- `sentMessages -> Message[]`
- `receivedMessages -> Message[]`
- `notifications -> Notification[]`

Pontos importantes:
- `User` nao guarda mais `passwordHash` diretamente.
- `User` tambem nao guarda refresh token diretamente.
- `accountType` continua existindo para compatibilidade com o contrato atual do projeto, mas a fonte de verdade da autenticacao passa a ser `AuthAccount`.
- `twoFactorSecretEnc` foi pensado para guardar o segredo do 2FA de forma protegida, em vez de texto puro.

### 2. AuthAccount

`AuthAccount` representa uma conta de autenticacao ligada a um `User`.

Campos principais:
- `userId`: dono da conta de autenticacao
- `provider`: provedor usado para login, como `LOCAL` ou `FORTY_TWO`
- `providerAccountId`: identificador unico do usuario dentro do provedor
- `passwordHash`: hash da senha, usado apenas quando o provider for `LOCAL`
- `providerEmail`: email retornado pelo provedor, quando fizer sentido
- `accessTokenEnc` e `refreshTokenEnc`: tokens do provedor externo, se a integracao precisar persisti-los
- `tokenExpiresAt`: expiracao do token externo
- `scope`: escopos concedidos pelo provedor
- `createdAt` e `updatedAt`

Relacoes:
- `user -> User`

Pontos importantes:
- esse model separa perfil de autenticacao
- um mesmo `User` pode ter mais de uma forma de login
- `@@unique([provider, providerAccountId])` impede duplicidade da mesma conta externa
- `@@unique([userId, provider])` impede que o mesmo usuario tenha duas contas do mesmo provider
- para login local, a senha fica aqui, nao em `User`

### 3. Session

`Session` representa uma sessao autenticada do usuario.

Campos principais:
- `userId`
- `refreshTokenHash`
- `userAgent`
- `ipAddress`
- `expiresAt`
- `revokedAt`
- `replacedBySessionId`
- `status`
- `createdAt`
- `updatedAt`

Relacoes:
- `user -> User`

Pontos importantes:
- o banco guarda `refreshTokenHash`, nao o refresh token puro
- isso permite multiplas sessoes por usuario, por exemplo em navegadores ou dispositivos diferentes
- `replacedBySessionId` ajuda no fluxo de rotacao de refresh token
- `status`, `revokedAt` e `expiresAt` ajudam a controlar logout, expiracao e invalidacao

### 4. PasswordResetToken

`PasswordResetToken` representa um token de recuperacao de senha.

Campos principais:
- `userId`
- `tokenHash`
- `expiresAt`
- `usedAt`
- `createdAt`

Relacoes:
- `user -> User`

Pontos importantes:
- o banco guarda `tokenHash`, nao o token puro enviado ao usuario
- `usedAt` permite tratar o token como uso unico
- `expiresAt` impede reaproveitamento fora da janela permitida
- esse model deixa o fluxo de reset desacoplado de `User`

### 5. TwoFactorBackupCode

`TwoFactorBackupCode` representa um codigo de recuperacao do 2FA.

Campos principais:
- `userId`
- `codeHash`
- `usedAt`
- `createdAt`

Relacoes:
- `user -> User`

Pontos importantes:
- o banco guarda `codeHash`, nao o codigo puro
- cada codigo pode ser inutilizado individualmente via `usedAt`
- esse model serve como contingencia quando o usuario perde acesso ao app autenticador

### Regras de exclusao e impacto

#### 1. Ao remover um usuario

Se um `User` for removido:
- `AuthAccount`, `Session`, `PasswordResetToken` e `TwoFactorBackupCode` sao removidos em cascade
- registros de `WorkspaceMember` tambem sao removidos em cascade
- convites enviados tambem sao removidos em cascade
- convites recebidos com `inviteeId` apontando para ele passam para `null`
- pedidos de amizade enviados e recebidos sao removidos em cascade
- amizades em que ele participa sao removidas em cascade
- mensagens enviadas e recebidas sao removidas em cascade
- notificacoes do usuario sao removidas em cascade

Mas existe um ponto importante:
- hoje, pela modelagem atual, a remocao de um `User` pode ser bloqueada se ele ainda for criador de `Workspace`, autor de `Comment`, uploader de `Attachment` ou criador de `Task`
- isso acontece porque essas relacoes usam `onDelete: Restrict`

Na pratica:
- apagar um usuario nao e uma operacao simples
- antes disso, a equipe precisara decidir como tratar os dados de dominio ligados a ele

#### 2. Ao remover uma conta de autenticacao

Se um `AuthAccount` for removido:
- o `User` nao e removido
- apenas aquela forma de login deixa de existir

Exemplo:
- remover a conta `FORTY_TWO` nao precisa apagar o perfil do usuario
- remover a conta `LOCAL` nao deveria apagar o usuario, apenas impedir login por email/senha

#### 3. Ao revogar uma sessao

Na maioria dos casos, a equipe nao deve deletar a linha de `Session`.

O fluxo mais coerente costuma ser:
- marcar `status = REVOKED`
- preencher `revokedAt`

Isso preserva historico e simplifica auditoria.

#### 4. Ao usar um token de reset ou um backup code

Em vez de deletar imediatamente:
- a equipe pode marcar `usedAt`

Isso facilita:
- rastreabilidade
- debug
- prevencao de reuso

### Mudancas necessarias para a equipe

Para essa modelagem funcionar com o restante do codigo, os pontos abaixo ainda precisam ser implementados ou ajustados.

#### AuthService

Mudancas necessarias:
- parar de tratar `accountType` como fonte de verdade da autenticacao
- usar `AuthAccount.provider` para distinguir login local e OAuth 42
- no sign-up local, criar `User` e depois criar `AuthAccount` com `provider = LOCAL`
- no callback OAuth 42, localizar ou criar `AuthAccount` com `provider = FORTY_TWO`
- atualizar o fluxo de refresh/logout para trabalhar com `Session`
- atualizar forgot/reset password para trabalhar com `PasswordResetToken`

#### DTOs e contratos de autenticacao

Mudancas necessarias:
- manter `accountType` apenas como compatibilidade temporaria enquanto backend, frontend e documentacao ainda dependem dele
- alinhar a documentacao para deixar claro que `accountType` nao substitui `provider`
- documentar o comportamento de sessao, refresh, logout e reset com base nos novos models

Importante sobre migracao:
- na modelagem atual, `accountType` foi mantido apenas para compatibilidade com partes ja existentes do projeto
- a fonte de verdade da autenticacao agora e `AuthAccount`
- isso significa que a equipe de backend/frontend deve migrar gradualmente a logica para usar `AuthAccount.provider`
- enquanto essa migracao nao terminar, `accountType` pode continuar existindo para nao quebrar contrato, mocks e interface
- depois que o restante do projeto parar de depender de `accountType`, esse campo pode ser removido do `User`
- em outras palavras: primeiro a equipe remove o uso real de `accountType`; depois o schema pode apagar o campo com seguranca

#### UsersService

Mudancas necessarias:
- substituir os mocks por consultas Prisma em `User`
- manter `accountType` no retorno apenas como compatibilidade temporaria com o contrato atual
- alinhar o retorno de perfil com os novos campos persistidos em `User`

#### Fluxo de senha local

Mudancas necessarias:
- qualquer leitura ou escrita de senha deve sair de `User` e ir para `AuthAccount.passwordHash`
- isso vale para sign-up, sign-in e change password
- o `provider` correto nesse caso e `LOCAL`

#### Fluxo de sessao

Mudancas necessarias:
- refresh token deve gerar ou consultar uma `Session`
- logout deve revogar a `Session`, nao apagar um campo em `User`
- a equipe precisa decidir a politica de rotacao de refresh token

#### Fluxo de reset de senha

Mudancas necessarias:
- gerar token aleatorio para envio ao usuario
- salvar apenas o `tokenHash` em `PasswordResetToken`
- validar `expiresAt` e `usedAt` no reset
- apos reset bem-sucedido, atualizar `passwordChangedAt`

#### Fluxo de 2FA

Mudancas necessarias:
- `setup2fa` deve gerar o segredo e salvar em `User.twoFactorSecretEnc`
- `verify2fa` deve validar o codigo e ativar `twoFactorEnabled`
- `verify2fa` tambem deve preencher `twoFactorConfirmedAt`
- `disable2fa` deve invalidar o segredo e desativar `twoFactorEnabled`
- se a equipe usar backup codes, eles devem ser criados em `TwoFactorBackupCode`

## Grupo: Workspace, WorkspaceMember e WorkspaceInvitation

Esse grupo representa a estrutura organizacional do projeto:
- `Workspace` representa o espaco principal de colaboracao.
- `WorkspaceMember` representa o vinculo entre usuario e workspace.
- `WorkspaceInvitation` representa o fluxo de convite para entrada no workspace.

### 1. Workspace

`Workspace` representa uma organizacao ou espaco de trabalho onde o board existe.

Campos principais:
- `name`: nome do workspace
- `description`: descricao opcional
- `createdById`: usuario que criou o workspace
- `createdAt` e `updatedAt`

Relacoes principais:
- `createdBy -> User`
- `members -> WorkspaceMember[]`
- `invitations -> WorkspaceInvitation[]`
- `subjects -> Subject[]`
- `fields -> Field[]`
- `tasks -> Task[]`

Pontos importantes:
- `Workspace` e o container principal do dominio colaborativo
- `createdById` registra quem criou o workspace, mas isso nao substitui a tabela de membros
- `members` guarda quem participa do workspace e com qual papel
- `subjects`, `fields` e `tasks` dependem diretamente do workspace

### 2. WorkspaceMember

`WorkspaceMember` representa a participacao de um `User` em um `Workspace`.

Campos principais:
- `workspaceId`
- `userId`
- `role`
- `joinedAt`

Relacoes:
- `workspace -> Workspace`
- `user -> User`
- `assignedTasks -> Task[]`

Pontos importantes:
- esse model funciona como tabela de associacao entre `User` e `Workspace`
- `@@unique([workspaceId, userId])` impede que o mesmo usuario entre duas vezes no mesmo workspace
- `role` define o nivel de permissao do membro dentro daquele workspace
- o relacionamento com `Task` mostra que uma task pode ser atribuida a um membro do workspace, nao apenas a qualquer usuario do sistema

### 3. WorkspaceInvitation

`WorkspaceInvitation` representa um convite para entrada em um `Workspace`.

Campos principais:
- `workspaceId`
- `inviterId`
- `inviteeId`
- `inviteeEmail`
- `role`
- `status`
- `createdAt`
- `respondedAt`

Relacoes:
- `workspace -> Workspace`
- `inviter -> User`
- `invitee -> User?`

Pontos importantes:
- o convite pode existir antes mesmo de o usuario estar cadastrado, por isso `inviteeId` e opcional
- `inviteeEmail` guarda o email alvo do convite
- `role` define qual papel o usuario tera ao aceitar
- `status` controla o ciclo do convite, como `PENDING`, `ACCEPTED` e `DECLINED`
- `respondedAt` registra quando o convite deixou de estar pendente

### Regras de exclusao e impacto

#### 1. Ao remover um workspace

Se um `Workspace` for removido:
- `WorkspaceMember` sao removidos em cascade
- `WorkspaceInvitation` sao removidos em cascade
- `Subject`, `Field` e `Task` tambem sao removidos em cascade

Na pratica:
- apagar um workspace apaga tambem toda a estrutura interna ligada a ele
- isso faz sentido porque esses dados nao existem fora do contexto do workspace

#### 2. Ao remover um membro do workspace

Se um `WorkspaceMember` for removido:
- o vinculo dele com o workspace desaparece
- mas a equipe nao deve assumir que isso sera resolvido automaticamente no banco

Na pratica:
- antes de remover o membro, a equipe deve tratar as tasks em que ele aparece como `assignee`
- a regra de negocio pode escolher entre desatribuir, reatribuir ou bloquear a remocao

#### 3. Ao remover o usuario convidado

Se um `User` associado a `inviteeId` for removido:
- o convite nao precisa ser apagado
- o campo `inviteeId` vira `null`
- o sistema ainda pode continuar reconhecendo o convite por `inviteeEmail`

Isso foi modelado com `onDelete: SetNull`.

#### 4. Ao remover o usuario que enviou o convite

Se o `inviter` for removido:
- os convites enviados por ele sao removidos em cascade

Isso significa que:
- o convite depende da existencia do remetente no modelo atual
- se a equipe quiser preservar historico futuro de convites mesmo sem o remetente, precisaria mudar essa regra

#### 5. Ao remover o criador do workspace

Hoje, com a modelagem atual, nao sera possivel remover o `User` que criou o workspace se ainda existirem workspaces apontando para ele em `createdBy`.

Isso acontece porque:
- `Workspace.createdBy` usa `onDelete: Restrict`

Na pratica:
- antes de apagar esse usuario, a equipe precisa transferir a criacao ou remover os workspaces ligados a ele

### Mudancas necessarias para a equipe

Para essa modelagem funcionar com o restante do codigo, os pontos abaixo ainda precisam ser implementados ou ajustados.

#### WorkspacesService

Mudancas necessarias:
- fazer a criacao de workspace persistir `Workspace` e tambem criar o `WorkspaceMember` inicial do criador
- definir o papel inicial do criador como `OWNER`
- fazer listagens e detalhes carregarem membros, roles e metadados reais via Prisma
- respeitar a regra de permissao por `WorkspaceMember.role`

#### InvitationsService

Mudancas necessarias:
- trabalhar com `inviteeEmail` mesmo quando `inviteeId` ainda nao existir
- ao aceitar convite, criar `WorkspaceMember` com o `role` definido no convite
- atualizar `status` e `respondedAt` ao aceitar ou recusar
- impedir duplicidade de convite ativo para o mesmo email, se essa for a regra desejada pelo time

#### Fluxo de entrada em workspace

Mudancas necessarias:
- quando um usuario aceitar convite, ele deve entrar como membro do workspace
- validar se o email do usuario autenticado bate com `inviteeEmail`
- vincular `inviteeId` quando o usuario ja existir ou passar a existir no sistema

#### Fluxo de remocao de membro

Mudancas necessarias:
- antes de remover um membro, tratar as tasks em que ele aparece como assignee
- implementar a regra escolhida pelo time: desatribuir automaticamente ou bloquear a remocao com erro de negocio

#### Controle de permissao

Mudancas necessarias:
- usar `WorkspaceMember.role` como base para autorizacao dentro do workspace
- nao confiar apenas em `createdById` para decisoes de permissao do dia a dia
- alinhar endpoints administrativos, como update de role, remocao de membro e delete de workspace

## Grupo: Subject e Field

Esse grupo representa a configuracao estrutural do board dentro de um workspace:
- `Subject` representa categorias ou materias que podem ser associadas a uma task.
- `Field` representa as colunas do board.

### 1. Subject

`Subject` representa uma categoria configuravel dentro de um `Workspace`.

Campos principais:
- `workspaceId`: workspace ao qual o subject pertence
- `name`: nome da categoria
- `color`: cor usada para exibicao visual
- `position`: ordem de exibicao
- `createdAt` e `updatedAt`

Relacoes:
- `workspace -> Workspace`
- `tasks -> Task[]`

Pontos importantes:
- `Subject` pertence sempre a um unico workspace
- `@@unique([workspaceId, name])` impede nomes duplicados dentro do mesmo workspace
- o mesmo nome pode existir em workspaces diferentes
- a relacao com `Task` e opcional do lado da task, entao uma task pode existir sem subject

### 2. Field

`Field` representa uma coluna do board dentro de um `Workspace`.

Campos principais:
- `workspaceId`: workspace ao qual o field pertence
- `name`: nome da coluna
- `color`: cor usada na interface
- `position`: ordem de exibicao no board
- `createdAt` e `updatedAt`

Relacoes:
- `workspace -> Workspace`
- `tasks -> Task[]`

Pontos importantes:
- `Field` tambem pertence sempre a um unico workspace
- `@@unique([workspaceId, name])` impede colunas com o mesmo nome dentro do mesmo workspace
- `position` permite ordenar as colunas no board sem depender da ordem de criacao
- a relacao entre `Task` e `Field` e obrigatoria, porque toda task precisa estar em uma coluna
- no dominio atual, o que a API chama de `status` da task corresponde na pratica ao `Field`

### Regras de exclusao e impacto

#### 1. Ao remover um subject

Se um `Subject` for removido:
- as tasks ligadas a ele nao sao removidas
- o campo `subjectId` dessas tasks passa a `null`

Isso acontece porque:
- a relacao de `Task.subject` usa `onDelete: SetNull`

Na pratica:
- remover um subject e uma operacao relativamente segura
- a task continua existindo, apenas perde a classificacao

#### 2. Ao remover um field

Se um `Field` for removido:
- a operacao sera bloqueada se ainda existirem tasks naquele field

Isso acontece porque:
- a relacao de `Task.field` usa `onDelete: Restrict`
- `fieldId` e obrigatorio em `Task`

Na pratica:
- antes de remover um field, a equipe precisa mover ou remover as tasks que ainda apontam para ele

#### 3. Ao remover um workspace

Se um `Workspace` for removido:
- `Subject` e `Field` sao removidos em cascade

Isso faz sentido porque:
- esses models so existem dentro do contexto do workspace

### Mudancas necessarias para a equipe

Para essa modelagem funcionar com o restante do codigo, os pontos abaixo ainda precisam ser implementados ou ajustados.

#### SubjectsService

Mudancas necessarias:
- substituir os mocks por persistencia real com Prisma
- validar permissao do usuario antes de criar, editar ou remover subjects
- respeitar o escopo do `workspaceId` em todas as operacoes
- emitir os eventos WebSocket esperados para create, update e delete

#### FieldsService

Mudancas necessarias:
- substituir os mocks por persistencia real com Prisma
- validar permissao do usuario antes de criar, editar ou remover fields
- respeitar o escopo do `workspaceId` em todas as operacoes
- emitir os eventos WebSocket esperados para create, update e delete

#### DTOs e contrato de API

Mudancas necessarias:
- alinhar o contrato para deixar claro que `Subject` e uma classificacao opcional da task
- alinhar o contrato para deixar claro que o `status` da task corresponde ao `Field`
- manter consistencia entre nome, cor e ordenacao retornados pela API e os campos reais do schema

#### Fluxo de remocao de subject

Mudancas necessarias:
- garantir que a remocao de subject aceite o comportamento de `SetNull` nas tasks
- ajustar respostas da API e eventos em tempo real para refletir que as tasks continuam existindo

#### Fluxo de remocao de field

Mudancas necessarias:
- impedir remocao de field enquanto ainda existirem tasks ligadas a ele, ou mover essas tasks antes da exclusao
- alinhar essa regra entre backend, frontend e mensagens de erro da API

## Grupo: Tasks, Comments e Attachments

Esse grupo representa o nucleo operacional do board:
- `Task` e a entidade principal.
- `Comment` registra conversa e historico textual sobre uma task.
- `Attachment` registra arquivos ligados a uma task.

### 1. Task

`Task` representa um item de trabalho dentro de um `Workspace`.

Campos principais:
- `workspaceId`: define a qual workspace a task pertence
- `fieldId`: define em qual coluna do board a task esta
- `title` e `description`: dados principais da task
- `priority`: prioridade opcional
- `assigneeId`: usuario responsavel pela task
- `subjectId`: materia ou categoria opcional
- `dueDate`: prazo opcional
- `createdById`: usuario que criou a task

Relacoes principais:
- `workspace -> Workspace`
- `field -> Field`
- `subject -> Subject?`
- `createdBy -> User`
- `assignee -> WorkspaceMember?`
- `comments -> Comment[]`
- `attachments -> Attachment[]`

### 2. Status da task

No banco, a task nao guarda um campo textual chamado `status`.
Em vez disso, ela guarda `fieldId`.

Isso foi escolhido porque, no dominio atual do projeto, o "status" da task na verdade representa a coluna do board.
Essas colunas ja existem como `Field`.

Exemplo de leitura:
- "To Do" = um `Field`
- "In Progress" = outro `Field`
- "Done" = outro `Field`

Entao:
- a API pode continuar aceitando o nome `status` se a equipe quiser
- mas internamente o service deve traduzir esse valor para `fieldId`

Essa abordagem deixa o banco mais consistente com o resto do dominio e evita guardar texto solto para algo que ja tem entidade propria.

### 3. Assignee com relacao composta

O campo `assigneeId` continua com o nome padrao usado no projeto.
Mas ele nao aponta diretamente para `User`.

Ele participa de uma relacao composta:
- `Task.workspaceId + Task.assigneeId`
- apontando para `WorkspaceMember.workspaceId + WorkspaceMember.userId`

Na pratica, isso garante no banco que:
- uma task so pode ser atribuida a alguem do mesmo workspace
- nao basta o usuario existir
- ele precisa ser membro daquele workspace

Isso e melhor do que uma FK simples para `User`, porque a regra de negocio ja fica protegida no schema.

Importante sobre exclusao:
- como essa relacao usa `workspaceId` obrigatorio junto com `assigneeId`, o default implicito do Prisma nao e `SetNull`
- por isso a equipe nao deve assumir que apagar um `WorkspaceMember` vai limpar automaticamente o `assignee` das tasks

### 4. Comment

`Comment` representa um comentario de texto em uma task.

Campos principais:
- `taskId`
- `authorId`
- `text`
- `createdAt`
- `updatedAt`

Relacoes:
- `task -> Task`
- `author -> User`

Comportamento esperado:
- comentarios pertencem a uma task
- se a task for removida, os comentarios dela tambem sao removidos
- o autor do comentario continua sendo um usuario do sistema

### 5. Attachment

`Attachment` representa um arquivo anexado a uma task.

Campos principais:
- `taskId`
- `uploaderId`
- `fileName`
- `fileSize`
- `mimeType`
- `storageKey`
- `createdAt`

Relacoes:
- `task -> Task`
- `uploader -> User`

Importante sobre `storageKey`:
- o banco nao guarda a URL final do arquivo
- o banco guarda a chave estavel do arquivo no storage
- depois o backend pode gerar uma URL temporaria ou assinada a partir dessa chave

Isso e melhor do que salvar `url` diretamente, porque:
- a URL pode mudar
- a URL pode expirar
- a chave do storage costuma ser o identificador persistente real

### Regras de exclusao e impacto

#### 1. Ao remover uma task

Se uma `Task` for removida:
- os `Comment` da task sao removidos em cascade
- os `Attachment` da task sao removidos em cascade

#### 2. Ao remover um membro do workspace

Hoje, com a modelagem atual, a equipe nao deve assumir que remover um `WorkspaceMember` vai ajustar automaticamente as tasks ligadas a ele.

Motivo tecnico:
- como a relacao usa `workspaceId` obrigatorio, o default implicito nao e `SetNull`

Na pratica, a equipe ainda pode escolher entre:
- desatribuir as tasks dele, deixando `assigneeId = null`
- reatribuir essas tasks para outro membro
- bloquear a remocao por regra de negocio, se quiser um comportamento mais estrito

#### 3. Ao remover um field

Hoje, com a modelagem atual, nao sera possivel remover um `Field` se ainda existirem tasks naquele field.

Antes de remover o field, a equipe precisara:
- mover as tasks para outro field
- ou remover essas tasks

Isso foi modelado assim porque `fieldId` e obrigatorio em `Task`, e porque a coluna do board e parte central do fluxo da task.

#### 4. Ao remover um subject

Se um `Subject` for removido:
- a task nao e removida
- apenas o vinculo com `subject` vira `null`

### Mudancas necessarias para a equipe

Para essa modelagem funcionar com o restante do codigo, os pontos abaixo ainda precisam ser implementados ou ajustados.

#### DTOs de task

Mudancas necessarias:
- alinhar os DTOs com o schema atual, porque hoje eles ainda recebem `status` em vez de `fieldId`
- enquanto o contrato da API nao mudar, o backend precisa traduzir `status` para `fieldId`
- manter atencao no tipo de `priority`, porque o DTO hoje trabalha com `low|medium|high` e o Prisma usa enum

#### TasksService

Mudancas necessarias:
- trocar a persistencia para usar `fieldId` no banco
- se a API receber `status`, fazer o mapeamento para `fieldId`
- manter `assigneeId` como id do usuario, mas usando a relacao composta do schema
- validar que o assignee pertence ao mesmo workspace da task
- mapear corretamente `priority` entre DTO e Prisma

#### AttachmentsService


Mudancas necessarias:
- trocar o shape atual do mock (`name`, `size`, `type`, `url`)
- passar a usar (`fileName`, `fileSize`, `mimeType`, `storageKey`)
- se o endpoint ainda quiser devolver `url`, gerar essa URL a partir de `storageKey`

Exemplo conceitual:
- banco salva `storageKey = tasks/task_1/arquivo.pdf`
- endpoint devolve `url = <gerada em tempo de execucao a partir do storageKey>`

#### Fluxo de remocao de membro

Arquivos impactados:
- service de workspace
- possivelmente regras administrativas do modulo de tasks

Mudancas necessarias:
- antes de remover um membro, desatribuir ou reatribuir as tasks dele

#### Fluxo de remocao de field

Mudancas necessarias:
- antes de remover um field, mover ou remover as tasks que ainda apontam para ele

## Grupo: FriendRequest e Friendship

Esse grupo representa o dominio de amizade entre usuarios:
- `FriendRequest` representa um pedido de amizade pendente entre dois usuarios.
- `Friendship` representa uma amizade ja estabelecida entre dois usuarios.

### 1. FriendRequest

`FriendRequest` representa a intencao de um usuario se conectar com outro.

Campos principais:
- `senderId`: usuario que enviou o pedido
- `receiverId`: usuario que recebeu o pedido
- `createdAt`

Relacoes:
- `sender -> User`
- `receiver -> User`

Pontos importantes:
- esse model existe apenas para pedidos pendentes
- na modelagem atual, o pedido nao guarda `status`
- quando o pedido for aceito ou rejeitado, a ideia e remover esse registro
- `@@unique([senderId, receiverId])` impede duplicidade do mesmo pedido no mesmo sentido
- os indices em `senderId` e `receiverId` ajudam nas listagens de pedidos enviados e recebidos

### 2. Friendship

`Friendship` representa a conexao ativa entre dois usuarios.

Campos principais:
- `userAId`
- `userBId`
- `createdAt`

Relacoes:
- `userA -> User`
- `userB -> User`

Pontos importantes:
- esse model representa amizade aceita, nao pedido pendente
- `@@unique([userAId, userBId])` impede duplicidade do mesmo par salvo no mesmo sentido
- os indices em `userAId` e `userBId` ajudam a buscar amizades de um usuario por qualquer lado da relacao
- para a regra de unicidade funcionar bem no dominio, a equipe precisa salvar sempre o par em ordem canonica
- em outras palavras, a aplicacao deve decidir quem vira `userAId` e quem vira `userBId` de forma consistente antes de persistir

### Regras de exclusao e impacto

#### 1. Ao remover um user

Se um `User` for removido:
- `FriendRequest` enviados por ele sao removidos em cascade
- `FriendRequest` recebidos por ele tambem sao removidos em cascade
- `Friendship` em que ele aparece como `userA` ou `userB` sao removidas em cascade

Na pratica:
- o usuario sai automaticamente do grafo de amizades
- nao ficam pedidos ou amizades apontando para usuarios inexistentes

#### 2. Ao aceitar um pedido de amizade

Quando um `FriendRequest` for aceito:
- a equipe deve criar um registro em `Friendship`
- depois disso, o `FriendRequest` deve ser removido

Na pratica:
- o pedido pendente deixa de existir
- a fonte de verdade passa a ser `Friendship`

#### 3. Ao rejeitar um pedido de amizade

Quando um `FriendRequest` for rejeitado:
- a equipe nao precisa criar nenhum outro registro
- basta remover o `FriendRequest`

Na pratica:
- como nao existe campo `status` no pedido, rejeitar significa encerrar e apagar o registro

#### 4. Ao remover uma amizade

Se uma `Friendship` for removida:
- os usuarios deixam de aparecer como amigos um do outro
- isso nao afeta os registros de `User`

Na pratica:
- desfazer amizade e uma operacao isolada sobre a tabela `Friendship`

### Mudancas necessarias para a equipe

Para essa modelagem funcionar com o restante do codigo, os pontos abaixo ainda precisam ser implementados ou ajustados.

#### FriendsService

Mudancas necessarias:
- substituir os mocks por persistencia real com Prisma
- fazer `listFriends` consultar `Friendship` nos dois lados da relacao
- carregar os dados publicos do outro usuario para montar o card de amigo
- fazer `listRequests` consultar `FriendRequest` enviados e recebidos pelo usuario autenticado
- fazer `removeFriend` localizar e remover a amizade pelo par canonico

#### Fluxo de envio de pedido

Mudancas necessarias:
- validar se o usuario alvo existe antes de criar `FriendRequest`
- impedir pedido para si mesmo
- impedir duplicidade de pedido no mesmo sentido
- impedir tambem pedido invertido, quando ja existir um pedido do outro usuario para o usuario atual
- impedir criacao de pedido quando a amizade ja existir

#### Fluxo de resposta ao pedido

Mudancas necessarias:
- garantir que apenas o `receiverId` possa responder ao pedido
- no aceite, criar `Friendship` e remover `FriendRequest`
- na recusa, apenas remover `FriendRequest`
- executar esse fluxo de forma transacional para evitar inconsistencias

#### Regra de par canonico

Mudancas necessarias:
- antes de criar `Friendship`, ordenar os dois ids de usuario de forma consistente
- salvar sempre o menor id em `userAId` e o maior em `userBId`, ou outra regra fixa escolhida pelo time
- usar essa mesma regra em consultas, remocao de amizade e verificacao de duplicidade

#### DTOs e contrato de resposta

Mudancas necessarias:
- manter `targetUserId` como entrada do endpoint, traduzindo isso para `receiverId` no banco
- decidir se a resposta de listagem vai expor pedidos enviados e recebidos no mesmo payload ou em secoes separadas
- alinhar o retorno de amizade com o contrato atual de user card, especialmente no campo de presenca

## Grupo: Message

Esse grupo representa o dominio de mensagens privadas entre usuarios:
- `Message` representa uma mensagem enviada de um usuario para outro em uma conversa 1:1.

### 1. Message

`Message` representa uma mensagem individual trocada entre dois usuarios.

Campos principais:
- `senderId`: usuario que enviou a mensagem
- `receiverId`: usuario que recebeu a mensagem
- `text`: conteudo textual da mensagem
- `readAt`: momento em que a mensagem foi lida
- `createdAt`

Relacoes:
- `sender -> User`
- `receiver -> User`

Pontos importantes:
- esse model foi pensado para conversas privadas entre dois usuarios
- `readAt` foi escolhido no lugar de um booleano como `isRead`
- isso permite saber nao apenas se a mensagem foi lida, mas tambem quando ela foi lida
- a listagem de mensagens entre dois usuarios depende de busca bidirecional entre `senderId` e `receiverId`
- os indices foram pensados para ajudar tanto na consulta da conversa quanto na contagem de mensagens nao lidas
- `receiverId` com `readAt = null` tende a ser a base natural para calcular `unreadCount`

### Regras de exclusao e impacto

#### 1. Ao remover um user

Se um `User` for removido:
- mensagens enviadas por ele sao removidas em cascade
- mensagens recebidas por ele tambem sao removidas em cascade

Na pratica:
- a conversa desaparece automaticamente do ponto de vista daquele usuario removido
- nao ficam mensagens apontando para usuarios inexistentes

#### 2. Ao ler uma mensagem

Quando uma `Message` for lida:
- a equipe nao precisa criar outro registro
- basta preencher `readAt`

Na pratica:
- `readAt = null` representa mensagem ainda nao lida
- `readAt` preenchido representa mensagem lida e registra o momento da leitura

#### 3. Ao listar uma conversa

Quando a aplicacao buscar a conversa entre dois usuarios:
- ela deve considerar mensagens enviadas e recebidas pelos dois lados
- isso significa consultar tanto `senderId = A, receiverId = B` quanto `senderId = B, receiverId = A`

Na pratica:
- a conversa nao pertence a um unico lado da relacao
- ela e formada pela uniao cronologica das mensagens trocadas entre os dois usuarios

#### 4. Ao montar a lista de conversas

Quando a aplicacao listar conversas de um usuario:
- ela deve agrupar mensagens pelo outro participante
- para cada conversa, deve localizar a mensagem mais recente
- tambem deve calcular quantas mensagens recebidas ainda estao com `readAt = null`

Na pratica:
- `Message` e a fonte de verdade tanto para o historico quanto para o preview da conversa

### Mudancas necessarias para a equipe

Para essa modelagem funcionar com o restante do codigo, os pontos abaixo ainda precisam ser implementados ou ajustados.

#### ChatService

Mudancas necessarias:
- substituir os mocks por persistencia real com Prisma
- fazer `getMessages` buscar mensagens nos dois sentidos da conversa
- ordenar os resultados por `createdAt`
- fazer `sendMessage` persistir `senderId`, `receiverId`, `text`, `createdAt` e `readAt = null`
- fazer `getConversations` agrupar por outro usuario, localizar a ultima mensagem e calcular `unreadCount`

#### Fluxo de leitura de mensagem

Mudancas necessarias:
- definir em que momento `readAt` sera preenchido
- decidir se isso acontece ao abrir a conversa, ao buscar mensagens ou por endpoint/evento separado
- garantir que apenas o `receiverId` possa marcar a mensagem como lida

#### Fluxo de envio de mensagem

Mudancas necessarias:
- validar se o usuario destino existe antes de criar `Message`
- decidir se o sistema vai permitir mensagem apenas entre amigos ou entre quaisquer usuarios
- se a regra for amizade obrigatoria, validar a existencia de `Friendship` antes do envio

#### DTOs e contrato de resposta

Mudancas necessarias:
- manter `toUserId` no DTO de entrada, traduzindo isso para `receiverId` no banco
- manter `readAt` no retorno da API, porque esse campo ja esta alinhado com o service atual
- continuar omitindo `receiverId` da resposta de listagem de mensagens, se esse for o contrato adotado pelo time

## Grupo: Notification

Esse grupo representa o dominio de notificacoes do usuario:
- `Notification` representa uma notificacao entregue a um usuario especifico.

### 1. Notification

`Notification` representa um evento exibido para um `User`.

Campos principais:
- `userId`: usuario dono da notificacao
- `type`: tipo da notificacao, como `FRIEND_REQUEST`, `WORKSPACE_INVITE`, `TASK_ASSIGNED` ou `MENTION`
- `content`: campo preparado para notificacao simples
- `title`: titulo opcional para notificacao rica
- `message`: mensagem opcional para notificacao rica
- `isRead`: indica se a notificacao ja foi lida
- `relatedEntityId`: identificador opcional da entidade relacionada
- `resource`: estrutura opcional em JSON para payload rico
- `createdAt`

Relacoes:
- `user -> User`

Pontos importantes:
- esse model foi deixado preparado para dois formatos de notificacao
- o formato simples pode usar apenas `content`
- o formato rico pode usar `title`, `message` e `resource`
- `relatedEntityId` pode servir como referencia leve quando a equipe nao quiser depender de um payload JSON mais completo
- `isRead` atende bem aos fluxos atuais de marcar uma notificacao ou todas como lidas
- os indices foram pensados para listagem cronologica por usuario e contagem de notificacoes nao lidas
- depois que a equipe decidir o formato final, os campos nao utilizados podem ser removidos do schema

### Regras de exclusao e impacto

#### 1. Ao remover um user

Se um `User` for removido:
- as `Notification` ligadas a ele sao removidas em cascade

Na pratica:
- o usuario perde automaticamente o seu historico de notificacoes
- nao ficam notificacoes apontando para usuarios inexistentes

#### 2. Ao marcar uma notificacao como lida

Quando uma `Notification` for marcada como lida:
- a equipe nao precisa criar outro registro
- basta atualizar `isRead` para `true`

Na pratica:
- o fluxo de leitura e uma simples atualizacao do registro existente

#### 3. Ao marcar todas como lidas

Quando a aplicacao executar o fluxo de marcar tudo como lido:
- ela deve atualizar todas as notificacoes do usuario com `isRead = false`

Na pratica:
- esse fluxo funciona bem com `updateMany`
- o indice por `userId` e `isRead` ajuda esse tipo de operacao

#### 4. Ao listar notificacoes

Quando a aplicacao listar notificacoes de um usuario:
- ela deve filtrar por `userId`
- normalmente deve ordenar por `createdAt`
- opcionalmente pode aplicar filtros como lidas e nao lidas

Na pratica:
- `Notification` vira a fonte de verdade tanto para a lista principal quanto para o contador de nao lidas

### Mudancas necessarias para a equipe

Para essa modelagem funcionar com o restante do codigo, os pontos abaixo ainda precisam ser implementados ou ajustados.

#### NotificationsService

Mudancas necessarias:
- substituir os mocks por persistencia real com Prisma
- fazer `findAll` consultar notificacoes por `userId`
- ordenar a listagem por `createdAt`
- fazer `getUnreadCount` usar `count` com `userId` e `isRead = false`
- fazer `markAllAsRead` usar `updateMany` nas notificacoes nao lidas do usuario
- fazer `update` validar posse da notificacao antes de alterar `isRead`
- fazer `remove` validar posse da notificacao antes de apagar

#### NotificationsController

Mudancas necessarias:
- passar `userId` autenticado para `update`
- passar `userId` autenticado para `remove`
- manter os endpoints atuais, mas com validacao de ownership no service

#### Formato simples ou rico

Mudancas necessarias:
- a equipe precisa decidir se a API final vai expor notificacao simples, rica ou ambas
- se optar pelo formato simples, usar `content` como campo principal de exibicao
- se optar pelo formato rico, usar `title`, `message` e `resource`
- se os dois formatos coexistirem, definir regra clara de preenchimento para evitar registros ambiguos

#### DTOs e contrato de resposta

Mudancas necessarias:
- alinhar o `NotificationDto` com o formato final escolhido pela equipe
- se o time mantiver o formato simples, o DTO atual fica mais proximo do schema
- se o time adotar o formato rico, o DTO precisara incluir `title`, `message` e possivelmente `resource`
- normalizar o service atual, porque o mock usa `read` e `message`, enquanto o schema usa `isRead` e tambem suporta `content`
