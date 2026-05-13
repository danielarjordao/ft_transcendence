# Frontend TODO - Password Recovery, Change Password and 2FA

Este arquivo resume o que ainda precisa ser feito no frontend para deixar funcionando:

- "esqueci minha senha"
- "trocar senha"
- ativacao / desativacao de 2FA

Ele foi montado com base no codigo atual do frontend e nos contratos reais do backend.

## Estado atual

Hoje o frontend:

- **nao tem** tela/rota de `forgot password`
- **nao tem** tela/rota de `reset password`
- tem a aba `Security` no `ProfilePanel`, mas:
  - `Update Password` esta desabilitado
  - `Enable 2FA` esta desabilitado

Hoje o backend **ja tem suporte** para os tres fluxos:

- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `PATCH /api/account/password`
- `POST /api/account/2fa/setup`
- `POST /api/account/2fa/verify`
- `DELETE /api/account/2fa`

---

## 1. Esqueci minha senha

### Objetivo

Permitir que o usuario:

1. informe o email na tela de login
2. receba o email de reset
3. abra o link `/reset-password?token=...`
4. defina uma nova senha

### Backend ja pronto

#### `POST /api/auth/forgot-password`

Payload:

```json
{
  "email": "ana.laura@42.fr"
}
```

Resposta:

- `202 Accepted`

Erros principais:

- `400 validation_error`
- `429 rate_limited`

#### `POST /api/auth/reset-password`

Payload:

```json
{
  "token": "reset-token",
  "newPassword": "NewStrongPassword123!"
}
```

Resposta:

- `204 No Content`

Erros principais:

- `400 validation_error`
- `401 token_expired`
- `404 not_found`

### O que precisa existir no frontend

#### 1.1 Link na tela de login

Adicionar um link do tipo:

- `Forgot password?`

na pagina de login, apontando para:

- `/forgot-password`

#### 1.2 Pagina `ForgotPassword`

Criar uma pagina com:

- campo `email`
- submit
- estado de loading
- mensagem de sucesso generica

Importante:

- mesmo se o email nao existir, o backend responde de forma silenciosa
- a UI deve dizer algo como:
  - "If the account exists, we sent a reset link."

Isso evita enumeracao de contas.

#### 1.3 Metodo no service

Criar no frontend algo como:

- `authService.forgotPassword(email)`

fazendo `POST /api/auth/forgot-password`

#### 1.4 Pagina `ResetPassword`

Criar uma pagina em:

- `/reset-password`

Ela deve:

- ler `token` da query string
- mostrar campos:
  - `newPassword`
  - `confirmNewPassword`
- validar confirmacao no frontend
- enviar `POST /api/auth/reset-password`

#### 1.5 Tratamento de erro

Mapear pelo menos:

- `401 token_expired` -> link expirado
- `404 not_found` -> link invalido ou ja consumido
- `400 validation_error` -> senha fora da regra

#### 1.6 Rotas

Adicionar em `App.tsx`:

- `/forgot-password`
- `/reset-password`

Essas rotas devem ser **publicas**.

### Checklist

- [ ] adicionar link na tela de login
- [ ] criar `ForgotPassword` page
- [ ] criar `ResetPassword` page
- [ ] adicionar metodos no `authService`
- [ ] adicionar rotas em `App.tsx`
- [ ] tratar `token_expired`, `not_found` e `validation_error`

---

## 2. Trocar senha

### Objetivo

Permitir que o usuario autenticado troque a senha da propria conta local dentro do `ProfilePanel`.

### Backend ja pronto

#### `PATCH /api/account/password`

Payload:

```json
{
  "currentPassword": "OldStrongPassword123!",
  "newPassword": "NewStrongPassword123!"
}
```

Resposta:

- `204 No Content`

Erros possiveis pelo contrato e pelo codigo:

- `400 validation_error`
- `401 invalid_credentials`
- `400` se a conta nao for local / nao usar senha
- `400` se a nova senha for igual a atual

### Regras do backend

Pelo DTO e pelo service:

- `newPassword` precisa ter pelo menos 8 caracteres
- `newPassword` precisa conter letra e numero
- `currentPassword` precisa estar correta
- conta OAuth-only nao pode trocar senha local

### O que precisa existir no frontend

#### 2.1 UI na aba `Security`

Substituir o placeholder atual por:

- campo `currentPassword`
- campo `newPassword`
- campo `confirmNewPassword`
- botao `Update Password`

#### 2.2 Metodo no service

Criar algo como:

- `accountService.changePassword({ currentPassword, newPassword })`

usando `PATCH /api/account/password`

#### 2.3 Validacao frontend

Checar antes de enviar:

- confirmacao igual
- minimo de 8 caracteres
- idealmente letra + numero para espelhar a regra do backend

#### 2.4 Estados de erro

Tratar pelo menos:

- senha atual invalida
- nova senha igual a atual
- conta que nao usa senha local

#### 2.5 UX recomendada

Depois de sucesso:

- limpar os campos
- mostrar mensagem de sucesso

Opcional, mas bom:

- esconder essa secao ou desabilitar com mensagem clara para contas OAuth-only

### Checklist

- [ ] criar `accountService.changePassword`
- [ ] trocar placeholder do `ProfilePanel` por formulario real
- [ ] validar confirmacao de senha no frontend
- [ ] tratar erros de conta OAuth-only e senha atual invalida
- [ ] exibir estado de loading e mensagem de sucesso

---

## 3. Ativar 2FA

### Objetivo

Permitir que o usuario autenticado:

1. inicie o setup de 2FA
2. veja QR code / `otpauthUrl`
3. escaneie no autenticador
4. digite o codigo TOTP
5. confirme a ativacao

Depois disso, tambem permitir:

- desativar 2FA com codigo valido

### Backend ja pronto

#### `POST /api/account/2fa/setup`

Resposta:

```json
{
  "secret": "BASE32SECRET",
  "otpauthUrl": "otpauth://totp/Fazelo:ana.laura@42.fr?...",
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

Erros relevantes pelo codigo:

- `400` se 2FA ja estiver habilitado
- `404` se usuario nao existir

#### `POST /api/account/2fa/verify`

Payload:

```json
{
  "code": "123456"
}
```

Resposta:

- `204 No Content`

Erros:

- `400 validation_error`
- `401 unauthorized`
- `400` se o setup ainda nao foi iniciado

#### `DELETE /api/account/2fa`

Payload:

```json
{
  "code": "123456"
}
```

Resposta:

- `204 No Content`

Erros:

- `400` se 2FA nao estiver habilitado
- `401 unauthorized` se o codigo estiver errado

### O que precisa existir no frontend

#### 3.1 UI na aba `Security`

Substituir o placeholder atual por um fluxo em etapas dentro do proprio `ProfilePanel`:

##### Estado A - 2FA desabilitado

- botao `Enable 2FA`

##### Estado B - setup iniciado

Mostrar:

- QR code usando `qrCodeDataUrl`
- opcionalmente o `secret` para entrada manual
- campo para o codigo de 6 digitos
- botao `Verify and Enable`

##### Estado C - 2FA habilitado

Mostrar:

- status de habilitado
- botao para abrir fluxo de desativacao

##### Estado D - desativacao

Mostrar:

- campo `code`
- botao `Disable 2FA`

#### 3.2 Metodos no service

Criar algo como:

- `accountService.setup2fa()`
- `accountService.verify2fa(code)`
- `accountService.disable2fa(code)`

#### 3.3 Estado local necessario

O frontend vai precisar guardar temporariamente:

- se 2FA esta habilitado ou nao
- se o setup esta em andamento
- `qrCodeDataUrl`
- `secret`
- `otpauthUrl`
- loading / erro

#### 3.4 Falta um detalhe importante no contrato atual do frontend

O objeto `user` retornado hoje pelo frontend nao carrega claramente algo como:

- `twoFactorEnabled`

Entao, para a UI da aba `Security` saber o estado atual do 2FA com conforto, existem duas opcoes:

##### Opcao A - estender `GET /api/users/me`

Incluir no backend / contrato:

- `twoFactorEnabled`

Essa seria a opcao mais limpa para o frontend.

##### Opcao B - trabalhar so com estado local da sessao

Daria para fazer, mas fica pior:

- o frontend nao sabe com confianca o estado ao recarregar a pagina

Minha recomendacao: **expor `twoFactorEnabled` em `/api/users/me`**.

### Checklist

- [ ] criar `accountService.setup2fa`
- [ ] criar `accountService.verify2fa`
- [ ] criar `accountService.disable2fa`
- [ ] trocar placeholder da aba `Security`
- [ ] mostrar QR code retornado pelo backend
- [ ] permitir confirmar codigo de 6 digitos
- [ ] permitir desabilitar 2FA
- [ ] decidir como o frontend sabera se `twoFactorEnabled` ja esta ativo

---

## 4. Ordem sugerida de implementacao

Se a ideia for reduzir risco e ganhar progresso rapido:

### Primeiro

- [ ] trocar senha

Motivo:

- fluxo mais curto
- sem rota nova
- sem QR code
- sem email

### Depois

- [ ] esqueci minha senha

Motivo:

- exige novas paginas e rotas, mas o backend ja esta redondo

### Por ultimo

- [ ] 2FA

Motivo:

- mais estados de UI
- fluxo em varias etapas
- depende melhor de como representar `twoFactorEnabled` no frontend

---

## 5. Arquivos do frontend que provavelmente vao entrar

### Forgot / reset password

- `frontend/src/App.tsx`
- `frontend/src/pages/Login.tsx`
- nova page `ForgotPassword`
- nova page `ResetPassword`
- `frontend/src/services/auth.service.ts`

### Trocar senha / 2FA

- `frontend/src/components/ProfilePanel.tsx`
- novo `frontend/src/services/account.service.ts`
- possivelmente `frontend/src/types/auth.ts` ou um tipo novo de account/security
- possivelmente `useAuthStore` / `useAuth` se decidirmos refletir `twoFactorEnabled` no estado do usuario

---

## 6. Ponto de atencao importante

Para 2FA ficar realmente bom no frontend, vale decidir antes:

```txt
o frontend vai saber o estado de 2FA por `GET /users/me` ou vamos criar outro jeito?
```

Se isso nao for decidido, o frontend consegue ate fazer o setup, mas o estado da aba `Security` fica mais improvisado do que precisa.
