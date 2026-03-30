# Estrutura do Backend

```code
src/
├── app.controller.ts
├── app.module.ts
├── app.service.ts
├── main.ts
├── auth/          # Login, OAuth 42, JWT
├── chat/          # WebSockets, Mensagens
├── common/        # Guards de segurança, Decorators
├── notifications/ # Eventos e alertas
├── prisma/        # A ponte com o banco de dados (PrismaService)
├── tasks/         # Kanban, Comentários
├── uploads/       # Lógica do Multer (se não ficar dentro de tasks/users)
├── users/         # Perfil, Amigos, Avatar
└── workspaces/    # (Antigo organizations) CRUD de Workspaces e Membros
```
