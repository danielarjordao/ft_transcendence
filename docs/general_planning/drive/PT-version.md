# **ft\_transcendence: Plataforma de Gerenciamento de Tarefas**

---

## **Resumo Executivo**

Este documento apresenta um plano abrangente para desenvolver uma plataforma colaborativa de gerenciamento de tarefas para nosso projeto ft\_transcendence. A plataforma funcionará como um sistema de quadro Kanban estilo Notion, onde equipes podem organizar trabalho em múltiplos workspaces, criar tarefas sob diferentes assuntos/categorias e colaborar em tempo real.

A solução proposta atende todos os requisitos obrigatórios do subject e alcança 16 pontos de módulos, proporcionando um buffer de 2 pontos para avaliação.

---

## **Visão do Produto**

### **O Que Estamos Construindo**

Uma plataforma web de gerenciamento de tarefas onde equipes podem:

**Funcionalidade Principal:**

* Criar workspaces (Organizações) para diferentes equipes ou projetos  
* Organizar tarefas sob assuntos/categorias dentro de cada workspace  
* Visualizar trabalho usando quadros Kanban (A Fazer, Em Progresso, Concluído)(ou Eisenhower model)  
* Mover tarefas entre colunas e categorias com arrastar e soltar  
* Atribuir tarefas a membros da equipe  
* Acompanhar progresso e prazos  
* Colaborar através de comentários e chat  
* Receber notificações de atualizações  
* Anexar arquivos às tarefas

**Experiência do Usuário:** Pense nisso como um workspace simplificado do Notion focado em gerenciamento de tarefas. Usuários fazem login, selecionam ou criam um workspace, veem seus quadros Kanban organizados por assunto/categoria, e podem mover tarefas perfeitamente enquanto colaboram com colegas em tempo real.

### **Fluxos Principais do Usuário**

**Jornada do Novo Usuário:**

1. Cadastrar com email/senha ou OAuth (Google/GitHub)  
2. Fazer upload da foto de perfil  
3. Criar primeiro workspace ou ser convidado para um existente  
4. Criar assuntos (ex: "Desenvolvimento Backend", "Design UI", "Documentação")  
5. Criar tarefas sob assuntos  
6. Atribuir tarefas, definir prazos, adicionar descrições  
7. Mover tarefas pelos estágios de workflow (colunas)  
8. Adicionar amigos para conectar com outros usuários  
9. Conversar com colegas de equipe  
10. Receber notificações sobre atualizações de tarefas

**Jornada Diária do Usuário:**

1. Fazer login e ver dashboard com todos os workspaces  
2. Selecionar workspace para visualizar quadro Kanban  
3. Ver tarefas organizadas por assunto em colunas  
4. Arrastar tarefa de "A Fazer" para "Em Progresso"  
5. Adicionar comentário com atualização de progresso  
6. Anexar screenshot ou documento  
7. Mencionar colega no comentário  
8. Colega recebe notificação  
9. Mover tarefa concluída para "Concluído"  
10. Verificar chat para discussões da equipe

---

## **Recomendação de Stack Técnica**

### **Frontend**

**React com TypeScript**

* Arquitetura baseada em componentes  
* Tipagem forte reduz bugs  
* Documentação extensa e comunidade ativa  
* Bom para colaboração em equipe

**Tailwind CSS**

* Desenvolvimento rápido de UI  
* Estilização consistente  
* Sem conflitos de CSS  
* Design responsivo fácil

### **Backend**

**Node.js com NestJS (TypeScript)**

* TypeScript end-to-end (mesma linguagem frontend/backend)  
* Arquitetura estruturada built-in  
* Excelente para projetos em equipe  
* Suporte a WebSocket incluído  
* Injeção de dependência e modularidade

### **Banco de Dados**

**PostgreSQL com Prisma ORM**

* Banco de dados relacional robusto  
* Queries de banco de dados type-safe  
* Gerenciamento visual de schema  
* Migrations fáceis  
* Lida bem com relacionamentos complexos

### **Comunicação em Tempo Real**

**Socket.io**

* Implementação confiável de WebSocket  
* Suporte built-in para salas  
* Reconexão automática  
* Mecanismos de fallback

### **Deploy**

**Docker \+ Docker Compose**

* Deploy com um único comando  
* Ambientes consistentes  
* Setup fácil para equipe  
* Atende requisitos do subject

---

## **Seleção de Módulos (16 Pontos)**

### **Base Obrigatória (10 pontos)**

**1\. Web \- Usar frameworks (Major \- 2pts)**

* React frontend \+ NestJS backend  
* Cobertura completa de framework full-stack

**2\. Web \- Recursos em tempo real (Major \- 2pts)**

* Atualizações de tarefas ao vivo entre todos os usuários conectados  
* Mensagens de chat em tempo real  
* Notificações instantâneas  
* Indicadores de presença ao vivo

**3\. Web \- Interação entre usuários (Major \- 2pts)**

* Sistema de chat entre usuários  
* Perfis de usuário com exibição de informações  
* Sistema de amigos (adicionar/remover, ver lista de amigos)

**4\. Gerenciamento de Usuários \- Padrão (Major \- 2pts)**

* Atualizar informações de perfil  
* Upload e mudança de avatar  
* Adicionar amigos e ver status online  
* Páginas de perfil exibindo informações do usuário

**5\. Web \- ORM (Minor \- 1pt)**

* Prisma para acesso ao banco de dados type-safe

**6\. Web \- Sistema de notificações (Minor \- 1pt)**

* Notificações para criação de tarefas  
* Notificações para atualizações de tarefas  
* Notificações para exclusão de tarefas  
* Notificações para comentários  
* Notificações para atribuições

### **Adições Estratégicas (6 pontos)**

**7\. Gerenciamento de Usuários \- OAuth (Minor \- 1pt)**

* Autenticação Google  
* Autenticação GitHub  
* Vinculação de conta sem problemas

**8\. Gerenciamento de Usuários \- Sistema de organização (Major \- 2pts)**

* Criar workspaces (organizações)  
* Adicionar/remover usuários de workspaces  
* Atribuir papéis (admin, membro, visualizador)  
* Executar ações específicas do workspace

**9\. Web \- Recursos colaborativos em tempo real (Minor \- 1pt)**

* Quadros Kanban compartilhados  
* Visibilidade ao vivo de movimento de tarefas  
* Suporte a edição simultânea

**10\. Web \- Busca avançada (Minor \- 1pt)**

* Filtrar tarefas por status  
* Filtrar por responsável  
* Filtrar por prazo  
* Opções de ordenação  
* Busca por palavras-chave

**11\. Web \- Upload de arquivos (Minor \- 1pt)**

* Anexar arquivos às tarefas  
* Suporte a múltiplos tipos de arquivo  
* Validação de tamanho e tipo  
* Armazenamento seguro  
* Preview de arquivo quando possível

**Total: 16 pontos** (buffer de segurança de 2 pontos)

---

## **Schema do Banco de Dados**

### **Tabelas Principais**

**Users (Usuários)**

* ID do Usuário  
* Email (único)  
* Hash da senha  
* Nome de usuário  
* URL do avatar  
* Status online  
* Timestamps de criação/atualização

**Organizations (Workspaces)**

* ID da Organização  
* Nome  
* Descrição  
* Criado por (referência de usuário)  
* Timestamps de criação/atualização

**Organization Members (Membros da Organização)**

* ID do Membro  
* ID da Organização  
* ID do Usuário  
* Papel (admin, membro, visualizador)  
* Data de entrada

**Subjects (Categorias)**

* ID do Assunto  
* ID da Organização  
* Nome  
* Código de cor  
* Ordem de exibição

**Tasks (Tarefas)**

* ID da Tarefa  
* ID do Assunto  
* Título  
* Descrição  
* Status (todo, in\_progress, done)  
* Prioridade (baixa, média, alta)  
* Atribuído a (referência de usuário)  
* Criado por (referência de usuário)  
* Prazo  
* Timestamps de criação/atualização

**Comments (Comentários)**

* ID do Comentário  
* ID da Tarefa  
* ID do Usuário  
* Conteúdo  
* Timestamp de criação

**Attachments (Anexos)**

* ID do Anexo  
* ID da Tarefa  
* Nome do arquivo  
* URL do arquivo  
* Uploaded por (referência de usuário)  
* Timestamp de upload

**Friends (Amigos)**

* ID da Amizade  
* ID do Usuário  
* ID do Amigo  
* Status (pendente, aceito)  
* Timestamp de criação

**Messages (Mensagens)**

* ID da Mensagem  
* ID do Remetente  
* ID do Destinatário  
* Conteúdo  
* Status de leitura  
* Timestamp de criação

**Notifications (Notificações)**

* ID da Notificação  
* ID do Usuário  
* Tipo  
* Conteúdo  
* Status de leitura  
* ID da entidade relacionada  
* Timestamp de criação

---

## **Detalhamento de Funcionalidades**

### **Fase 1: Fundação (Deve Completar Primeiro)**

**Setup do Projeto**

* Inicializar repositório Git com estrutura clara  
* Configurar Docker e Docker Compose  
* Configurar ambiente de desenvolvimento  
* Criar template de variáveis de ambiente  
* Configurar básicos de CI/CD

**Sistema de Autenticação**

* Registro de usuário com validação de email  
* Login seguro (hashing de senha com bcrypt)  
* Gerenciamento de token JWT  
* Fluxo de reset de senha  
* Gerenciamento de sessão

**Infraestrutura de Banco de Dados**

* Desenhar schema completo  
* Configurar Prisma ORM  
* Criar migrations iniciais  
* Popular banco com dados de teste  
* Estabelecer relacionamentos

**Estrutura Básica do Frontend**

* Setup da aplicação React  
* Configuração de roteamento  
* Componentes de layout  
* Páginas de autenticação  
* Rotas protegidas

**Entrega:** Usuários podem registrar, fazer login e acessar dashboard protegido

---

### **Fase 2: Gerenciamento Central de Tarefas**

**Perfis de Usuário**

* Ver página de perfil  
* Editar informações de perfil  
* Upload/mudança de avatar  
* Sistema de avatar padrão  
* Configurações de perfil

**Gerenciamento de Organização**

* Criar workspace  
* Editar detalhes do workspace  
* Deletar workspace (apenas admin)  
* Ver membros do workspace  
* Convidar usuários para workspace

**Sistema de Assunto/Categoria**

* Criar assuntos dentro do workspace  
* Atribuir cores aos assuntos  
* Reordenar assuntos  
* Editar nomes de assuntos  
* Deletar assuntos (com tratamento de tarefas)

**Operações CRUD de Tarefas**

* Criar tarefa sob assunto  
* Ver detalhes da tarefa  
* Editar informações da tarefa  
* Deletar tarefa  
* Atribuir tarefa a usuário  
* Definir prioridade da tarefa  
* Definir prazos

**Interface do Quadro Kanban**

* Exibir tarefas em colunas (A Fazer, Em Progresso, Concluído)  
* Agrupar tarefas por assunto  
* Distinção visual entre assuntos  
* Cards de tarefa com informações essenciais  
* Cabeçalhos de coluna e contadores

**Entrega:** Usuários podem gerenciar workspaces, criar assuntos e realizar operações CRUD completas em tarefas com visualização básica Kanban

---

### **Fase 3: Recursos de Colaboração**

**Sistema de Amigos**

* Enviar pedido de amizade  
* Aceitar/recusar pedidos  
* Ver lista de amigos  
* Remover amigos  
* Ver status online de amigos  
* Buscar usuários para adicionar

**Sistema de Chat**

* Mensagens diretas entre amigos  
* Entrega de mensagens em tempo real  
* Histórico de mensagens  
* Confirmações de leitura  
* Indicadores de digitação  
* Lista de chat com preview da última mensagem

**Comentários em Tarefas**

* Adicionar comentário à tarefa  
* Ver histórico de comentários  
* Editar próprios comentários  
* Deletar próprios comentários  
* Mencionar usuários com símbolo @  
* Exibição de timestamp

**Entrega:** Usuários podem adicionar amigos, conversar em tempo real e discutir tarefas através de comentários

---

### **Fase 4: Tempo Real & Recursos Avançados**

**Atualizações de Tarefas em Tempo Real**

* Criação de tarefa ao vivo entre clientes  
* Atualizações de tarefa ao vivo entre clientes  
* Exclusão de tarefa ao vivo entre clientes  
* Movimento de tarefa ao vivo entre colunas  
* Atualizações de atribuição ao vivo  
* Indicadores de presença (quem está visualizando)

**Sistema de Notificações**

* Notificações de atribuição de tarefas  
* Notificações de menção em comentários  
* Notificações de atualização de tarefas  
* Notificações de pedido de amizade  
* Notificações de mensagens  
* Funcionalidade de marcar como lido  
* Dropdown/painel de notificações

**Arrastar e Soltar**

* Arrastar tarefas entre colunas  
* Arrastar tarefas entre assuntos  
* Animações suaves  
* Atualizações otimistas  
* Resolução de conflitos

**Sistema de Upload de Arquivos**

* Anexar arquivos às tarefas  
* Suporte a múltiplos arquivos  
* Validação de tipo de arquivo (imagens, PDFs, documentos)  
* Limites de tamanho de arquivo (10MB por arquivo)  
* Preview para imagens  
* Funcionalidade de download  
* Deletar anexos

**Entrega:** Colaboração completa em tempo real com Kanban de arrastar e soltar, notificações e anexos de arquivo

---

### **Fase 5: Melhorias & OAuth**

**Integração OAuth**

* Setup de OAuth Google  
* Setup de OAuth GitHub  
* Vinculação de conta  
* Importação de foto de perfil OAuth  
* Fallback para email/senha

**Busca e Filtros Avançados**

* Buscar tarefas por palavra-chave  
* Filtrar por status  
* Filtrar por responsável  
* Filtrar por intervalo de prazo  
* Filtrar por prioridade  
* Opções de ordenação (data, prioridade, alfabética)  
* Combinar múltiplos filtros  
* Salvar presets de filtro (opcional)

**Polimento de UI**

* Design responsivo (mobile, tablet, desktop)  
* Estados de carregamento  
* Tratamento de erros  
* Estados vazios  
* Feedback de sucesso  
* Estilização consistente  
* Melhorias de acessibilidade

**Entrega:** Autenticação OAuth funcionando, busca avançada funcional, UI responsiva polida

---

### **Fase 6: Testes & Documentação**

**Testes**

* Validação de frontend (todos os formulários)  
* Validação de backend (todos os endpoints)  
* Teste de recursos em tempo real  
* Teste cross-browser (Chrome, Firefox, Safari)  
* Teste de responsividade mobile  
* Teste de performance  
* Auditoria de segurança

**Documentação**

* README.md completo com todas as seções requeridas  
* Página de Política de Privacidade (acessível pelo rodapé)  
* Página de Termos de Serviço (acessível pelo rodapé)  
* Documentação da API  
* Comentários no código  
* Guia de setup do ambiente  
* Instruções de deploy

**Endurecimento de Segurança**

* Configuração HTTPS  
* Setup de CORS  
* Rate limiting  
* Sanitização de input  
* Prevenção de XSS  
* Proteção CSRF  
* Upload de arquivo seguro

**Polimento Final**

* Corrigir todos os erros de console  
* Remover código de debug  
* Otimizar tamanho do bundle  
* Otimização de banco de dados  
* Limpar dependências não usadas  
* Revisão final de código

**Entrega:** Aplicação pronta para produção com documentação completa, sem erros e implementação completa de segurança

---

## **Framework de Distribuição de Trabalho**

O trabalho está dividido em áreas claras de responsabilidade. Membros da equipe podem escolher baseado em seus interesses e forças. O objetivo é contribuição equilibrada entre tarefas de frontend, backend e full-stack.

### **Responsabilidades Focadas em Backend**

**Autenticação & Segurança**

* Endpoints de registro e login de usuário  
* Geração e validação de token JWT  
* Implementação de hashing de senha  
* Integração OAuth (Google, GitHub)  
* Configuração HTTPS  
* Middleware de segurança (CORS, rate limiting)  
* Gerenciamento de sessão

**Banco de Dados & ORM**

* Desenhar e implementar schema de banco de dados  
* Configurar Prisma ORM  
* Criar migrations  
* Escrever queries de banco de dados  
* Otimizar performance do banco de dados  
* Lidar com relacionamentos  
* Scripts de seed de dados

**Desenvolvimento de API**

* Design de endpoints RESTful  
* Validação de requisições  
* Tratamento de erros  
* Formatação de respostas  
* Documentação da API  
* Implementação de paginação  
* Otimização de queries

**Sistema de Upload de Arquivos**

* Endpoint de upload de arquivo  
* Validação de tipo de arquivo  
* Limites de tamanho de arquivo  
* Armazenamento seguro de arquivos  
* Endpoint de recuperação de arquivo  
* Endpoint de exclusão de arquivo  
* Gerar URLs de arquivo

**Eventos WebSocket**

* Configurar servidor Socket.io  
* Definir handlers de eventos  
* Gerenciamento de salas (por workspace)  
* Lógica de broadcast  
* Tratamento de conexão/desconexão  
* Tratamento de erros para sockets

**Carga de Trabalho Estimada:** 35% do projeto total

---

### **Responsabilidades Focadas em Frontend**

**Biblioteca de Componentes UI**

* Setup de design system  
* Componentes reutilizáveis (botões, inputs, cards)  
* Componentes de layout  
* Componentes de navegação  
* Componentes de modal/diálogo  
* Componentes de formulário  
* Estados de carregamento  
* Estados de erro

**Interface de Gerenciamento de Tarefas**

* Layout do quadro Kanban  
* Design de cards de tarefa  
* Implementação de arrastar e soltar  
* Formulários de criação de tarefa  
* Formulários de edição de tarefa  
* Visão de detalhes da tarefa  
* Exibição de assunto/categoria  
* Gerenciamento de colunas

**Páginas da Interface do Usuário**

* Layout do dashboard  
* Seleção de workspace  
* Páginas de perfil  
* Páginas de configurações  
* Páginas de login/cadastro  
* Interface de chat  
* Lista de amigos  
* Painel de notificações

**Atualizações de UI em Tempo Real**

* Setup de cliente Socket.io  
* Escutar atualizações de tarefas  
* Atualizar UI em eventos  
* Atualizações otimistas de UI  
* Lidar com conflitos  
* Indicadores de presença  
* Indicadores de digitação ao vivo

**Design Responsivo**

* Layouts mobile  
* Layouts tablet  
* Layouts desktop  
* Interações touch  
* Navegação mobile  
* Quadro Kanban responsivo

**Carga de Trabalho Estimada:** 35% do projeto total

---

### **Responsabilidades Full-Stack**

**Sistema de Organização**

* Backend: Endpoints CRUD de organização  
* Backend: Gerenciamento de membros  
* Backend: Permissões baseadas em papéis  
* Frontend: UI de criação de workspace  
* Frontend: UI de gerenciamento de membros  
* Frontend: Configurações de organização  
* Integração: Conectar frontend ao backend

**Sistema de Chat**

* Backend: Armazenamento de mensagens  
* Backend: Recuperação de mensagens  
* Backend: Eventos WebSocket de mensagens  
* Frontend: Interface de chat  
* Frontend: Lista de mensagens  
* Frontend: Atualizações de mensagens em tempo real  
* Integração: Fluxo de mensagens end-to-end

**Sistema de Notificações**

* Backend: Lógica de criação de notificações  
* Backend: Recuperação de notificações  
* Backend: Endpoint de marcar como lido  
* Frontend: Painel de notificações  
* Frontend: Badges de notificações  
* Frontend: Atualizações de notificações em tempo real  
* Integração: Gatilhos de notificação

**Busca & Filtro**

* Backend: Endpoints de busca  
* Backend: Lógica de filtros  
* Backend: Otimização de queries  
* Frontend: Interface de busca  
* Frontend: Controles de filtro  
* Frontend: Exibição de resultados de busca  
* Integração: Conectar UI de busca à API

**Sistema de Amigos**

* Backend: Lógica de pedido de amizade  
* Backend: Endpoints de aceitar/recusar  
* Backend: Endpoint de lista de amigos  
* Frontend: UI de adicionar amigo  
* Frontend: UI de pedidos de amizade  
* Frontend: Exibição de lista de amigos  
* Integração: Atualizações de status online

**Carga de Trabalho Estimada:** 30% do projeto total

---

### **Responsabilidades Compartilhadas (Todos)**

**DevOps & Deploy**

* Configuração Docker  
* Setup Docker Compose  
* Variáveis de ambiente  
* Scripts de deploy  
* Setup de CI/CD (se houver tempo)

**Testes**

* Testes unitários para próprio código  
* Testes de integração  
* Correção de bugs  
* Revisão de código para colegas  
* Testes cross-browser

**Documentação**

* Seções do README  
* Política de Privacidade  
* Termos de Serviço  
* Comentários no código  
* Documentação da API (backend)  
* Documentação de componentes (frontend)

**Gerenciamento de Projeto**

* Standups diários/semanais  
* Rastreamento de tarefas  
* Workflow Git (branches, PRs, merges)  
* Comunicação  
* Relatórios de progresso

---

## **Diretrizes de Implementação Técnica**

### **Workflow Git**

**Estrutura de Branches:**

* `main` \- código pronto para produção  
* `develop` \- branch de integração  
* `feature/[nome-da-feature]` \- features individuais  
* `bugfix/[nome-do-bug]` \- correções de bugs

**Formato de Mensagem de Commit:**

\[tipo\]: Descrição breve

Exemplos:  
feat: Adiciona endpoint de criação de tarefa  
fix: Resolve bug de arrastar e soltar  
docs: Atualiza README com setup OAuth  
style: Formata código com Prettier  
refactor: Reestrutura serviço de auth

**Processo de Pull Request:**

1. Criar branch de feature a partir de `develop`  
2. Implementar feature com commits  
3. Push da branch para GitHub  
4. Criar PR para `develop`  
5. Solicitar review de pelo menos um colega  
6. Abordar comentários de review  
7. Merge após aprovação  
8. Deletar branch de feature

---

### **Checklist de Segurança**

**Autenticação:**

*  Senhas com hash bcrypt (mínimo 10 salt rounds)  
*  Tokens JWT com expiração razoável (7 dias)  
*  Fluxo de reset de senha seguro  
*  Tokens OAuth armazenados com segurança  
*  Sem senhas em logs

**Segurança de API:**

*  HTTPS forçado em todo lugar  
*  CORS configurado adequadamente  
*  Rate limiting em endpoints  
*  Validação de input em todos os endpoints  
*  Prevenção de SQL injection (Prisma cuida disso)  
*  Prevenção de XSS (React cuida da maioria)  
*  Tokens CSRF para mudanças de estado

**Upload de Arquivo:**

*  Whitelist de tipos de arquivo (apenas imagens, PDFs, documentos)  
*  Tamanho máximo de arquivo forçado (10MB)  
*  Sanitizar nomes de arquivo  
*  Armazenar arquivos fora do webroot  
*  Scanning de vírus (se possível)  
*  Acesso apenas autenticado

**Geral:**

*  Variáveis de ambiente para secrets  
*  Arquivo .env no .gitignore  
*  Sem credenciais hardcoded  
*  Mensagens de erro não vazam info  
*  Logging implementado  
*  Headers de segurança configurados

---

### **Template de Variáveis de Ambiente**

Criar arquivo `.env.example`:

bash  
\# Database  
DATABASE\_URL\="postgresql://user:password@localhost:5432/taskmanager"

\# Authentication  
JWT\_SECRET\="sua-chave-secreta-jwt-mude-isso"  
JWT\_EXPIRATION\="7d"

\# OAuth \- Google  
GOOGLE\_CLIENT\_ID\="seu-google-client-id"  
GOOGLE\_CLIENT\_SECRET\="seu-google-client-secret"  
GOOGLE\_CALLBACK\_URL\="http://localhost:3000/auth/google/callback"

\# OAuth \- GitHub  
GITHUB\_CLIENT\_ID\="seu-github-client-id"  
GITHUB\_CLIENT\_SECRET\="seu-github-client-secret"  
GITHUB\_CALLBACK\_URL\="http://localhost:3000/auth/github/callback"

\# File Upload  
MAX\_FILE\_SIZE\="10485760"  
UPLOAD\_DIR\="./uploads"  
ALLOWED\_FILE\_TYPES\="image/jpeg,image/png,image/gif,application/pdf,application/msword"

\# Application  
NODE\_ENV\="development"  
PORT\="3000"  
FRONTEND\_URL\="http://localhost:3001"

\# Redis (para sessões, opcional)  
REDIS\_HOST\="localhost"  
REDIS\_PORT\="6379"  
---

### **Estrutura do Projeto**

ft\_transcendence/  
├── docker-compose.yml  
├── .env.example  
├── .gitignore  
├── README.md  
├── backend/  
│   ├── Dockerfile  
│   ├── package.json  
│   ├── tsconfig.json  
│   ├── prisma/  
│   │   └── schema.prisma  
│   └── src/  
│       ├── main.ts  
│       ├── auth/  
│       ├── users/  
│       ├── organizations/  
│       ├── tasks/  
│       ├── chat/  
│       ├── notifications/  
│       └── uploads/  
├── frontend/  
│   ├── Dockerfile  
│   ├── package.json  
│   ├── tsconfig.json  
│   └── src/  
│       ├── App.tsx  
│       ├── components/  
│       ├── pages/  
│       ├── hooks/  
│       ├── services/  
│       └── utils/  
└── docs/  
    ├── PRIVACY\_POLICY.md  
    └── TERMS\_OF\_SERVICE.md  
---

## **Critérios de Sucesso**

### **Requisitos Técnicos**

*  Todos os 16 módulos totalmente implementados e funcionais  
*  Sem erros no console do navegador  
*  HTTPS configurado adequadamente  
*  Funciona no Chrome mais recente (primário), Firefox, Safari  
*  Responsivo mobile (funciona em celulares e tablets)  
*  Tempo de carregamento de página abaixo de 3 segundos  
*  Recursos em tempo real funcionam suavemente  
*  Todos os formulários têm validação (frontend e backend)  
*  Schema de banco de dados adequadamente estruturado com relacionamentos  
*  Deploy Docker funciona com um único comando

### **Requisitos de Funcionalidades**

*  Usuários podem registrar e fazer login com segurança  
*  OAuth funciona para Google e GitHub  
*  Usuários podem criar workspaces  
*  Usuários podem adicionar assuntos/categorias  
*  Tarefas podem ser criadas, editadas, deletadas  
*  Quadro Kanban exibe tarefas adequadamente  
*  Arrastar e soltar funciona suavemente  
*  Atualizações em tempo real visíveis entre clientes  
*  Chat funciona entre amigos  
*  Notificações aparecem para todas as ações  
*  Arquivos podem ser anexados às tarefas  
*  Busca e filtro funcionam com precisão  
*  Sistema de amigos funcional

### **Requisitos de Documentação**

*  README.md completo com todas as seções  
*  Papéis da equipe documentados  
*  Abordagem de gerenciamento de projeto descrita  
*  Stack técnica justificada  
*  Schema de banco de dados visualizado  
*  Lista de funcionalidades com contribuidores  
*  Justificativas de módulos fornecidas  
*  Contribuições individuais detalhadas  
*  Página de Política de Privacidade acessível  
*  Página de Termos de Serviço acessível

---

## **Recursos de Aprendizado**

### **React \+ TypeScript**

* Documentação oficial React (react.dev)  
* Handbook TypeScript  
* React TypeScript cheatsheet

### **NestJS**

* Documentação oficial NestJS  
* Curso de fundamentos NestJS  
* Tutorial de API de gerenciamento de tarefas

### **Prisma**

* Guia quickstart Prisma  
* Referência de schema  
* Guia Prisma com PostgreSQL

### **Socket.io**

* Documentação oficial Socket.io  
* Tutorial de chat em tempo real  
* Guia Socket.io com React

### **Tailwind CSS**

* Documentação oficial Tailwind  
* Exemplos de componentes  
* Guia de design responsivo

---

## **Preparação para Avaliação**

### **O Que os Avaliadores Vão Verificar**

**Requisitos Obrigatórios:**

1. É uma aplicação web com frontend, backend e banco de dados?  
2. Git mostra commits de todos os membros com mensagens claras?  
3. Deploy Docker funciona com um comando?  
4. Compatível com Chrome mais recente?  
5. Sem erros de console?  
6. Páginas de Política de Privacidade e Termos presentes e acessíveis?  
7. Múltiplos usuários podem usá-la simultaneamente?

