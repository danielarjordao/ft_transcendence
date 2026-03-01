# Documento de Requisitos e Fluxo de Trabalho (Fazelo)

**1. Telas Públicas:**

* **Landing Page:** Apresentação do app e botões principais.
* **Sign In & Sign Up:** Páginas de login e criação de conta.
* **Forgot Password:** Página para recuperação de senha.

**2. Telas Privadas (Autenticadas):**

* **Dashboard (Home):** Lista de Workspaces aos quais o usuário tem acesso.
  * **Novo Workspace:** Botão para criar um novo workspace, com visualização expandida para a criação (nome, descrição, subjects iniciais).
  * **Filtro de Workspaces:** Barra de busca para filtrar os projetos por nome.
* **Workspace (Kanban Board):**
  * **Colunas:** Representam o status da tarefa (ex: To Do, In Progress, Done).
  * **Barra Superior:** Exibição dos subjects (tags) do workspace, com opção de criar novos subjects ou novas colunas para organizar as tarefas.
  * **Filtros:** Por Subject (Tema/Tag), Prioridade e Usuário responsável.
  * **Membros:** Lista de membros do workspace, com opção de convidar novos usuários por email.
  * **Nova Tarefa:** Botão para criar uma nova tarefa dentro do workspace.
  * **Detalhes da Tarefa (Modal):** Visualização expandida do card contendo Descrição, Status, Prioridade, Responsável, Data de Entrega (Due Date), área de Anexos e Comentários internos.
* **Página de Perfil:** Exibe as informações do usuário (nome, email, foto, breve bio). Permite edição de dados, alteração de avatar e preferências (ex: tema).
* **Configurações de Conta:** Gerenciamento de segurança (alterar senha, 2FA) e preferências de notificação.
* **Página de Notificações:** Lista completa com opções de filtro (marcações, convites), marcar como lida e exclusão.

**3. Header:**

* **Dropdown de Notificações:** Lista recente (marcações, convites). Clicar leva ao contexto (tarefa/workspace). Inclui botão "Ver Todas" redirecionando para a página dedicada.
* **Chat:** Expande gaveta lateral com últimas conversas 1x1. Permite ver histórico, enviar mensagens e iniciar nova conversa com qualquer usuário.
* **Dark Mode Toggle:** Botão para alternar entre os temas claro e escuro.
* **Menu de Perfil:** Ícone (avatar) com dropdown para Perfil, Configurações e Log Out.

**4. Fluxo de Trabalho e Regras do Repositório:**

* **Git & Branches:** O desenvolvimento será feito isolado em feature branches. O merge para a branch `main` só será autorizado via Pull Request (PR) quando a funcionalidade estiver 100% pronta. Após o merge, a branch utilizada deve ser excluída e uma nova criada para a próxima feature.
* **Commits:** Uso estrito e obrigatório do padrão Conventional Commits (ex: feat:, fix:, chore:).
* **Infraestrutura:** O setup base do Docker já está montado. A infraestrutura se tornará mais robusta gradativamente.
* **Sincronização e Reuniões:**
  * Reunião Geral (Todo o grupo): Quinzenal.
  * Reunião Frontend (Ana e Lucas): Semanal.
  * Reunião Backend/DB (Daniela e Murilo): Semanal.
