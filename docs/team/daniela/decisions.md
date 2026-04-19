# **Technical API Status Report & Architecture Overview**

## **1. Arquitetura Base e Padrões Globais**

O backend foi estruturado utilizando **NestJS** com **Prisma ORM** e **PostgreSQL**, seguindo princípios de Domain-Driven Design (DDD) e estrita separação de responsabilidades (Controllers para roteamento HTTP, Services para regras de negócio).

* **Validação de Dados (Input Security):**

  * Implementação do `ValidationPipe` global com `whitelist: true` (higienização automática de payloads) e `transform: true`.
  * Uso de validação profunda (Deep Validation) para objetos complexos (ex: JSON de preferências) através dos decoradores `@ValidateNested()` e `@Type()` do `class-transformer`, garantindo tipagem estrita em tempo de execução.
* **Padronização de Erros (Global Exception Filter):**
  * Filtro de exceção global customizado que interceta erros nativos do NestJS e falhas do Prisma, traduzindo-os estritamente para o contrato exigido pelo frontend: `{ type: string, message: string, details: any }`.
  * Mapeamento semântico de HTTP Status para códigos de domínio (ex: 422 para `invalid_state_transition`, 403 para `forbidden`, 400 para `validation_error`).
* **Paginação Padronizada:**
  * Implementação transversal de utilitário de paginação (`limit` e `offset`) devolvendo consistentemente o envelope `{ items: [], pageInfo: { limit, offset, total, hasMore } }`.

## **2. Módulos Core (Status: Ready for Integration)**

**2.1. Authentication & Security (JWT):**

* Rotas privadas protegidas via `JwtAuthGuard` que injetam o contexto do utilizador no Request.
* Extração de identidade via decorador customizado `@GetUser('id')`, impedindo falsificação de IDs (Spoofing) em operações de deleção/atualização.

**2.2. Utilizadores e Preferências:**

* **Prevenção de Over-fetching:** Isolamento de dados sensíveis na serialização (hashes, estados de 2FA ocultados nos perfis públicos).
* **JSON Fields no Prisma:** O campo de `preferences` utiliza tipos genéricos do PostgreSQL devidamente validados pelo `class-validator` no DTO, permitindo atualizações parciais de chaves específicas.

**2.3. Workspaces & RBAC (Role-Based Access Control):**

* **Transações Atómicas (Nested Writes):** A criação de um Workspace (`POST /workspaces`) gera os blocos dependentes (membro criador com role `OWNER`, Subjects padrão, Fields padrão) numa única transação do Prisma. Em caso de falha, ocorre rollback completo, evitando dados órfãos.
* **Autorização de Nível de Recurso:** Validação explícita no Service de que as operações críticas (ex: envio de convites) são exclusivas para `OWNER` ou `ADMIN` através de consultas conjuntas (`workspaceId_userId`).

**2.4. Kanban Engine (Tasks & Comments):**

* **Tradutor de Slugs:** O backend mapeia implicitamente slugs legíveis (`status: "to_do"`) para os UUIDs internos da tabela de Fields, isolando o frontend da complexidade das chaves primárias relacionais.
* **Integridade Referencial:** Configuração de `Cascade Deletes` no banco de dados. A remoção de uma Task apaga limpa e automaticamente todos os seus comentários, retornando `204 No Content`.

**2.5. Social & Chat Engine:**

* **State Machine de Amizades:** Transições de estado validadas rigorosamente (bloqueio de envio de convites para si próprio, status de `pending` para `accepted`).
* **Agregação In-Memory (Conversations):** Resolução de gargalos de paginação no chat. O sistema busca o grafo de parceiros, agrega a `lastMessage` e o `unreadCount`, realiza o ordenamento temporal em memória e só então aplica a fatia de paginação (slice), garantindo a cronologia correta das threads de chat.

## **3. Integrações "Mockadas" (Status: Parcialmente Cumprido)**

Estes endpoints cumprem a assinatura do contrato (API.md) recebendo e formatando os dados corretamente, mas a infraestrutura física de terceiros ainda está em bypass:

* **Storage (Avatares e Attachments):** O endpoint `POST` valida o objeto, mas o upload em stream (AWS S3, MinIO) e a geração de URLs assinadas para download (`GET`) não estão ativos.
* **MFA / 2FA:** Setup e verificação retornam respostas predefinidas, sem integração com provedores TOTP (ex: Google Authenticator).
* **OAuth 42:** O ciclo de redirect e callback existe arquiteturalmente, mas opera com tokens mock.

## **4. Dívida Técnica & Roadmap de Infraestrutura (Next Steps)**

Para que o sistema passe de "API Funcional" para "Sistema de Produção Resiliente", os seguintes componentes arquiteturais requerem implementação:

* **Comunicação Bidirecional (WebSockets):** Implementação de um `WebSocketGateway` (Socket.io) acoplado ao JWT para transmissões em tempo real (Chat e Notificações), incluindo gestão de Rooms (canais por Workspace).
* **Event-Driven Side Effects:** Implementação do módulo do EventEmitter para desacoplar a lógica de negócio secundária. Atualmente, menções em comentários precisam gerar eventos assíncronos (`notification.create`) sem travar a thread principal da requisição HTTP.
* **Provedor de E-mail (SMTP):** Acoplamento de serviços (ex: Nodemailer) para o processamento de tokens transacionais (Reset de Password e Convites por e-mail externo).
* **Segurança de Tráfego:** Configuração explícita de CORS policies e limites de Throttling (Rate Limit) nos endpoints públicos e de autenticação.
