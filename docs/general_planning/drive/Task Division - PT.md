## **Murilo: Dados & Autenticação (25% do projeto)**

### **Responsabilidades Principais**

**Arquitetura de Banco de Dados**

* Desenhar schema completo do PostgreSQL  
* Implementar todos os modelos e relacionamentos do Prisma  
* Criar e gerenciar migrations  
* Escrever scripts de seed com dados de teste  
* Otimizar queries e indexes  
* Lidar com joins complexos e relações

**Sistema de Autenticação**

* Endpoints de registro e login de usuário  
* Geração e validação de token JWT  
* Hashing de senha com bcrypt  
* Gerenciamento de sessão  
* Fluxo de reset de senha  
* Integração OAuth (Google \+ GitHub)  
* Lógica de refresh de token

**Infraestrutura de Segurança**

* Configuração HTTPS  
* Setup de CORS  
* Implementação de rate limiting  
* Middleware de sanitização de input  
* Configuração de headers de segurança  
* Gerenciamento de variáveis de ambiente  
* Validação de API key

**Armazenamento de Arquivos**

* Schema de banco de dados para metadados de arquivo  
* Estratégia de armazenamento de arquivos  
* Lógica de controle de acesso para arquivos  
* Otimização de queries para recuperação de arquivos

### **Responsabilidades de Suporte**

* Colaborar com Daniela nos requisitos de dados dos endpoints da API  
* Fornecer suporte de otimização de queries de banco de dados  
* Revisar PRs de backend para preocupações de segurança  
* Documentar schema de banco de dados e relacionamentos

---

## **Daniela: Core Backend (25% do projeto)**

### **Responsabilidades Principais**

**Desenvolvimento de API**

* Design e implementação de endpoints RESTful  
* Schemas de validação de requisições  
* Tratamento de erros e formatação de respostas  
* Documentação da API  
* Lógica de paginação  
* Camada de lógica de negócio

**Servidor WebSocket**

* Configuração do servidor Socket.io  
* Handlers de eventos em tempo real  
* Gerenciamento de salas (baseado em workspace)  
* Lógica de broadcast para atualizações de tarefas  
* Tratamento de conexão/desconexão  
* Autenticação de socket

**Funcionalidades Core de Backend**

* Endpoints CRUD de organização  
* Endpoints CRUD de tarefas  
* Gerenciamento de assunto/categoria  
* Endpoints do sistema de comentários  
* Lógica do sistema de amigos  
* Endpoints de mensagens de chat  
* Lógica de criação de notificações

**Backend de Upload de Arquivo**

* Implementação de endpoint de upload de arquivo  
* Validação de tipo e tamanho de arquivo  
* Tratamento seguro de arquivos  
* Geração de URL de arquivo  
* Endpoint de exclusão de arquivo

### **Responsabilidades de Suporte**

* Colaborar com Murilo nos requisitos de dados  
* Trabalhar com equipe Frontend nos contratos de API  
* Code review para PRs de backend  
* Testes e debugging de backend

---

## **Lucas: Core Frontend (25% do projeto)**

### **Responsabilidades Principais**

**Biblioteca de Componentes UI**

* Setup de design system com Tailwind  
* Biblioteca de componentes reutilizáveis (botões, inputs, cards, modais)  
* Componentes de formulário com validação  
* Componentes de layout (headers, sidebars, footers)  
* Componentes de estados de loading e erro  
* Variantes de componentes responsivos

**Interface de Gerenciamento de Tarefas**

* Implementação do layout do quadro Kanban  
* Design e exibição de cards de tarefa  
* Funcionalidade de arrastar e soltar (react-beautiful-dnd ou dnd-kit)  
* Modal/formulário de criação de tarefa  
* Visão de detalhes da tarefa  
* Interface de edição de tarefa  
* UI de gerenciamento de colunas  
* Organização visual de assunto/categoria

**Páginas da Interface do Usuário**

* Layout do dashboard  
* Página de seleção de workspace  
* Páginas de configurações  
* Visualização de perfil de usuário  
* Interface de lista de amigos  
* Páginas de gerenciamento de organização

**Design Responsivo**

* Layouts mobile para todas as páginas  
* Otimização de breakpoint tablet  
* Tratamento de interação touch  
* Menu de navegação mobile  
* Quadro Kanban responsivo

### **Responsabilidades de Suporte**

* Colaborar com Ana na arquitetura de componentes  
* Integrar eventos do cliente Socket.io  
* Testes de frontend  
* Code review para PRs de frontend

---

## **Ana Laura: Líder Frontend & Integração (25% do projeto)**

### **Responsabilidades Principais**

**Autenticação & Roteamento**

* Setup e configuração do React Router  
* Implementação de rotas protegidas  
* Componentes de página de login/cadastro  
* Integração OAuth no frontend  
* Gerenciamento de estado de autenticação  
* Componente de upload de avatar  
* Interface de edição de perfil

**Integração de Funcionalidades em Tempo Real**

* Setup do cliente Socket.io  
* Event listeners de WebSocket  
* Lógica de atualização de UI em tempo real  
* Atualizações otimistas de UI  
* Tratamento de resolução de conflitos  
* Indicadores de presença  
* Indicadores de digitação ao vivo

**Gerenciamento de Estado**

* Arquitetura de estado global (Context API ou Zustand)  
* Camada de integração de API  
* Configuração de cliente HTTP (Axios)  
* Hooks de busca de dados  
* Gerenciamento de cache  
* Implementação de error boundary

**Funcionalidades Avançadas**

* Implementação de interface de chat  
* Lista de mensagens com atualizações em tempo real  
* Painel/dropdown de notificações  
* Sistema de badge de notificações  
* Interface de busca  
* Controles de filtro  
* Exibição de resultados de busca avançada

**Integração & Coordenação**

* Definição de contrato de API com equipe Backend  
* Testes de integração Frontend-Backend  
* Integração de componentes  
* Padronização de tratamento de erros  
* Padrões de estados de loading

### **Responsabilidades de Suporte**

* Liderança de code review para frontend  
* Coordenar com Lucas no uso de componentes  
* Trabalhar com Daniela nos requisitos de API  
* Documentação de arquitetura frontend

---

## **Responsabilidades Compartilhadas (Todos \- 20% cada)**

### **DevOps & Deploy**

**Todos os membros da equipe**

* Entendimento da configuração Docker  
* Manutenção do arquivo Docker Compose  
* Documentação de setup de ambiente  
* Testes de deployment

### **Documentação**

**Murilo**: Documentação de schema de banco de dados, docs de segurança de API **Daniela**: Documentação de endpoints de API, docs de eventos WebSocket **Lucas**: Documentação de biblioteca de componentes, padrões de UI **Ana Laura**: Docs de integração, docs de gerenciamento de estado **Todos**: Seções do README, Política de Privacidade, Termos de Serviço

### **Testes & Qualidade**

**Cada pessoa testa seu próprio trabalho**

* Testes unitários para próprio código  
* Participação em testes de integração  
* Correção de bugs na própria área  
* Testes cross-browser  
* Code reviews para equipe

### **Gerenciamento de Projeto**

**Todos os membros igualmente**

* Participar de standups/check-ins  
* Atualizar status de tarefas  
* Participação no workflow Git (branches, PRs)  
* Comunicação da equipe  
* Relatório de progresso

---

## **Pontos de Colaboração Entre Equipes**

### **Murilo ↔ Daniela**

* Alinhamento de schema de banco de dados com necessidades de API  
* Discussões de otimização de queries  
* Coordenação de implementação de segurança  
* Tratamento de tokens OAuth

### **Daniela ↔ Ana Laura**

* Definição de contrato de API  
* Especificações de eventos WebSocket  
* Coordenação de funcionalidades em tempo real  
* Formatação de respostas de erro

### **Lucas ↔ Ana Laura**

* Decisões de arquitetura de componentes  
* Padrões de gerenciamento de estado  
* Design de API de componentes reutilizáveis  
* Estratégia de design responsivo

### **Equipe Frontend ↔ Equipe Backend**

* Reuniões semanais de sync de API  
* Documentação compartilhada Postman/API  
* Sessões de testes de integração  
* Coordenação de triagem de bugs

---

## **Propriedade de Módulos**

### **Murilo Lidera**

* Gerenciamento de Usuários \- OAuth (Minor \- 1pt)  
* Web \- ORM (Minor \- 1pt)  
* Infraestrutura de banco de dados para todos os módulos

### **Daniela Lidera**

* Web \- Funcionalidades em tempo real (Major \- 2pts)  
* Web \- Interação de usuários (Major \- 2pts)  
* Web \- Sistema de notificações (Minor \- 1pt)

### **Lucas Lidera**

* Web \- Busca avançada (Minor \- 1pt)  
* Gerenciamento de Usuários \- Padrão (Major \- 2pts) *compartilhado com Ana*  
* Interface Kanban para todos os módulos de tarefa

### **Ana Laura Lidera**

* Web \- Usar frameworks (Major \- 2pts) *papel de coordenação*  
* Gerenciamento de Usuários \- Sistema de organização (Major \- 2pts)  
* Web \- Funcionalidades colaborativas em tempo real (Minor \- 1pt)  
* Web \- Upload de arquivos (Minor \- 1pt)

**Total: 16 pontos entre todos os membros**

---

## **Distribuição de Trabalho Baseada em Fases**

### **Fase 1: Fundação**

* **Murilo**: Schema de banco de dados \+ Setup de Auth  
* **Daniela**: Estrutura básica de API \+ endpoints  
* **Lucas**: Biblioteca de componentes \+ layouts básicos  
* **Ana Laura**: Setup React \+ roteamento \+ páginas de auth

### **Fase 2: Funcionalidades Core**

* **Murilo**: OAuth \+ setup de armazenamento de arquivos  
* **Daniela**: Endpoints CRUD (orgs, tarefas, assuntos)  
* **Lucas**: Quadro Kanban \+ cards de tarefa  
* **Ana Laura**: Gerenciamento de estado \+ integração de API

### **Fase 3: Colaboração**

* **Murilo**: Camada de dados do sistema de amigos  
* **Daniela**: Endpoints de chat \+ eventos WebSocket  
* **Lucas**: UI de amigos \+ páginas de perfil  
* **Ana Laura**: Interface de chat \+ integração em tempo real

### **Fase 4: Tempo Real & Avançado**

* **Murilo**: Dados de notificação \+ metadados de arquivo  
* **Daniela**: Lógica de notificação \+ endpoint de upload de arquivo  
* **Lucas**: Drag-drop \+ UI de busca  
* **Ana Laura**: Painel de notificação \+ coordenação WebSocket

### **Fase 5: Melhorias**

* **Murilo**: Endurecimento de segurança \+ polimento OAuth  
* **Daniela**: Otimização de API \+ estabilidade WebSocket  
* **Lucas**: Polimento de UI \+ correções responsivas  
* **Ana Laura**: Integração de busca \+ funcionalidades avançadas

### **Fase 6: Testes & Documentação**

* **Todos**: Testes da própria área \+ documentação  
* **Ana Laura**: Liderança de testes de integração  
* **Murilo**: Docs de banco de dados \+ docs de segurança  
* **Daniela**: Documentação de API  
* **Lucas**: Documentação de componentes

