# **Próximos Passos: Setup Primário do Projeto**

## **Semana 1: Fundação e Alinhamento**

---

### **Dia 2-3: Wireframes e User Flow (COMEÇAR AQUI)**

Por quê fazer isso primeiro:

* Alinha a visão de todos antes de escrever código  
* Identifica problemas de UX cedo  
* Define claramente o que backend precisa suportar  
* Serve como referência durante desenvolvimento  
* Facilita discussões sobre funcionalidades

Ferramentas sugeridas:

* Figma (gratuito, colaborativo, recomendado)  
* Excalidraw (simples, rápido para wireframes)  
* FigJam (brainstorming visual)  
* Até papel e foto serve para começar\!

O que criar:  
1\. User Flow Principal  
Login/Cadastro → Dashboard → Selecionar Workspace → Ver Kanban → Criar Tarefa → Mover Tarefa → Colaborar  
pensar em: Como vai ser o movimento das tarefas dentro do kanban (clica e carrega, botao de “mover para”?)  
Desenhar cada tela como um retângulo simples com:

* Elementos principais (navbar, sidebar, área de conteúdo)  
* Ações possíveis (botões, links)  
* Setas mostrando navegação

2\. Wireframes de Telas Principais (Lucas lidera, Ana apoia)  
Criar wireframes simples (sem cores, sem detalhes) para:

*  Tela de login/cadastro \- Ana  
*  Dashboard (lista de workspaces) \- Lucas   
*  Workspace \- Visão Kanban principal  
*  Modal de criação de tarefa  
*  Modal de detalhes da tarefa  
*  Sidebar de chat  
*  Dropdown de notificações  
*  Página de perfil  
*  Página de configurações de workspace

3\. Estrutura de Dados Visual (Murilo lidera, Daniela contribui)  
Enquanto Lucas e Ana fazem wireframes, Murilo e Daniela podem começar:

* Desenhar entidades principais (User, Organization, Task, etc.)  
* Mostrar relacionamentos entre entidades  
* Listar campos principais de cada entidade  
* Identificar queries complexas necessárias

Saída Esperada:

* Link do Figma/Excalidraw compartilhado com wireframes  
* User flow documentado  
* Esboço de estrutura de dados  
* Screenshot/PDF dos wireframes salvos no repositório

---

### **Dia 3-4: Setup Técnico Inicial**

Atividade Paralela: Enquanto design está sendo finalizado  
Daniela  
\# Criar estrutura de pastas  
ft\_transcendence/  
├── .gitignore  
├── README.md  
├── docker-compose.yml  
├── .env.example  
├── backend/  
│   ├── .gitignore  
│   ├── Dockerfile  
│   └── package.json (criar depois)  
├── frontend/  
│   ├── .gitignore  
│   ├── Dockerfile  
│   └── package.json (criar depois)  
└── docs/  
    ├── wireframes/ (salvar PDFs aqui)  
    └── meetings/ (atas de reunião)  
\`\`\`

\*\*Tarefas:\*\*  
\- \[ \] Criar repositório no GitHub  
\- \[ \] Adicionar todos os membros como colaboradores  
\- \[ \] Criar estrutura de pastas  
\- \[ \] Configurar .gitignore apropriado  
\- \[ \] Criar docker-compose.yml básico (PostgreSQL \+ Redis)  
\- \[ \] Criar .env.example com variáveis necessárias  
\- \[ \] Documentar no README como rodar o setup

\*\*Daniela: Pesquisa Técnica de Backend\*\*  
\- \[ \] Revisar documentação do NestJS  
\- \[ \] Revisar documentação do Socket.io  
\- \[ \] Identificar bibliotecas necessárias (bcrypt, jwt, etc.)  
\- \[ \] Criar lista de dependências do package.json

\*\*Lucas: Pesquisa Técnica de Frontend\*\*  
\- \[ \] Revisar documentação do React \+ TypeScript  
\- \[ \] Pesquisar bibliotecas de drag-and-drop (react-beautiful-dnd vs dnd-kit)  
\- \[ \] Identificar componentes UI necessários  
\- \[ \] Criar lista de dependências do package.json

\*\*Ana Laura: Definição de Contratos de API\*\*  
Baseado nos wireframes, começar a listar endpoints necessários:  
\`\`\`  
POST /api/auth/register  
POST /api/auth/login  
GET /api/workspaces  
POST /api/workspaces  
GET /api/workspaces/:id/tasks  
...  
Saída Esperada:

* Repositório criado e estruturado  
* Docker configurado para PostgreSQL  
* Listas de dependências preparadas  
* Documento inicial de API endpoints

---

### **Dia 5: Revisão e Refinamento**

Reunião de Revisão (2 horas \- Toda a equipe)  
Agenda:

1. Apresentar wireframes finalizados  
2. Walkthrough do user flow  
3. Discussão: o que está faltando?  
4. Validar estrutura de dados proposta  
5. Revisar lista de endpoints de API  
6. Aprovar design e estrutura

Perguntas para responder:

* Os wireframes cobrem todas as funcionalidades dos 16 módulos?  
* A estrutura de dados suporta todas as funcionalidades?  
* A navegação faz sentido?  
* Há algo confuso ou ambíguo?  
* Todos entendem como as peças se conectam?

Atividade Final: Cada pessoa escolhe sua primeira tarefa para Semana 2:

* Murilo: "Vou criar o schema do Prisma"  
* Daniela: "Vou configurar o projeto NestJS"  
* Lucas: "Vou configurar o projeto React \+ biblioteca de componentes"  
* Ana Laura: "Vou configurar rotas e páginas de autenticação"

Saída Esperada:

* Design aprovado por todos  
* Estrutura de dados validada  
* Primeiras tarefas definidas  
* Todos sabem o que fazer na Semana 2

---

## **Semana 2: Implementação da Fundação**

### **Setup de Ambiente (Todos \- Dia 1\)**

Cada pessoa clona o repositório e configura localmente:  
bash  
\# Clonar repositório  
git clone \[url-do-repositorio\]  
cd ft\_transcendence

\# Copiar arquivo de ambiente  
cp .env.example .env  
\# Editar .env com valores locais

\# Iniciar serviços Docker  
docker-compose up \-d

\# Verificar que PostgreSQL está rodando  
docker ps  
Verificação:

*  Todos conseguem rodar `docker-compose up` sem erros  
*  Todos conseguem conectar ao PostgreSQL  
*  Todos têm o ambiente configurado

---

### **Murilo: Schema de Banco de Dados (Dia 1-3)**

Criar schema inicial do Prisma baseado nos wireframes e discussões:  
prisma  
// prisma/schema.prisma

model User {  
  id            String    @id @default(uuid())  
  email         String    @unique  
  passwordHash  String  
  username      String  
  avatarUrl     String?  
  isOnline      Boolean   @default(false)  
  createdAt     DateTime  @default(now())  
  updatedAt     DateTime  @updatedAt  
    
  // Relações  
  organizations OrganizationMember\[\]  
  createdTasks  Task\[\]     @relation("TaskCreator")  
  assignedTasks Task\[\]     @relation("TaskAssignee")  
  comments      Comment\[\]  
  // ... outras relações  
}

model Organization {  
  id          String   @id @default(uuid())  
  name        String  
  description String?  
  createdById String  
  createdAt   DateTime @default(now())  
  updatedAt   DateTime @updatedAt  
    
  members     OrganizationMember\[\]  
  subjects    Subject\[\]  
}

// ... continuar com outros modelos  
Tarefas:

*  Criar todos os modelos principais  
*  Definir relacionamentos  
*  Adicionar índices necessários  
*  Criar primeira migration  
*  Criar seed script básico  
*  Documentar schema em docs/database-schema.md

---

### **Daniela: Setup do Projeto Backend (Dia 1-3)**

Inicializar projeto NestJS:  
bash  
cd backend  
npm i \-g @nestjs/cli  
nest new . \--skip-git

\# Instalar dependências principais  
npm install @prisma/client prisma  
npm install @nestjs/jwt @nestjs/passport passport passport-jwt  
npm install bcrypt  
npm install @nestjs/websockets @nestjs/platform-socket.io  
npm install class-validator class-transformer

\# Dev dependencies  
npm install \-D @types/bcrypt @types/passport-jwt  
\`\`\`

\*\*Estrutura inicial:\*\*  
\`\`\`  
backend/src/  
├── main.ts  
├── app.module.ts  
├── auth/  
│   ├── auth.module.ts  
│   ├── auth.controller.ts  
│   ├── auth.service.ts  
│   └── dto/  
├── users/  
│   ├── users.module.ts  
│   ├── users.controller.ts  
│   └── users.service.ts  
├── prisma/  
│   ├── prisma.module.ts  
│   └── prisma.service.ts  
└── common/  
    └── guards/  
Tarefas:

*  Configurar projeto NestJS  
*  Integrar Prisma com NestJS  
*  Criar módulo de autenticação básico (estrutura)  
*  Configurar CORS  
*  Configurar variáveis de ambiente  
*  Criar endpoint de health check: GET /health  
*  Testar que servidor roda sem erros

---

### **Lucas: Setup do Projeto Frontend (Dia 1-3)**

Inicializar projeto React:  
bash  
cd frontend  
npm create vite@latest . \-- \--template react-ts

\# Instalar dependências principais  
npm install react-router-dom  
npm install axios  
npm install socket.io-client  
npm install @tanstack/react-query

\# Tailwind CSS  
npm install \-D tailwindcss postcss autoprefixer  
npx tailwindcss init \-p

\# Bibliotecas UI úteis  
npm install lucide-react  \# ícones  
\`\`\`

\*\*Estrutura inicial:\*\*  
\`\`\`  
frontend/src/  
├── main.tsx  
├── App.tsx  
├── components/  
│   ├── ui/           \# Componentes reutilizáveis  
│   │   ├── Button.tsx  
│   │   ├── Input.tsx  
│   │   ├── Card.tsx  
│   │   └── Modal.tsx  
│   └── layout/  
│       ├── Navbar.tsx  
│       ├── Sidebar.tsx  
│       └── Layout.tsx  
├── pages/  
│   ├── Login.tsx  
│   ├── Register.tsx  
│   └── Dashboard.tsx  
├── hooks/  
├── services/  
│   └── api.ts  
└── types/  
    └── index.ts  
Tarefas:

*  Configurar projeto React \+ TypeScript  
*  Configurar Tailwind CSS  
*  Criar componentes UI básicos (Button, Input, Card)  
*  Criar layout básico (Navbar, container)  
*  Configurar tema de cores  
*  Testar que aplicação roda sem erros

---

### **Ana Laura: Roteamento e Autenticação Frontend (Dia 1-3)**

Configurar React Router e páginas de auth:  
typescript  
// App.tsx  
import { BrowserRouter, Routes, Route } from 'react-router-dom';  
import Login from './pages/Login';  
import Register from './pages/Register';  
import Dashboard from './pages/Dashboard';  
import ProtectedRoute from './components/ProtectedRoute';

function App() {  
  return (  
    \<BrowserRouter\>  
      \<Routes\>  
        \<Route path="/login" element={\<Login /\>} /\>  
        \<Route path="/register" element={\<Register /\>} /\>  
        \<Route   
          path="/dashboard"   
          element={  
            \<ProtectedRoute\>  
              \<Dashboard /\>  
            \</ProtectedRoute\>  
          }   
        /\>  
      \</Routes\>  
    \</BrowserRouter\>  
  );  
}  
Criar serviço de API:  
typescript  
// services/api.ts  
import axios from 'axios';

const api \= axios.create({  
  baseURL: import.meta.env.VITE\_API\_URL || 'http://localhost:3000',  
  headers: {  
    'Content-Type': 'application/json',  
  },  
});

// Interceptor para adicionar token  
api.interceptors.request.use((config) \=\> {  
  const token \= localStorage.getItem('token');  
  if (token) {  
    config.headers.Authorization \= \`Bearer ${token}\`;  
  }  
  return config;  
});

export default api;  
\`\`\`

\*\*Tarefas:\*\*  
\- \[ \] Configurar React Router  
\- \[ \] Criar páginas de Login e Register (UI apenas)  
\- \[ \] Criar ProtectedRoute component  
\- \[ \] Configurar serviço de API com Axios  
\- \[ \] Criar AuthContext para gerenciar estado de autenticação  
\- \[ \] Implementar lógica de localStorage para token  
\- \[ \] Criar página de Dashboard placeholder

\---

\#\# Final da Semana 2: Checkpoint

\*\*Reunião de Revisão (1-2 horas)\*\*

\*\*O que deve estar funcionando:\*\*  
\- \[ \] Repositório Git organizado com commits de todos  
\- \[ \] Docker rodando PostgreSQL  
\- \[ \] Backend NestJS rodando (mesmo que apenas health check)  
\- \[ \] Frontend React rodando com navegação básica  
\- \[ \] Estrutura de pastas clara e organizada  
\- \[ \] Documentação básica no README

\*\*Demonstração Round-Robin:\*\*  
Cada pessoa mostra brevemente:  
\- Murilo: Mostra schema do Prisma e explica relacionamentos  
\- Daniela: Mostra estrutura do backend e roda o servidor  
\- Lucas: Mostra componentes UI criados  
\- Ana Laura: Mostra navegação entre páginas

\*\*Planejar Semana 3:\*\*  
\- Murilo: Implementar endpoints de autenticação  
\- Daniela: Criar endpoints de registro e login  
\- Lucas: Começar componentes do Kanban  
\- Ana Laura: Integrar login/register com backend

\---

\#\# Estrutura de Comunicação Durante o Setup

\*\*Standup Diário Assíncrono (Discord/Slack) \- 5 minutos\*\*  
\`\`\`  
✅ Ontem: Configurei o schema do Prisma com User e Organization  
🚧 Hoje: Vou criar os relacionamentos e primeira migration  
🚨 Bloqueios: Nenhum  
Dúvidas e Bloqueios:

* Usar canal dedicado para perguntas técnicas  
* Resposta em até 2 horas durante horário de trabalho  
* Se bloqueio crítico, chamar para call rápida

Pair Programming:

* Agendar quando necessário  
* Especialmente útil para integrações entre frontend/backend

---

## **Checklist de Sucesso \- Fim da Semana 2**

Design & Planejamento:

*  Wireframes de todas as telas principais criados  
*  User flow documentado e aprovado  
*  Estrutura de dados definida

Infraestrutura:

*  Repositório Git configurado  
*  Docker funcionando para todos  
*  .env.example criado  
*  README com instruções de setup

Backend:

*  Projeto NestJS inicializado  
*  Prisma configurado e integrado  
*  Schema de banco de dados criado  
*  Servidor rodando sem erros  
*  Health check endpoint funcionando

Frontend:

*  Projeto React \+ TypeScript inicializado  
*  Tailwind CSS configurado  
*  React Router configurado  
*  Componentes UI básicos criados  
*  Páginas de autenticação criadas (UI)  
*  Aplicação rodando sem erros

Equipe:

*  Todos têm ambiente funcionando localmente  
*  Todos fizeram pelo menos 3 commits  
*  Canal de comunicação estabelecido  
*  Primeira reunião de revisão completa

