# Roteiro de Modulos e Pontuacao

## Tabela de Pontos por Modulo

| Categoria | Modulo Escolhido | Pontos | Requisitos do subject (para validar) | Justificativa / Complexidade |
| --- | --- | --- | --- | --- |
| Web | [Framework Front & Back](https://www.google.com/search?q=%23framework-front--back) | 2 (Major) | Framework no frontend + framework no backend. | React + NestJS. Base do projeto. |
| Web | [Real-time Features](https://www.google.com/search?q=%23real-time-features) | 2 (Major) | Updates em tempo real, lidar com conexao/desconexao. | WebSockets (Socket.io). Motor do app. |
| Web | [Allow users to interact](https://www.google.com/search?q=%23allow-users-to-interact) | 2 (Major) | Chat basico + perfil + amigos (pacote completo). | Comunicacao via mensagens diretas. |
| User Mgmt | [Standard User Mgmt](https://www.google.com/search?q=%23standard-user-mgmt) | 2 (Major) | Update de perfil, avatar, amigos + status online. | Autenticacao e identidade visual. |
| User Mgmt | [Organization System](https://www.google.com/search?q=%23organization-system) | 2 (Major) | Criar/editar/deletar orgs, gerir membros. | Workspaces onde o Kanban vai existir. |
| Web | [Use an ORM](https://www.google.com/search?q=%23use-an-orm) | 1 (Minor) | Usar um ORM para o banco de dados. | Prisma integrado ao PostgreSQL. |
| Web | [Notification System](https://www.google.com/search?q=%23notification-system) | 1 (Minor) | Notificacoes para acoes de criacao, update e delecao. | Feedback via WebSockets (sino/toast). |
| User Mgmt | [Remote Auth (OAuth)](https://www.google.com/search?q=%23remote-auth-oauth) | 1 (Minor) | Autenticacao com OAuth 2.0. | Login com a API da 42. |
| Web | [Real-time Collaborative](https://www.google.com/search?q=%23real-time-collaborative) | 1 (Minor) | Funcionalidades colaborativas em tempo real. | Sincronizacao do drag-and-drop no Kanban. |
| Web | [Advanced Search](https://www.google.com/search?q=%23advanced-search) | 1 (Minor) | Busca com filtros, ordenacao e paginacao. | Encontrar tarefas por status/responsavel. |
| Web | [File Upload](https://www.google.com/search?q=%23file-upload) | 1 (Minor) | Upload com multiplos tipos, validacao e delete. | Anexar arquivos (PDF/Imagens) nas tarefas. |
| TOTAL | | 16 Pontos | | Seguranca de 2 pontos de margem. |

## Entregaveis de validacao

* Tela de login com formulario padrao e botao "Login 42" (OAuth).
* Perfil do usuario editavel com upload de avatar e fallback para imagem padrao.
* Sistema de amigos funcional com indicador de status (online/offline).
* Chat em tempo real para mensagens diretas entre usuarios.
* Tela de Organizacoes (Workspaces) com CRUD completo e adicao de membros.
* Board Kanban da Organizacao com tarefas divididas em colunas (To Do, In Progress, Done).
* Sincronizacao colaborativa: mover um card no Kanban atualiza a tela de outros membros instantaneamente.
* Barra de busca avancada para filtrar tarefas do Board.
* Capacidade de anexar, visualizar e deletar arquivos dentro de uma tarefa.
* Alertas visuais (notificacoes) para eventos importantes no sistema.

## Explicacoes dos Modulos

### Framework Front & Back

Objetivo: usar um framework no frontend e outro no backend.

O que fazer do zero:

* Frontend: criar o app com React (Vite), definindo rotas e componentes.
* Backend: criar a API com NestJS, estruturando modulos, controllers e services.
* Integracao: garantir que o React consuma a API Rest do NestJS.

Checklist de validacao:

* App frontend renderizado via React.
* App backend rodando em NestJS.
* Sem erros no console do navegador durante a navegacao basica.

### Real-time Features

Objetivo: infraestrutura de atualizacoes em tempo real.

O que fazer do zero:

* Configurar servidor de WebSockets (Socket.io) no NestJS.
* Implementar logica de conexao, desconexao e geracao de "Rooms".
* Conectar o client React ao servidor WebSocket.

Checklist de validacao:

* Conexao WebSocket estabelecida com sucesso.
* Reconexao automatica em caso de queda de rede.
* Eventos de broadcast funcionam corretamente.

### Allow users to interact

Objetivo: permitir interacao direta e social entre usuarios.

O que fazer do zero:

* Criar interface de chat para mensagens diretas (1-on-1).
* Implementar logica de enviar/receber mensagens persistidas no banco.
* Criar logica de enviar/aceitar/rejeitar convites de amizade.

Checklist de validacao:

* Usuarios conseguem trocar mensagens de texto no chat.
* E possivel acessar o perfil de outro usuario.
* Lista de amigos pode ser gerenciada (adicionar/remover).

### Standard User Mgmt

Objetivo: gestao de conta, seguranca e identidade do usuario.

O que fazer do zero:

* Rotas de cadastro e edicao de dados (nome, bio).
* Gerenciamento de sessao (JWT).
* Integrar o status do WebSocket (online/offline) a entidade do usuario.

Checklist de validacao:

* Edicao de perfil salva no banco de dados.
* Se o usuario nao subir foto, um avatar padrao e exibido.
* A "bolinha" de status de um amigo fica verde quando ele loga.

### Organization System

Objetivo: criar os espacos de trabalho (Workspaces) para organizar as tarefas.

O que fazer do zero:

* CRUD completo de Organizacoes.
* Tabela pivot para associar Usuarios as Organizacoes com "Roles" (Admin, Member).
* Vincular as tarefas diretamente ao ID da Organizacao.

Checklist de validacao:

* Usuario cria, edita e deleta uma Organizacao (se for Admin).
* Usuario convida/adiciona outros usuarios ao Workspace.
* Membros veem apenas as tarefas das organizacoes as quais pertencem.

### Use an ORM

Objetivo: gerenciar o banco de dados atraves de mapeamento objeto-relacional.

O que fazer do zero:

* Definir o `schema.prisma` com todas as tabelas e relacoes.
* Gerar os client types para usar no NestJS.
* Configurar e rodar as migracoes no PostgreSQL.

Checklist de validacao:

* Nao ha strings de SQL puro soltas no codigo.
* Banco de dados reflete exatamente as migracoes do Prisma.

### Notification System

Objetivo: alertar os usuarios de forma passiva sobre mudancas.

O que fazer do zero:

* Criar componentes de UI (Toasts ou dropdown de sino).
* Disparar eventos via WebSocket quando uma tarefa for criada, atualizada ou deletada no Workspace.

Checklist de validacao:

* Se uma tarefa e deletada, um alerta visual aparece.
* Notificacoes nao exigem "F5" para aparecerem.

### Remote Auth (OAuth)

Objetivo: permitir login simplificado via provedores externos.

O que fazer do zero:

* Registrar a aplicacao na intranet da 42 para obter as credenciais.
* Criar a rota de redirecionamento e a rota de callback no NestJS.
* Gerar o JWT interno do app apos o sucesso do login via 42.

Checklist de validacao:

* Fluxo de login via botao da 42 funciona do inicio ao fim.
* O usuario autenticado tem seu perfil criado/atualizado na base de dados.

### Real-time Collaborative

Objetivo: sincronizar o estado visual do Kanban entre multiplos clientes.

O que fazer do zero:

* Integrar a biblioteca de Drag-and-Drop do React com os WebSockets.
* Emitir um evento `task_moved` quando um card for solto em uma nova coluna.
* Ouvir o evento `task_moved` no Frontend e reposicionar o card na UI dos outros usuarios.

Checklist de validacao:

* Com dois navegadores abertos no mesmo Kanban, arrastar um card em um faz com que ele se mova instantaneamente no outro.

### Advanced Search

Objetivo: encontrar tarefas de forma eficiente dentro de um Workspace.

O que fazer do zero:

* Criar endpoint `GET /tasks` que processe *query parameters*.
* Construir a barra de busca e os dropdowns de filtro no frontend.
* Implementar a logica de paginacao (limit/offset) no Prisma.

Checklist de validacao:

* Busca por texto (titulo da tarefa) retorna os itens corretos.
* Filtros (ex: Mostrar apenas status "Done") funcionam e podem ser combinados.
* Paginacao divide os resultados adequadamente.

### File Upload

Objetivo: permitir o armazenamento local de recursos anexados as tarefas.

O que fazer do zero:

* Configurar o `Multer` (ou similar) no NestJS para interceptar *multipart/form-data*.
* Validar no backend os tipos de arquivo (extensoes) e o tamanho limite.
* Salvar os arquivos em um diretorio mapeado via volume no Docker.

Checklist de validacao:

* Upload de imagens ou PDFs vinculados a uma tarefa funciona.
* O sistema rejeita ativamente arquivos executaveis ou maiores que o permitido.
* O arquivo pode ser baixado/visualizado e deletado pelo usuario.
