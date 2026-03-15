# System Architecture & Data Flow

This document outlines how information travels between the React Frontend, the NestJS Backend, and the PostgreSQL Database in the Fazelo application.

## 1. High-Level Architecture

- **Frontend (React/Vite):** The client-side application. Responsible for UI, state management, and capturing user actions.
- **Backend (NestJS):** The server-side API. Handles business logic, security (JWT), and communication with the database.
- **ORM (Prisma):** The bridge between our TypeScript code and the SQL database.
- **Database (PostgreSQL):** The persistent storage for all application data.

## 2. Standard HTTP Flow (Request-Response)

Used for standard CRUD operations (Create, Read, Update, Delete tasks and workspaces).

1. **Action:** User interacts with the UI (e.g., clicks "Create Task").
2. **Request:** Frontend sends an HTTP request (POST, GET, PATCH, DELETE) with a JSON payload to the NestJS API.
3. **Validation & Logic:** Backend verifies the JWT token, checks permissions, and processes the request.
4. **Database Query:** Backend uses Prisma to read/write to PostgreSQL.
5. **Response:** Backend returns an HTTP status code (e.g., `200 OK` or `201 Created`) and the requested data (or an error message) in JSON format.
6. **UI Update:** Frontend updates the screen based on the response.

## 3. Real-Time Flow (WebSockets)

Used for the 1x1 Chat and live Notifications.

- Instead of the Frontend asking for updates, an open connection is maintained via **Socket.io**.
- When a user sends a message, it is emitted to the Backend, saved in the database, and immediately broadcasted to the receiving user's active session without them needing to refresh the page.

## 4. API Data Contracts (Examples)

*(To be defined: What exactly the Frontend sends and what the Backend returns for key features).*

---

## Explicações Didáticas

### 1. A Analogia do Restaurante

Pense no fluxo de dados como o funcionamento de um restaurante:

- **Frontend (React/Vite):** É o garçom e o cardápio. Ele interage com o cliente, anota o pedido e mostra a comida pronta. Ele não cozinha nada.
- **Backend (NestJS):** É o Chef de cozinha. Ele recebe o pedido do garçom, verifica se os ingredientes existem, aplica as regras (ex: "esse cliente pagou?") e coordena o preparo.
- **ORM (Prisma):** É o ajudante do Chef. O Chef fala "pegue as batatas" (código TypeScript) e o ajudante sabe exatamente em qual prateleira buscar (código SQL).
- **Database (PostgreSQL):** É a despensa. Onde tudo fica guardado de forma permanente e segura.

### 2. O Fluxo Tradicional (Exemplo: Mover uma Task no Kanban)

Este é o fluxo "Request-Response" (HTTP Padrão). Acontece quando a Ana ou o Lucas fazem uma ação na tela.

1. **Ação (Frontend):** O Lucas arrasta a tarefa "Docker Setup" da coluna *To Do* para *In Progress*. O React entende a ação e dispara uma requisição HTTP do tipo `PATCH` (atualização) para a rota `/tasks/1`.
   - *O que viaja na rede:* Um pacote de dados contendo o novo status e o token de segurança dele (`{ "status": "IN_PROGRESS" }`).
2. **Recepção e Segurança (Backend - Controller):** O NestJS recebe a requisição. A primeira coisa que ele faz é verificar: "O token do Lucas é válido? Ele tem permissão neste Workspace?".
3. **Processamento (Backend - Service):** Se autorizado, o NestJS chama o Prisma para fazer a alteração. Ele roda algo como: `prisma.task.update({ where: { id: 1 }, data: { status: "IN_PROGRESS" } })`.
4. **Gravação (Database):** O Prisma traduz isso para a linguagem do banco (SQL) e envia para o PostgreSQL. O PostgreSQL atualiza a tabela e responde: "Feito! Aqui estão os dados novos da tarefa".
5. **Resposta (Backend):** O NestJS pega essa confirmação do banco, empacota em formato JSON e envia de volta (Resposta `200 OK`) para o navegador do Lucas.
6. **Atualização Visual (Frontend):** O React recebe o `200 OK` e confirma que o card deve ficar permanentemente na nova coluna.

### 3. O Fluxo em Tempo Real (Exemplo: O Chat 1x1)

Como o Fazelo tem um chat e notificações com Socket.io, o fluxo é um pouco diferente. Não existe a "espera" tradicional, a conexão fica aberta como um duto de água.

1. **Emissão (Frontend):** Você digita "Oi Murilo!" no chat e aperta Enter. O React emite um evento instantâneo via WebSocket: `socket.emit('sendMessage', { to: 'murilo_db', text: 'Oi Murilo!' })`.
2. **Roteamento e Gravação (Backend):** O NestJS (através de um *Gateway*) recebe o evento. Ele usa o Prisma para salvar essa mensagem na tabela `Message` no PostgreSQL (para não perder o histórico).
3. **Transmissão (Backend):** Imediatamente após salvar, o NestJS "grita" pelo duto de água diretamente para a tela do Murilo, sem que ele tenha clicado em nada: `socket.to(muriloId).emit('newMessage', { from: 'daniela_be', text: 'Oi Murilo!' })`.
4. **Recepção (Frontend do Murilo):** O React do Murilo "ouve" o evento, toca o som de notificação e renderiza a bolinha vermelha no ícone do chat.
