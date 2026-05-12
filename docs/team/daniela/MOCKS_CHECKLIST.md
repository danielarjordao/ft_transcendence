# Checklist: Integração Frontend / Backend

1. Módulo de Chat (Estimativa: 2 a 3 horas)

[-] Criar chat.service.ts: Fazer métodos para listar conversas ativas e histórico.

[-] Limpar Mocks do Painel: Remover constants/chat.ts (MOCK_CONVERSATIONS) e MOCK_SEED.

[-] Carregar Dados Reais: Adicionar useEffect para carregar mensagens da API.

[-] Unir REST + Sockets: Sincronizar mensagens novas do Socket com o histórico.

2. Módulo de Notificações (Estimativa: 2 a 3 horas)

[-] Criar notifications.service.ts: Implementar GET /notifications e PATCH /notifications/:id/read.

[-] Limpar Falsos Contadores: Apagar a importação da variável totalUnread da Navbar, e também removê-la dos componentes onde está injetada: Dashboard.tsx, Profile.tsx e KanbanBoard.tsx.

[-] Limpar Mocks de Lista: Substituir INITIAL_NOTIFICATIONS pela lista real da API.

[-] Ligar Handlers e Sockets: Ligar o "Mark as Read" ao backend e usar o socket.on para receber notificações em tempo real.

3. Módulo de Amigos (Estimativa: 3 a 4 horas)

[-] Criar friends.service.ts: Implementar os métodos CRUD (listar, adicionar, aceitar, recusar, remover).

[-] Carregamento Inicial: Substituir MOCK_FRIENDS, pendentes e enviados por chamadas reais no mount do componente Friends.tsx.

[-] Ligar Handlers: Trocar a manipulação de arrays locais nos botões por requests HTTP.

4. Módulo de Perfil e Segurança (Estimativa: 2 a 3 horas)

[-] Ligar o Save Profile: No ProfilePanel.tsx, trocar o console.log por PATCH /api/users/me.

[-] Desbloquear o Upload S3: Enviar a imagem do AvatarUpload.tsx via FormData para a AWS.

[-] Estatísticas Reais (Profile.tsx e WorkspaceCard): Atualizar o backend (GET /users/me) para devolver o número de tarefas atribuídas (assignedTasksCount) e o GET /workspaces para devolver o taskCount de cada workspace.

5. Módulo Workspace Settings (Estimativa: 1 a 2 horas)

[-] Listar Membros Reais: Remover o MOCK_MEMBERS e usar workspacesService.listMembers().

[-] Ligar Remoção e Cores: Ligar a mudança de Accent Color e a remoção de membros aos endpoints de PATCH e DELETE.

6. Módulo Kanban (Estimativa: 4 a 6 horas)

[-] Criar Services Base (Essenciais): Criar os 3 serviços explícitos tasks.service.ts, fields.service.ts e subjects.service.ts.

[-] Ajustar o Zustand: Remover updateBoard e getBoard do workspace.store.ts (mas manter a lista de workspaces para o alternador/switcher).

[-] Ligar Carregamento e CRUD: Fazer chamadas GET reais para carregar o board e trocar as criações de Date.now() por chamadas reais POST/PATCH/DELETE.

[-] Conectar Anexos ao S3: Enviar os ficheiros da AttachmentZone para a AWS via FormData.

[-] Ligar Sockets do Board: Ouvir os eventos exatos do NestJS (task_created, task_updated, task_deleted, e field_created) para atualizar a interface em tempo real.
