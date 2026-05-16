# Estrutura de tópicos — processo de autenticação do projeto

## 0. Fluxo completo (visão de ponta a ponta)

1. O usuário envia `sign-up` ou `sign-in` com credenciais.
2. O backend valida DTO, consulta banco e verifica senha (quando for login).
3. Se estiver tudo certo, o backend gera `access token` e `refresh token`.
4. O `refresh token` nao fica salvo puro: salva-se apenas o hash em `Session`.
5. O frontend usa o `access token` nas rotas privadas via header `Authorization` ou por cookie `httpOnly`, conforme o fluxo adotado.
6. Se o `access token` expirar, o frontend chama `refresh` com o `refresh token` no body ou usa o fluxo por cookie, conforme o modo de autenticacao em uso.
7. No `refresh`, o backend valida assinatura do token, valida sessao no banco e emite novo par de tokens.
8. O backend rotaciona sessao (revoga/substitui a anterior) para reduzir risco de replay.
9. No `logout`, a sessao do refresh token e revogada no banco.
10. Em recuperacao de senha, o backend gera token de reset, salva hash + expiracao, e no reset atualiza senha e revoga sessoes ativas.

## 1. Visão geral

### 1.1 Objetivo do fluxo
Garantir autenticacao forte e controle de sessao sem perder usabilidade.
Na pratica: permitir login seguro, proteger rotas privadas, renovar acesso sem novo login a cada minuto, e encerrar/revogar sessao quando necessario.

### 1.2 Estratégia adotada no projeto
A estrategia é hibrida:
- Stateless para request normal: `access token` JWT curto.
- Stateful para sessao: hash do `refresh token` salvo em `Session` no banco.

Esse desenho permite duas coisas ao mesmo tempo:
- performance nas rotas protegidas (validacao de JWT sem ir ao banco em toda request);
- controle real de revogacao/rotacao via sessao persistida.

No transporte entre cliente e backend, esse desenho admite dois formatos:

- envio explicito por `Authorization: Bearer <accessToken>` e `refreshToken` no body;
- envio por cookies `httpOnly`, especialmente no fluxo OAuth e em cenarios em que o frontend nao deve ler os tokens diretamente.

### 1.3 Componentes principais
- `AuthController` e `AuthService`: signup, signin, refresh, logout, forgot/reset e OAuth 42.
- `JwtStrategy` e `JwtAuthGuard`: validam `access token` vindo de header ou cookie e resolvem usuario autenticado.
- `PrismaService` + PostgreSQL: persistem `User`, `AuthAccount`, `Session` e `PasswordResetToken`.
- Frontend (`api.ts` e auth store): envia `access token` por header quando o fluxo usa tokens visiveis, ou trabalha com `withCredentials` e `getMe()` quando o fluxo usa cookies `httpOnly`.

## 2. Conceitos-base

### 2.1 JWT
JWT significa `JSON Web Token`.
Ele é um formato de token em texto, composto por tres partes separadas por ponto:

```txt
header.payload.signature
```

Exemplo visual:

```txt
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsImVtYWlsIjoiYW5hQDQyLmZyIn0.XYZassinatura
```

As tres partes sao:

- `header`: informa o tipo do token e o algoritmo de assinatura.
- `payload`: guarda os dados chamados de claims, como `sub`, `email` e `exp`.
- `signature`: prova que o token foi assinado pelo backend e nao foi alterado.

Um JWT pode desempenhar diversas funções, como servir como Access Token ou Refresh Token.

JWT nao é criptografia por padrao. O conteudo do `header` e do `payload` fica apenas codificado em Base64URL. Isso significa que qualquer pessoa com o token consegue decodificar e ler o payload. Por isso, **nunca coloque dados sensiveis no payload**.

A integridade do JWT está na assinatura digital. O backend gera o token assinando-o com um segredo (por exemplo, `JWT_ACCESS_SECRET`), combinando o segredo com o `header` e o `payload` para gerar a assinatura. 
Quando o backend recebe um token, ele recalcula a assinatura usando o mesmo segredo, o header e o payload recebidos, e compara com a assinatura recebida. Se qualquer parte do `header` ou do `payload` for alterada, a assinatura não irá mais coincidir, e o token será considerado inválido e rejeitado. Assim, mesmo que alguém consiga ler o conteúdo do token, não é possível modificá-lo sem ser detectado.

Resumo direto:

- JWT é texto.
- JWT pode ser lido por quem tiver o token.
- JWT assinado nao pode ser alterado sem invalidar a assinatura.
- JWT nao é automaticamente um access token ou refresh token.
- Access token e refresh token podem usar formato JWT, mas representam finalidades diferentes.

### 2.2 Access token
Access token é o token usado para acessar rotas privadas da API.
No nosso projeto, ele é um JWT de curta duracao.

Uso normal por header:

```txt
Authorization: Bearer <accessToken>
```

Uso alternativo por cookie:

```txt
Cookie: accessToken=<jwt>
```

Quando uma requisição chega com esse token, o backend executa os seguintes passos:

1. Extrai o token do header `Authorization` ou do cookie `accessToken`, conforme o canal usado.
2. Decodifica o token e verifica se a assinatura digital está correta, garantindo que o token não foi alterado.
3. Checa se o token está dentro do prazo de validade (expiração).
4. Se tudo estiver correto, utiliza o campo `sub` do payload para identificar de forma única o usuário autenticado , autorizar o acesso à rota protegida e aplicar regras de autorização.

Caracteristicas esperadas:

- dura pouco tempo;
- e enviado em quase toda request protegida, por header ou cookie;
- deve conter apenas dados minimos;
- nao precisa ser salvo no banco para funcionar;
- se expirar, o frontend precisa obter outro token.

Se vazar, o impacto é limitado pelo tempo curto de expiração.

### 2.3 Refresh token
Refresh token é o token usado para pedir um novo access token.
Ele nao deve ser usado para acessar rotas comuns da API.

No nosso projeto, ele tambem é um JWT, mas com outra finalidade:

- access token: prova acesso atual a rotas protegidas;
- refresh token: prova direito de renovar a sessao.

Caracteristicas esperadas:

- dura mais tempo que o access token;
- trafega apenas no endpoint de refresh;
- é assinado com outro segredo, `JWT_REFRESH_SECRET`;
- deve ter sessao correspondente no banco;
- no banco, salva-se apenas o hash e não o token em si;
- deve ser rotacionado a cada uso.

Sem refresh token, expiracao curta do access token causaria login frequente.

### 2.4 Sessão persistida
Sessao persistida é o registro no banco que permite controlar refresh tokens.
Ela existe porque JWT sozinho é stateless: depois de emitido, o backend consegue validar assinatura e expiração sem consultar banco, mas nao tem controle natural de revogacao.

A sessao resolve isso para o refresh token.
Ela guarda informacoes como:

- id do usuario;
- hash do refresh token;
- data de expiracao;
- status ativo/revogado;
- data de revogacao;
- id da sessao substituta, quando houver rotacao;
- metadados como user agent e IP, se forem coletados.

Esse ponto é o que viabiliza logout real e revogacao de sessao.

### 2.5 Hash de senha e de token
No projeto, nem todo dado sensivel gravado no banco recebe o mesmo tratamento.

Existem tres familias principais aqui:

- **hash de senha**, quando o backend so precisa verificar se a credencial bate;
- **hash deterministico de token**, quando o backend precisa localizar um registro a partir do token apresentado;
- **criptografia reversivel**, quando o backend precisa recuperar o valor original depois.

#### Senha do usuario

Para senha local, o projeto usa `bcrypt`.

Isso significa:

- o backend nunca salva senha pura;
- o banco guarda apenas `passwordHash`;
- no login, o backend usa `bcrypt.compare(...)` para verificar se a senha recebida corresponde ao hash salvo.

Esse desenho faz sentido porque a senha e uma credencial humana, curta e muitas vezes previsivel. Por isso ela precisa de um algoritmo lento, pensado para dificultar brute force offline.

No nosso codigo atual:

- a senha e gravada em `AuthAccount.passwordHash`;
- o `bcrypt` ja resolve internamente a parte de salt;
- o projeto nao adiciona pepper especifico para senha hoje.

#### Refresh token, reset token e outros tokens persistidos

Para tokens persistidos, o projeto segue outro caminho.

Em vez de `bcrypt`, ele usa HMAC-SHA256 com `AUTH_TOKEN_PEPPER`.

Isso vale para casos como:

- `Session.refreshTokenHash`
- `PasswordResetToken.tokenHash`
- token de convite de workspace

O motivo e diferente do caso da senha.

Aqui o backend nao quer apenas verificar "isso bate?". Ele quer tambem conseguir recalcular o mesmo valor e encontrar a linha certa no banco.

Por isso o hash precisa ser deterministico:

- mesmo token
- mesma pepper
- mesmo resultado

Entao o fluxo fica assim:

1. o backend gera ou recebe um token aleatorio;
2. calcula um hash deterministico com `AUTH_TOKEN_PEPPER`;
3. salva apenas o hash;
4. quando o token volta do cliente, recalcula o hash e procura o registro correspondente.

Esse desenho protege o banco sem perder a capacidade de lookup.

#### Segredos que precisam ser recuperados depois

Nem todo dado sensivel pode virar hash irreversivel.

No caso do 2FA TOTP, o backend precisa recuperar o segredo original para validar os codigos temporarios gerados pelo aplicativo autenticador.

Por isso, `twoFactorPendingSecretEnc` e `twoFactorSecretEnc` usam **criptografia reversivel**, e nao hash.

No nosso codigo atual:

- o segredo TOTP e cifrado com `AUTH_ENCRYPTION_KEY`;
- o valor salvo no banco fica protegido;
- quando necessario, o backend decifra esse valor internamente para verificar o codigo TOTP.

Isso e importante porque, no TOTP, o backend e o aplicativo autenticador precisam conhecer a mesma semente original.

Entao:

- senha -> hash irreversivel com `bcrypt`;
- token persistido -> hash deterministico com `AUTH_TOKEN_PEPPER`;
- segredo TOTP -> criptografia reversivel com `AUTH_ENCRYPTION_KEY`.

#### Por que cada um usa uma estrategia diferente?

Porque o objetivo operacional muda:

- **senha**: so precisa ser verificada;
- **token persistido**: precisa ser verificado e localizado no banco;
- **segredo TOTP**: precisa ser recuperado em forma utilizavel.

Se o banco for exposto:

- hashes de senha e de token reduzem o dano imediato;
- cifragem reversivel protege o segredo TOTP, mas depende tambem de a chave `AUTH_ENCRYPTION_KEY` permanecer segura fora do banco.

#### Salt e pepper: diferenca direta

Vale fechar esta secao com uma distincao bem objetiva:

- **salt**: valor adicional por registro, normalmente diferente para cada senha;
- **pepper**: segredo global da aplicacao, guardado fora do banco, normalmente em env.

No nosso projeto:

- a senha usa `bcrypt`, que ja incorpora salt automaticamente;
- os tokens persistidos usam `AUTH_TOKEN_PEPPER` como pepper para HMAC;
- os segredos de 2FA nao usam hash com salt/pepper, porque o backend precisa recuperar o valor original e por isso usa criptografia reversivel com `AUTH_ENCRYPTION_KEY`.

### 2.6 Claims relevantes
Claims sao campos do payload do JWT.
Eles nao devem ser vistos como dados secretos, porque o payload pode ser lido.

No fluxo atual, os claims mais relevantes sao:

- `sub`: id do usuario. E o claim mais importante para autenticacao.
- `email`: apoio para contexto, quando fizer sentido.
- `iat`: momento em que o token foi emitido.
- `exp`: momento em que o token expira.

Exemplo de payload decodificado:

```json
{
  "sub": "user_123",
  "email": "ana@42.fr",
  "iat": 1713800000,
  "exp": 1713800900
}
```

O backend deve confiar no payload somente depois de validar assinatura e expiração.

Sem `sub` confiavel, o backend nao consegue mapear o token para o usuario autenticado.

## 3. Configuração e segredos

### 3.1 Variáveis de ambiente
Toda configuracao sensivel deve sair do codigo e entrar em variavel de ambiente.
No backend do projeto:
- fonte local principal: `.env` da raiz;
- entrega ao backend: `docker-compose.yml` via `environment`;
- consumo: `process.env` no runtime.

Obs: embora o Prisma gere por padrao um `.env` dentro da pasta do backend, a configuracao fica centralizada no `.env` da raiz, que serve como fonte para o `docker-compose.yml`.

### 3.2 Secrets por finalidade
Cada segredo precisa ter funcao isolada.
Separacao minima recomendada:
- `JWT_ACCESS_SECRET` para access token;
- `JWT_REFRESH_SECRET` para refresh token;
- `JWT_2FA_SECRET` para token temporario de 2FA (quando houver);
- `AUTH_TOKEN_PEPPER` para hash de tokens persistidos.

Separar segredos reduz impacto em caso de comprometimento de um deles.

### 3.3 Expiração dos tokens
Access token deve expirar rapido.
Refresh token pode expirar mais tarde, mas com controle por sessao persistida.

Exemplo pratico de politica:
- access token: ~15 min;
- refresh token: ~7 dias;
- refresh com rotacao obrigatoria a cada uso.

Sem expiracao curta + rotacao, o risco de abuso de token roubado aumenta muito.

## 4. Modelo de dados

### 4.1 User

O `User` e a entidade principal da conta no sistema. Ele representa a pessoa dentro da aplicacao, mas nao concentra sozinho tudo sobre autenticacao.

No nosso desenho, e importante separar duas ideias:

- `User`: representa identidade e estado geral da conta.
- `AuthAccount`: representa a forma de autenticacao dessa conta.

Isso significa que dados como email, username, flags de 2FA e auditoria de login ficam em `User`, enquanto a senha em si fica em `AuthAccount` quando o provider for `LOCAL`.

#### 4.1.1 Credenciais

Os identificadores principais do usuario ficam em `User`:

- `email`: identificador unico de contato e login local.
- `username`: identificador unico de perfil dentro da aplicacao.
- `fullName`: nome exibido.
- `avatarUrl` e `bio`: dados de perfil, nao de seguranca.

No nosso projeto, a senha (`passwordHash`) fica em `AuthAccount`, porque um mesmo usuario pode ter mais de uma forma de login:

- login local com email e senha;
- login OAuth com 42;
- outros providers, se necessario.

Entao o raciocinio correto é:

- `User` responde "quem e a conta?";
- `AuthAccount` responde "como essa conta autentica?".

Para login local, existe um `AuthAccount` com algo como:

- `provider: LOCAL`
- `providerAccountId`: geralmente o proprio identificador local usado internamente
- `passwordHash`: hash bcrypt da senha

Para login OAuth 42, existe outro `AuthAccount` com:

- `provider: FORTY_TWO`
- `providerAccountId`: id do usuario dentro da 42
- possivelmente `providerEmail`, `scope` e tokens do provedor, se o fluxo precisar persisti-los

Essa separacao evita misturar perfil com mecanismo de autenticacao e deixa o modelo mais flexivel.

#### 4.1.2 Flags de autenticação

Alguns campos do `User` existem para dizer em que estado de autenticacao a conta esta:

- `lastLoginAt`: registra o ultimo login bem-sucedido.
- `accountType`: existe por compatibilidade, mas nao deve ser tratado como fonte principal da autenticacao.

Na pratica:

- `lastLoginAt` e mantido principalmente para auditoria;
- `accountType` pode continuar existindo por contrato legado, mas a fonte de verdade sobre login local ou OAuth passa a ser `AuthAccount.provider`.

Esse detalhe e importante para evitar erro conceitual: se o codigo olhar apenas para `accountType`, ele pode divergir do modelo real da autenticacao.

No fluxo da autenticacao:

- no `signUp`, o usuario ja nasce com `lastLoginAt` preenchido;
- no `signIn`, esse campo e atualizado de novo quando o login local e bem-sucedido.

Isso faz sentido porque cadastro bem-sucedido ja inicia uma sessao autenticada.

#### 4.1.3 Controle de troca de senha

O campo principal aqui e `passwordChangedAt`.

Ele guarda o instante da ultima troca de senha e existe por um motivo de seguranca muito importante: invalidar credenciais antigas depois de uma mudanca sensivel.

Exemplo pratico:

1. o usuario faz login e recebe tokens;
2. depois ele troca ou reseta a senha;
3. `passwordChangedAt` e atualizado;
4. sessoes antigas podem ser consideradas suspeitas ou invalidas, dependendo da regra aplicada.

No nosso fluxo, isso aparece tanto em troca autenticada de senha quanto em reset de senha:

- o backend atualiza `AuthAccount.passwordHash`;
- atualiza `User.passwordChangedAt`;
- revoga sessoes existentes para impedir que refresh tokens antigos continuem valendo.

Ou seja, `passwordChangedAt` nao autentica ninguem sozinho, mas funciona como marcador de seguranca para cortar continuidade de sessoes antigas apos troca de senha.

Importante: no estado atual do codigo, quando um refresh token antigo ou suspeito reaparece, o backend rejeita a tentativa porque a `Session` correspondente ja nao passa mais na validacao.

Mas nao existe hoje uma resposta adicional mais agressiva, como:

- revogar automaticamente todas as outras sessoes do usuario;
- bloquear a conta;
- registrar incidente de seguranca com fluxo proprio.

Entao a protecao atual e real, mas fica concentrada em:

- rejeitar o token invalido;
- e impedir que ele continue renovando a sessao.

#### 4.1.4 Campos de 2FA

Os campos de 2FA ficam em `User` porque representam o estado da conta, nao de uma sessao especifica:

- `twoFactorEnabled`: indica se o 2FA esta realmente ativo.
- `twoFactorPendingSecretEnc`: segredo temporario gerado durante o setup, antes da confirmacao final.
- `twoFactorSecretEnc`: segredo TOTP ja confirmado, guardado de forma protegida.
- `twoFactorConfirmedAt`: momento em que o 2FA foi validado e ativado pela primeira vez.

No fluxo de 2FA, `twoFactorPendingSecretEnc` serve para o setup em duas etapas:

1. o usuario pede para configurar 2FA;
2. o backend gera um segredo novo;
3. esse segredo ainda nao deve virar definitivo;
4. ele fica salvo como pendente;
5. so depois que o usuario informa um codigo TOTP valido e que o segredo passa para `twoFactorSecretEnc` e o `twoFactorEnabled` vira `true`.

Essa separacao evita um problema comum: deixar um segredo "meio configurado" como se o 2FA ja estivesse pronto.

No login, a leitura desses campos funciona assim:

- se `twoFactorEnabled === false`, login com senha pode emitir tokens direto;
- se `twoFactorEnabled === true`, senha correta ainda nao basta;
- o backend primeiro devolve um `twoFactorToken` temporario;
- so depois da validacao do codigo TOTP ele cria a sessao final e emite `access token` e `refresh token`.

### 4.2 Session

O model `Session` representa uma sessao autenticada associada ao uso de refresh token.

Esse ponto e central no nosso projeto: o `access token` e stateless, mas o refresh precisa de controle no banco para permitir revogacao, logout real e rotacao segura.

Em outras palavras:

- JWT sozinho valida assinatura e expiracao;
- `Session` adiciona controle de estado sobre a renovacao da sessao.

No fluxo da autenticacao:

- `signUp` cria uma sessao logo apos emitir os tokens;
- `signIn` tambem cria uma sessao nova;
- o refresh token nao fica salvo puro; o que vai para o banco e o hash dele.

#### 4.2.1 UserId

`userId` liga a sessao ao dono dela.

Sem esse campo, o backend nao conseguiria responder perguntas basicas como:

- de quem e este refresh token?
- quantas sessoes ativas este usuario tem?
- quais sessoes precisam ser revogadas depois de reset de senha?

Como a relacao e `Session -> User`, um mesmo usuario pode ter varias sessoes ao mesmo tempo, por exemplo:

- navegador do notebook;
- navegador do celular;
- app em outro dispositivo;
- outra aba ou outro browser, dependendo da politica adotada.

Isso permite sessao por dispositivo em vez de uma unica sessao global obrigatoria.

#### 4.2.2 RefreshTokenHash

`refreshTokenHash` e um dos campos mais importantes do modelo.

O backend **nao salva o refresh token puro**. Em vez disso:

1. gera o refresh token;
2. calcula um hash desse token;
3. salva apenas o hash no banco;
4. quando o cliente envia o refresh token, o backend calcula o hash novamente e compara.

Esse desenho existe para reduzir impacto em caso de vazamento de banco. Se alguem acessar a tabela, nao encontra os refresh tokens utilizaveis em texto puro.

Esse hash e gerado em `AuthService.hashToken(...)` com HMAC-SHA256 e `AUTH_TOKEN_PEPPER`.

O `@unique` aqui tambem ajuda porque impede duplicidade acidental do mesmo token persistido.

Na pratica, esse campo e o elo entre:

- o refresh token apresentado pelo cliente;
- a sessao real registrada no banco.

#### 4.2.3 ExpiresAt

`expiresAt` diz ate quando a sessao pode ser usada para refresh.

Mesmo que o token apresentado tenha formato valido, a sessao nao deve ser aceita se essa data ja passou.

Entao, no refresh, o backend precisa verificar pelo menos:

- assinatura e expiracao do JWT de refresh;
- existencia da sessao correspondente;
- status da sessao;
- `revokedAt`;
- `expiresAt`.

Se `expiresAt` estiver no passado, a sessao acabou. O cliente precisa autenticar de novo.

Esse campo e importante porque o controle de sessao nao depende apenas do `exp` do JWT; ele tambem depende da politica persistida no banco.

Esse valor e calculado no backend quando a sessao e criada. A regra usada parte de `JWT_REFRESH_EXPIRES_IN`, passa por um helper de calculo de duracao e grava a data final em `Session.expiresAt`.

#### 4.2.4 RevokedAt

`revokedAt` marca quando a sessao foi revogada manualmente ou por regra de seguranca.

Exemplos:

- logout;
- sessao antiga revogada depois de rotacao de refresh token;
- reset de senha;
- encerramento forcado de sessoes pelo backend.

Se `revokedAt` tiver valor, a sessao nao deve mais ser aceita para renovar credenciais, mesmo que o token ainda nao tenha expirado.

Isso e o que torna o logout realmente efetivo no fluxo com refresh token.

#### 4.2.5 ReplacedBySessionId

`replacedBySessionId` existe para suportar rotacao de refresh token.

No nosso fluxo, quando o cliente usa um refresh token valido:

1. a sessao antiga e encerrada;
2. uma nova sessao e criada com um novo refresh token;
3. a sessao antiga aponta para a nova por meio de `replacedBySessionId`.

Isso cria uma cadeia de substituicao.

A vantagem e que o backend consegue:

- saber que a sessao antiga foi trocada por outra;
- reconhecer que um refresh token antigo reapareceu fora do fluxo esperado;
- auditar melhor o historico da renovacao.

No estado atual do nosso codigo, esse campo funciona principalmente como trilha de rastreabilidade.

Ou seja:

- ele ajuda a entender qual sessao substituiu qual;
- mas nao e a parte central da decisao de aceitar ou rejeitar refresh no fluxo atual.

Hoje, para rejeitar a sessao antiga, `revokedAt` ja cumpre o papel funcional principal.

Se um refresh token antigo for reapresentado depois de ja ter sido rotacionado, isso funciona como sinal de replay ou roubo.

No estado atual do nosso codigo, a reacao principal a esse caso ainda e:

- rejeitar a tentativa

Ou seja, o reaparecimento do token antigo pode ser interpretado como uso suspeito, mas o backend nao executa hoje uma resposta adicional mais agressiva so por causa disso.

#### 4.2.6 Metadados de origem

Os campos principais aqui sao:

- `userAgent`
- `ipAddress`
- `status`
- `createdAt`
- `updatedAt`

Eles nao servem para autenticar sozinhos, mas ajudam muito no controle da sessao.

Uso pratico:

- `userAgent`: ajuda a identificar de que navegador ou dispositivo veio a sessao;
- `ipAddress`: ajuda em auditoria e investigacao de atividade suspeita;
- `status`: deixa explicito se a sessao continua `ACTIVE` ou se ja foi `REVOKED`;
- `createdAt` e `updatedAt`: ajudam a reconstruir linha do tempo.

Esses metadados sao especialmente uteis para:

- mostrar "dispositivos conectados";
- investigar abuso de conta;
- apoiar regras de seguranca sem depender apenas do token JWT.

`userAgent` e `ipAddress` sao capturados no `AuthController` a partir do request e repassados ao `AuthService` no momento de criar a sessao.
Ou seja: a sessao persistida nasce com contexto basico de origem, o que melhora auditoria e abre caminho para listar sessoes por dispositivo.

### 4.3 PasswordResetToken

`PasswordResetToken` representa o mecanismo de recuperacao de senha.

Ele existe separado de `Session` porque o objetivo dele e outro:

- `Session` mantem uma sessao autenticada;
- `PasswordResetToken` autoriza uma troca excepcional de senha.

Misturar os dois conceitos seria ruim, porque reset de senha e um fluxo curto, sensivel e com regras proprias.

#### 4.3.1 TokenHash

Assim como no refresh token, o backend nao salva o token de reset puro.

O fluxo correto e:

1. gerar um token aleatorio de reset;
2. enviar esse token ao usuario, normalmente por email;
3. salvar no banco apenas `tokenHash`;
4. quando o usuario enviar o token de volta, calcular o hash e procurar o registro correspondente.

Motivo: se a base vazar, o invasor nao consegue usar diretamente os tokens de reset que estavam armazenados.

Esse campo tambem e `@unique`, o que evita colisao acidental entre tokens persistidos.

#### 4.3.2 ExpiresAt

`expiresAt` define a validade curta do reset.

Token de recuperacao precisa expirar rapido porque ele e extremamente sensivel: quem possui esse token, na pratica, pode trocar a senha da conta.

Se essa data passou:

- o token nao pode mais ser usado;
- o usuario precisa pedir outro email de recuperacao.

Esse controle reduz a janela de abuso caso o link seja exposto.

#### 4.3.3 UsedAt

`usedAt` marca se o token ja foi consumido.

Isso impede reutilizacao do mesmo link de reset.

O comportamento esperado e:

1. usuario envia token + nova senha;
2. backend valida hash e expiracao;
3. se estiver tudo certo, atualiza `AuthAccount.passwordHash`;
4. preenche `usedAt`;
5. atualiza `passwordChangedAt`;
6. revoga sessoes ativas.

Entao `usedAt` existe para garantir uso unico. Mesmo que alguem tente repetir a requisicao com o mesmo token, o backend deve rejeitar.
# 5. Controller de autenticação e endpoints

O `AuthController` é a porta HTTP do módulo de autenticação.
- Recebe as requisições
- Valida os dados de entrada via DTO
- Delega a regra de negócio para o `AuthService`.

No desenho da aplicação:

- o controller define rota, método HTTP e status de resposta;
- os DTOs (`SignUpDto`, `SignInDto`, etc.) definem o contrato do payload;
- o service executa a lógica de autenticação;
- o retorno do service vira a resposta da API.

Esse padrão separa bem responsabilidades:

- controller: camada de transporte HTTP;
- service: camada de negócio;
- prisma: camada de persistência.

## 5.1 Papel do AuthController

Quando olhamos para a definicao da classe, vemos algo nesta linha:

```typescript
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}
}
```

Cada parte cumpre uma funcao bem especifica:

- `@Controller('auth')`: informa ao NestJS que esta classe e um controller e define o prefixo base das rotas. Na pratica, os endpoints dessa classe respondem sob `/auth`.
- `export class AuthController`: declara a classe responsavel por receber as requisicoes HTTP relacionadas a autenticacao.
- `constructor(private readonly authService: AuthService) {}`: aqui acontece a injecao de dependencia. O controller nao implementa login, refresh ou logout por conta propria; ele recebe uma instancia de `AuthService`, que concentra a regra de negocio.

Isso reforca a separacao de papeis do framework: o controller organiza a entrada e a saida HTTP, enquanto o service executa o processamento real.

Como a aplicacao usa prefixo global `api`, a rota final exposta ao cliente fica como `/api/auth/...`.

Outro detalhe importante do controller e a captura do contexto da sessao a partir da request.
Antes de chamar `signUp` ou `signIn`, o controller le:

- `userAgent` a partir do header `user-agent`;
- `ipAddress` a partir de `req.ip`.

Esses dados nao servem para autenticar o usuario, mas acompanham a criacao da `Session` para auditoria e rastreio de origem.

Um exemplo direto disso e o metodo de login:

```typescript
@Post('sign-in')
@HttpCode(HttpStatus.OK)
signIn(@Body() dto: SignInDto, @Req() req: Request) {
  return this.authService.signIn(dto, this.getSessionContext(req));
}
```

Leitura passo a passo:

- `@Post('sign-in')`: mapeia este metodo para requisicoes `POST` em `/auth/sign-in`.
- `@HttpCode(HttpStatus.OK)`: sobrescreve o comportamento padrao do NestJS para `POST`. Em vez de responder `201 Created`, o endpoint retorna `200 OK`, que faz mais sentido para um login bem-sucedido, pois nao ha criacao de um novo recurso nesse momento.
- `signIn(...)`: este e apenas o nome interno do metodo em TypeScript. Quem define a rota nao e o nome da funcao, e sim o decorador `@Post`.
- `@Body() dto: SignInDto`: o NestJS extrai o corpo JSON da requisicao e o coloca em `dto`, seguindo o formato definido por `SignInDto`. Se houver `ValidationPipe` configurado, dados invalidos podem ser rejeitados antes mesmo de chegar a regra de negocio.
- `@Req() req: Request`: da acesso ao objeto bruto da requisicao HTTP, permitindo ler metadados como IP e user agent.
- `this.getSessionContext(req)`: organiza esses metadados em um objeto simples antes de repassar ao service.
- `return this.authService.signIn(dto, ...)`: o controller apenas encaminha os dados ja organizados para o service. Toda a logica importante, como verificar senha, decidir sobre 2FA, emitir tokens e criar sessao, fica no `AuthService`.

Essa e a regra central que vale para quase todo controller em NestJS: o controller deve ser fino. Ele recebe a request, extrai e valida os dados, chama o service e devolve a resposta HTTP ao cliente.

## 5.2 Endpoints públicos de autenticação

- `POST /api/auth/sign-up`: cria conta local e inicia sessão autenticada.
- `POST /api/auth/sign-in`: autentica com email e senha e inicia sessão autenticada.
- `POST /api/auth/refresh`: renova sessão e emite novo par de tokens.
- `POST /api/auth/logout`: encerra sessão com invalidação de credenciais de renovação.
- `POST /api/auth/forgot-password`: inicia recuperação de senha com token de reset.
- `POST /api/auth/reset-password`: redefine senha a partir de token de recuperação válido.
- `GET /api/auth/42`: inicia o fluxo OAuth com o provedor 42.
- `GET /api/auth/42/callback`: recebe o `code` do OAuth, finaliza o login federado e emite tokens da aplicação.

## 5.3 DTOs usados pelo controller

- `SignUpDto`: `email`, `password`, `fullName`, `username`.
- `SignInDto`: `email`, `password`.
- `RefreshTokenDto`: `refreshToken`.
- `ForgotPasswordDto`: `email`.
- `ResetPasswordDto`: `token`, `newPassword`.

Esses DTOs definem o contrato de entrada de cada endpoint.
Em conjunto com `class-validator` e `ValidationPipe`, eles impedem que a regra de negocio receba payloads fora do formato esperado.

## 5.4 Status HTTP do fluxo de auth

- `201 Created`: cadastro (`sign-up`).
- `200 OK`: login (`sign-in`) e renovação (`refresh`).
- `204 No Content`: logout e reset de senha.
- `202 Accepted`: início de recuperação de senha (`forgot-password`).
- `302 Found`: redirecionamento de início do OAuth 42.

# 6. Cadastro de usuário

## 6.1 Entrada e validação

## 6.2 Hash da senha

## 6.3 Persistência do usuário

# 7. Login com email e senha

## 7.1 Validação do usuário

## 7.2 Verificação de senha

## 7.3 Decisão de fluxo com ou sem 2FA

## 7.4 Emissão inicial de tokens

## 7.5 Criação da sessão

## 7.6 Resposta de autenticação

# 8. Proteção de rotas

## 8.1 Guard

No NestJS, o Guard é a camada que decide se a requisição pode continuar ou não para o controller.

Você usará este guard colocando @UseGuards(JwtAuthGuard) em cima de rotas privadas.

Quando usamos `@UseGuards(JwtAuthGuard)` em uma rota privada, estamos dizendo:

- passe a requisição primeiro pelo fluxo de autenticação;
- só continue se houver usuário autenticado;
- se a autenticação falhar, interrompa antes de executar a regra de negócio.

No projeto, isso aparece de forma clara em `UsersController`:

```ts
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  ...

  // 2. Exact match 'me' routes
  @Get('me')
  getMe(@Req() req: RequestWithUser) {
    ...
  }
}
  ```

- o frontend chama `GET /api/users/me`;
- envia `Authorization: Bearer <accessToken>`;
- a rota está protegida com `@UseGuards(JwtAuthGuard)`;
- antes de `getMe()` rodar, o Guard entra em ação.

No NestJS, um Guard comum precisa ter um método obrigatório chamado canActivate(), que retorna true (pode passar) ou false (bloqueado). Esse método não precisa ser implementado por nós em `JwtAuthGuard`, porque estamos estendendo (herdando) a classe `AuthGuard('jwt')`, que é fornecida pela biblioteca @nestjs/passport.

```ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = ActiveUserDto>(
    err: unknown,
    user: unknown,
    info: unknown,
  ): TUser {
    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }
      const message =
        info instanceof Error ? info.message : 'User not authenticated';
      throw new UnauthorizedException(message);
    }
    return user as TUser;
  }
}
```

```ts
export class JwtAuthGuard extends AuthGuard('jwt')
```

Assim, a função `AuthGuard('jwt')` cria dinamicamente uma classe de Guard que fornece internamente o método `canActivate()`.

Quando a requisição bate na sua rota protegida, o NestJS chama automaticamente esse canActivate().

Esse método faz basicamente:
- Pega a requisição HTTP.
- Chama a função principal do Passport (`passport.authenticate('jwt')`).
- Aguarda o Passport buscar pela estratégia nomeada definida como `jwt`, que é a `JwtStrategy`.

## 8.2 Strategy JWT

A Strategy define as regras de autenticação. Ela é a responsável por fazer o trabalho sujo de ler o token, e devolver a resposta.

No nosso caso, a strategy chamada `'jwt'` ensina o Passport/NestJS a autenticar requisições usando JWT.

Ela é declarada assim:

```ts
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt')
```

O nome `'jwt'` é essencial porque é ele que conecta:

- `AuthGuard('jwt')` no Guard;
- `PassportStrategy(Strategy, 'jwt')` na Strategy.

No ciclo de vida da aplicacao, a classe `JwtStrategy` e criada quando o servidor sobe:
- nesse momento, ela registra a estratégia no Passport com o nome `'jwt'`;
- execução: a lógica real dela só roda quando um Guard protegido pede explicitamente para o Passport executar a estratégia `'jwt'`. O Passport pega aquela instância da JwtStrategy que ele guardou na inicialização do servidor e executa a verificação do token nela.

No construtor, a configuração base combina extratores.

```ts
super({
  jwtFromRequest: ExtractJwt.fromExtractors([
    extractAccessTokenFromCookie,
    ExtractJwt.fromAuthHeaderAsBearerToken(),
  ]),
  ignoreExpiration: false,
  secretOrKey: process.env.JWT_ACCESS_SECRET || 'default_dev_secret',
});
```

- `jwtFromRequest`: define de onde o token pode ser lido. No projeto, a strategy aceita token em cookie `accessToken` e em header `Authorization`;
- `ignoreExpiration: false`: se o token expirou, ele deve ser rejeitado;
- `secretOrKey`: é a chave usada para verificar se a assinatura do JWT é legítima.

## 8.3 Extração do access token

Formato esperado no header:

```txt
Authorization: Bearer <token>
```

Formato alternativo no cookie:

```txt
Cookie: accessToken=<token>
```

Sem um desses formatos, a Strategy nao encontra o token.

Ou seja, a leitura nao acontece "automaticamente por existir JWT"; ela acontece porque configuramos explicitamente extratores para os canais aceitos.

```ts
jwtFromRequest: ExtractJwt.fromExtractors([...])
```

No caso do header, o helper do `passport-jwt` faz exatamente o seguinte:

- procura o header `Authorization`;
- verifica se ele começa com `Bearer `;
- extrai só o token;
- entrega esse token para a próxima etapa da autenticação.

No caso do cookie, um extrator customizado:

- le o header `Cookie`;
- procura a chave `accessToken`;
- extrai o valor do cookie;
- entrega esse token para a mesma etapa de validacao.

## 8.4 Verificação de assinatura e expiração

A partir do momento em que o token foi encontrado, o Passport/JWT faz a validação técnica.

Ela acontece, em essência, em duas etapas:

1. assinatura: confirma que o token foi assinado pelo backend com o segredo correto;
2. expiração: confirma que o token ainda está dentro do tempo de vida.

Se a assinatura não bater, o token foi adulterado ou não foi emitido com a chave certa.
Se a expiração falhar, o token já não pode mais ser aceito.

Se qualquer uma dessas etapas falhar, a autenticação não chega nem ao `validate(payload)`.

## 8.5 Resolução do usuário autenticado

Se o token for válido, o Passport chama o método `validate(payload)` da instância da nossa classe `JwtStrategy`.
```ts
validate(payload: JwtPayload): ActiveUserDto {
    const id = payload.sub || payload.id;

    if (!id || typeof id !== 'string') {
      throw new UnauthorizedException('Invalid token payload');
    }
    return { id };
  }
```
Esse método recebe o payload decodificado do token.
No nosso caso, ele extrai:

- `payload.sub`, que é o claim JWT padrão para subject;
- ou `payload.id`, como fallback.

Depois aplica uma checagem fail-fast:
- se não houver um ID válido;-
- ou se ele não for string;

Assim que Strategy rodou (ou falhou ao rodar). É chamado o método handleRequest, com o erro ou com `{ id }` no caso de sucesso;

```ts
handleRequest<TUser = ActiveUserDto>(
    err: unknown,
    user: unknown,
    info: unknown,
  ): TUser {

    if (err || !user) {
      if (err instanceof Error) {
        throw err;
      }
      const message =
        info instanceof Error ? info.message : 'User not authenticated';
      throw new UnauthorizedException(message);
    }

    return user as TUser;
  }
```

- `err`: Se deu algum erro bizarro no processo.
- `user`: O que o método validate da sua Strategy retornou (o { id }). Se falhou, isso vem vazio.
- `info`: Metadados do erro do JWT (ex: a biblioteca avisa aqui "jwt expired" ou "signature invalid").

A biblioteca passport usa `unknown` para esses parâmetros porque ela foi feita para funcionar com qualquer tipo de projeto e qualquer estratégia

`O Fail-Fast do Guard`: Se teve erro, ou se o usuário não veio (token inválido/ausente), a catraca trava. Ele tenta extrair a mensagem de erro específica do info (muito útil para o frontend saber, por exemplo, que o motivo do bloqueio foi especificamente expiração, permitindo ao frontend tentar usar o Refresh Token).
Lança um Erro 401 (Unauthorized) que encerra a requisição na hora.

Se der tudo certo retorna `request.user`, esse
 retorno é o que passa a virar `request.user`.

Resumo do fluxo na prática:

1. frontend chama `GET /api/users/me` com bearer token ou com cookie `accessToken`;
2. `JwtAuthGuard` intercepta por causa de `@UseGuards`;
3. o `canActivate()` herdado de `AuthGuard('jwt')` manda o Passport executar a Strategy `'jwt'`;
4. a Strategy usa os extratores configurados para achar o token no header ou no cookie;
5. o Passport verifica assinatura e validade;
6. se passar, chama `validate(payload)`;
7. `validate` extrai o ID e retorna algo como `{ id: '123' }`;
8. o Guard analisa: se há erro ou se não veio usuário, responde `401`;
9. se estiver tudo certo, o NestJS anexa esse objeto em `request.user`;
10. o controller usa `request.user.id` para consultar o banco e buscar o perfil.

Em outras palavras:

- a Strategy ensina como autenticar;
- o Guard decide quando essa autenticação deve ser executada;
- o nome `'jwt'` é o elo entre os dois;
- o resultado final da autenticação bem-sucedida aparece no controller como `request.user`.

# 9. Renovação de sessão

## 9.1 Endpoint de refresh

A renovacao de sessao acontece no endpoint:

```txt
POST /api/auth/refresh
```

O cliente pode enviar no body:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

Ou pode depender do cookie `refreshToken` quando o fluxo de autenticacao usa cookies `httpOnly`.

Esse endpoint nao existe para acessar recurso protegido nem para "logar de novo". A funcao dele e apenas renovar as credenciais de acesso quando o `access token` expirou.

No fluxo completo do projeto, a ordem e esta:

1. o cliente percebe que o `access token` expirou;
2. envia o `refreshToken` para `/api/auth/refresh` no body ou usa a versao por cookie;
3. o backend valida o token e a sessao correspondente;
4. se tudo estiver correto, emite novo `accessToken` e novo `refreshToken`;
5. a sessao antiga deixa de valer e uma nova sessao passa a representar a continuidade do login.

## 9.2 Validação do refresh token

O primeiro bloco de validacao e em cima do proprio token recebido.

O backend trata o `refreshToken` como um JWT assinado com `JWT_REFRESH_SECRET`. Isso significa que ele precisa verificar:

- se o token foi realmente emitido pelo backend;
- se a assinatura continua integra;
- se o token ainda nao expirou;
- se o payload contem um `sub` valido.

No service, essa etapa acontece antes de consultar o banco. A logica e:

1. receber o `refreshToken` do body ou do cookie;
2. chamar a verificacao JWT usando `JWT_REFRESH_SECRET`;
3. ler o payload;
4. extrair `sub`, que representa o `userId`;
5. rejeitar imediatamente se a assinatura falhar, se o token estiver expirado ou se o `sub` nao existir.

Essa ordem importa porque um token malformado, adulterado ou expirado nao deve nem entrar no restante do fluxo.

O resultado util dessa etapa e: "este token tem formato valido, foi assinado com o segredo correto e diz pertencer ao usuario X".

## 9.3 Verificação da sessão

Depois de validar o JWT, o backend precisa validar a sessao persistida.

Esse passo existe porque o refresh token, no projeto, nao e confiado apenas ao JWT. Ele tambem precisa estar ligado a um registro ativo em `Session`.

O fluxo e este:

1. o backend calcula o hash do `refreshToken` recebido;
2. procura uma linha em `Session.refreshTokenHash`;
3. encontra a sessao correspondente;
4. valida se essa sessao ainda pode renovar credenciais.

As verificacoes principais sao:

- a sessao existe;
- `status === ACTIVE`;
- `revokedAt === null`;
- `expiresAt > now`;
- `session.userId === payload.sub`.

Cada checagem cobre um risco diferente:

- se nao existir sessao, o token nao e reconhecido;
- se estiver revogada, logout ou regra de seguranca ja encerraram aquela continuidade;
- se estiver expirada, a janela da sessao acabou;
- se `userId` nao bater com o `sub`, ha inconsistencia entre token e sessao.

Esse ponto e o coracao do controle stateful da autenticacao. E ele que transforma o refresh em algo revogavel, auditavel e rotacionavel.

## 9.4 Emissão de novo access token

Quando token e sessao passam pelas validacoes, o backend emite um novo `accessToken`.

Esse novo token volta a cumprir o mesmo papel do anterior:

- autenticar requests nas rotas privadas;
- ser enviado no header `Authorization: Bearer ...`;
- durar pouco tempo;
- carregar apenas claims minimas, principalmente `sub` e `email`.

O importante aqui e entender que a renovacao nao "ressuscita" o access token antigo. Ela cria um token novo, com nova validade, assinado novamente com `JWT_ACCESS_SECRET`.

Na pratica, a sessao continua, mas a credencial curta de acesso e substituida.

## 9.5 Rotação do refresh token

Renovar sessao nao significa devolver o mesmo refresh token de novo. O fluxo correto usa rotacao.

Rotacionar significa:

1. o cliente apresenta um refresh token valido;
2. o backend gera outro refresh token;
3. esse novo token passa a ser o unico aceito para a proxima renovacao.

O objetivo disso e reduzir risco de replay.

Sem rotacao, um refresh token roubado continuaria reutilizavel ate expirar.
Com rotacao, cada uso troca a credencial longa por outra. Assim, o token anterior deixa de ser o representante atual da sessao.

No projeto, esse comportamento se conecta diretamente ao model `Session`:

- cada refresh emite um novo JWT de refresh;
- o hash desse novo token e salvo em uma nova sessao;
- a sessao anterior deixa de ser a sessao ativa para continuidade.

## 9.6 Revogação/substituição da sessão anterior

Depois de criar a nova sessao, o backend encerra a anterior.

Esse encerramento acontece marcando a sessao antiga como revogada:

- `status: REVOKED`
- `revokedAt: now`
- `replacedBySessionId: <id da nova sessao>`

Essa relacao de substituicao tem duas funcoes importantes.

Primeira: manter o historico da cadeia de renovacao.

Segunda: registrar que aquele token antigo ja foi substituido por outro. Se um refresh token associado a uma sessao ja substituida aparecer de novo, isso indica reapresentacao de um token que nao deveria mais circular.

No estado atual do codigo, porem, essa relacao e mais util para leitura e auditoria do que para a validacao principal do refresh, porque a rejeicao da sessao antiga ja acontece por `revokedAt` e `status`.

Conceitualmente, o refresh cria uma transicao assim:

```txt
Sessao A (ativa) -> refresh usado -> Sessao A revogada + Sessao B ativa
```

Assim, a continuidade do login passa para a nova sessao, e nao fica espalhada por varias sessoes ativas representando o mesmo refresh encadeado.

## 9.7 Resposta com novo par de tokens

No fim do processo, o backend responde com:

```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

O cliente substitui os tokens antigos pelos novos.

Se o fluxo usa cookies `httpOnly`, o backend tambem pode atualizar os cookies de `accessToken` e `refreshToken` na mesma resposta, sem expor os valores ao JavaScript do frontend.

O comportamento esperado do frontend e:

1. guardar o novo `accessToken`;
2. guardar o novo `refreshToken`;
3. repetir a request original que falhou por expiracao do access token, quando essa politica estiver habilitada;
4. tratar `401` no refresh como perda de sessao, exigindo novo login.

Em caso de erro, o backend responde `401` sem expor detalhes sensiveis. Isso cobre situacoes como:

- token ausente;
- token invalido;
- token expirado;
- sessao inexistente;
- sessao revogada;
- sessao expirada.

# 10. Logout

## 10.1 Endpoint de logout

O encerramento de sessao acontece no endpoint:

```txt
POST /api/auth/logout
```

O cliente pode enviar no body:

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

Ou pode depender do cookie `refreshToken` quando o fluxo de sessao usa cookie `httpOnly`.

A resposta esperada e:

```txt
204 No Content
```

O objetivo do logout nao e invalidar retroativamente todos os access tokens ja emitidos nem "apagar" o JWT do mundo. O objetivo e impedir que aquela sessao continue se renovando por meio do refresh token.

No fluxo do projeto, logout significa:

1. o cliente informa qual refresh token representa a sessao que deseja encerrar, por body ou por cookie;
2. o backend encontra a sessao correspondente;
3. a sessao e revogada no banco;
4. aquele refresh token deixa de poder renovar credenciais;
5. o cliente remove as credenciais locais.

Isso torna o logout efetivo no que realmente importa para continuidade da autenticacao: a capacidade de manter a sessao viva.

## 10.2 Localização da sessão pelo hash

Para localizar a sessao, o backend nao usa o refresh token puro como valor persistido.

O fluxo e:

1. receber o `refreshToken`;
2. calcular o hash do token com o mesmo algoritmo usado na criacao da sessao;
3. procurar esse hash em `Session.refreshTokenHash`;
4. identificar a sessao correspondente, se ela existir.

Esse desenho segue a mesma regra de seguranca usada em outras partes do projeto: o banco nao guarda o token utilizavel em texto puro.

Isso traz duas vantagens diretas:

- se a base de dados for exposta, os refresh tokens nao estao imediatamente prontos para uso;
- o backend continua conseguindo localizar a sessao de forma deterministica, porque o mesmo token sempre produz o mesmo hash.

No logout, essa busca pelo hash e suficiente. Diferente do refresh, o backend nao precisa gerar novos tokens nem comparar `sub` com uma renovacao em andamento. Ele so precisa descobrir qual sessao deve ser encerrada.

Por isso, o logout e mais simples que o refresh:

- no refresh, o backend precisa confiar no token para emitir novas credenciais;
- no logout, o backend precisa apenas localizar e encerrar a sessao correspondente.

Essa diferenca explica por que refresh exige validacao mais completa do JWT, enquanto logout pode ser tratado como operacao idempotente de revogacao.

## 10.3 Revogação da sessão

Depois de localizar a sessao, o backend revoga esse registro.

Revogar significa marcar a sessao como nao utilizavel para novas renovacoes:

- `status: REVOKED`
- `revokedAt: now`

Com isso, qualquer tentativa posterior de usar aquele mesmo refresh token no endpoint de refresh falha na etapa de verificacao da sessao.

Conceitualmente, a sessao muda de:

```txt
ACTIVE -> REVOKED
```

Esse estado persistido e o que faz o logout ter efeito real.

Se o cliente apresentar um token que nao corresponde a nenhuma sessao ativa, o backend responde `204` da mesma forma. Isso torna o logout idempotente.

Ser idempotente aqui significa:

- pedir logout duas vezes produz o mesmo resultado final;
- pedir logout para uma sessao ja encerrada nao vaza informacao;
- pedir logout para um token que nao existe nao revela se aquela sessao algum dia existiu.

Essa escolha reduz exposicao desnecessaria sobre o estado interno das sessoes.

## 10.4 Limpeza de credenciais no cliente

Depois da resposta `204`, o cliente deve remover as credenciais locais associadas aquela sessao.

Na pratica, isso inclui:

- apagar `accessToken`;
- apagar `refreshToken`;
- limpar estado de usuario autenticado no store;
- redirecionar para tela publica ou login, conforme a navegacao da aplicacao.

Se o fluxo usar cookies `httpOnly`, o backend tambem limpa os cookies de autenticacao, e o frontend fica responsavel principalmente por limpar o estado local do usuario.

Essa parte e importante porque logout tem dois lados:

- no backend, a sessao persistida deixa de poder renovar;
- no frontend, o cliente deixa de tentar usar credenciais antigas.

Mesmo que um access token antigo ainda esteja dentro da propria janela curta de expiracao, sem o refresh token valido ele perde a capacidade de manter a sessao viva. Por isso, no desenho completo do projeto, logout e a combinacao de:

1. revogacao da sessao no banco;
2. descarte das credenciais no cliente.

# 11. Recuperação e redefinição de senha

## 11.1 Forgot-password

### 11.1.1 Geração do token de reset

O fluxo de recuperacao comeca quando o usuario envia o email no endpoint:

```txt
POST /api/auth/forgot-password
```

O backend recebe esse email, localiza a conta correspondente e prepara uma credencial temporaria de recuperacao.

Essa credencial e um token aleatorio, longo e dificil de adivinhar. Ele nao e a senha nova e nao e um JWT de sessao. Ele serve apenas para autorizar a etapa seguinte de redefinicao.

O objetivo desse token e responder a pergunta:

```txt
quem recebeu este link pode trocar a senha desta conta?
```

Esse token precisa ser:

- imprevisivel;
- curto em tempo de vida;
- de uso unico;
- separado do fluxo normal de login.

No desenho do projeto, o link enviado ao usuario carrega esse token em algo como:

```txt
/reset-password?token=<reset-token>
```

### 11.1.2 Persistência do hash

Assim como acontece com `refreshToken`, o backend nao salva o token de reset em texto puro.

O fluxo correto e:

1. gerar o token aleatorio;
2. calcular o hash desse token;
3. salvar no banco apenas `PasswordResetToken.tokenHash`;
4. enviar o token puro apenas ao usuario, dentro do link.

Isso existe para reduzir impacto em caso de vazamento de banco. Quem enxergar a tabela nao encontra o token pronto para uso.

Esse registro em `PasswordResetToken` fica ligado ao usuario e representa uma autorizacao temporaria de troca de senha, nao uma sessao autenticada.

### 11.1.3 Expiração e uso único

Recuperacao de senha e um fluxo sensivel, entao o token precisa expirar rapido.

No projeto, a expiracao e controlada por configuracao, usando `PASSWORD_RESET_EXPIRES_MINUTES`, e o valor final fica salvo em `PasswordResetToken.expiresAt`.

Quando o usuario tentar usar o link, o backend precisa exigir:

- token existente;
- `usedAt === null`;
- `expiresAt > now`.

Essas tres checagens impedem:

- reutilizacao do mesmo link;
- uso de token velho;
- reaproveitamento de token ja consumido.

Outro detalhe importante do fluxo e a invalidacao dos tokens anteriores ainda abertos do mesmo usuario. Assim, o reset mais recente passa a ser o representante valido da recuperacao, e links antigos deixam de competir entre si.

### 11.1.4 Envio de email

Depois de gerar o token e salvar o hash, o backend precisa entregar esse token ao usuario por email.

No projeto, esse envio usa SMTP via `nodemailer`, com uma conta Gmail como provedor de entrega.

Esse ponto precisa ser entendido em duas camadas:

- `nodemailer`: biblioteca Node/Nest usada para montar e enviar a mensagem;
- Gmail SMTP: servidor SMTP que recebe essa mensagem do backend e a entrega.

O backend monta um link como:

```txt
https://frontend/reset-password?token=<reset-token>
```

e envia esse link para o email do usuario.

### 11.1.4.1 Papel do Gmail SMTP

O Gmail SMTP e o servico usado para entrega real das mensagens transacionais do projeto, como reset de senha.

Nesse desenho, a aplicacao usa uma conta Gmail dedicada ao projeto para disparar as mensagens.

O fluxo conceitual e:

1. o backend monta a mensagem;
2. o `nodemailer` autentica nessa conta Gmail via SMTP;
3. o Gmail aceita a mensagem;
4. o email e entregue ao destinatario real.

Isso permite que o fluxo de reset de senha chegue diretamente na caixa de entrada real dos usuarios da avaliacao.

### 11.1.4.2 App Password e autenticação

Para a conta Gmail ser usada pelo backend, a autenticacao SMTP nao deve usar a senha normal da conta.

O caminho correto e:

1. ativar `2-Step Verification` na conta Gmail;
2. gerar um `App Password`;
3. colocar esse `App Password` em `SMTP_PASSWORD`;
4. usar o proprio email da conta em `SMTP_USER` e `SMTP_FROM`.

Esse `App Password` funciona como uma credencial especifica para o projeto, sem expor a senha principal da conta.

### 11.1.4.3 Envio para inbox real

Como o envio e feito por uma conta Gmail real, o email pode chegar diretamente nas caixas de entrada dos destinatarios.

Isso elimina a necessidade de usar um dominio de envio verificado apenas para a banca do projeto.

Na pratica, o avaliador pode:

- pedir o reset de senha;
- receber a mensagem em email real;
- abrir o link;
- concluir a redefinicao normalmente.

Para o contexto de avaliacao, esse caminho entrega uma experiencia mais direta e com menos infraestrutura externa.

### 11.1.4.4 Configuração SMTP usada pelo projeto

As variaveis de ambiente do backend representam a ponte entre a aplicacao e o Gmail SMTP:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-project-email@gmail.com
SMTP_PASSWORD=your_gmail_app_password
SMTP_FROM=your-project-email@gmail.com
```

O sentido de cada uma e:

- `SMTP_HOST`: endereco do servidor SMTP do Gmail;
- `SMTP_PORT`: porta de conexao SMTP;
- `SMTP_USER`: conta Gmail usada para autenticacao;
- `SMTP_PASSWORD`: App Password gerado nessa conta;
- `SMTP_FROM`: remetente usado no email, normalmente o mesmo endereco Gmail autenticado.

No backend, o `nodemailer` usa essas variaveis para abrir a conexao SMTP e disparar a mensagem.

### 11.1.4.5 Serviço de email do projeto

No desenho do projeto, a responsabilidade de entrega de email nao fica espalhada dentro do fluxo de autenticacao.

Ela fica concentrada em um servico dedicado de mail, com responsabilidade unica:

- receber o destino e o link de reset;
- decidir se o envio sera real via SMTP;
- aplicar o fallback local quando SMTP nao estiver configurado;
- evitar que o restante da autenticacao precise conhecer detalhes do provedor de email.

Conceitualmente, a divisao fica assim:

- `AuthService`: decide quando um email de reset deve ser disparado;
- `MailService`: decide como esse email sera entregue.

Essa separacao existe para manter o fluxo de autenticacao focado em token, validade, hash e revogacao, enquanto o fluxo de entrega fica focado em SMTP, mensagem e fallback.

### 11.1.4.6 Fallback em desenvolvimento

Quando SMTP nao estiver configurado, o fluxo de recuperacao ainda pode ser testado localmente.

Nesse caso, o backend:

1. gera o token;
2. salva o hash;
3. monta o link;
4. nao envia email real;
5. registra o link no log do ambiente de desenvolvimento.

Esse fallback existe para nao bloquear teste local da funcionalidade.

Mesmo assim, a regra conceitual do projeto continua a mesma:

- com SMTP configurado, o link e entregue por email;
- sem SMTP configurado em ambiente local, o link e exibido apenas para teste controlado.

### Papel do frontend nesta etapa

No frontend, esse inicio de fluxo acontece em tres pontos simples e bem definidos:

1. a tela de login oferece o link `Forgot password?`;
2. esse link leva para a rota publica `/forgot-password`;
3. essa tela envia `POST /api/auth/forgot-password` com o email informado.

No projeto, essa etapa foi implementada sem depender de sessao autenticada:

- `ForgotPassword.tsx` faz a validacao basica do email;
- `auth.service.ts` chama `POST /api/auth/forgot-password`;
- `api.ts` trata essa rota como excecao, sem tentar `refresh` automatico em caso de `401`.

Outro detalhe importante e a resposta visual ao usuario. Mesmo quando o backend aceita a requisicao, o frontend mostra uma mensagem neutra no estilo:

```txt
If an account matches this email, a password reset link is on its way.
```

Essa resposta evita revelar se aquele email realmente existe ou nao na base.

## 11.2 Reset-password

### 11.2.1 Validação do token de reset

O usuario acessa o link recebido, informa a nova senha e envia:

```txt
POST /api/auth/reset-password
```

com:

- `token`
- `newPassword`

Antes de trocar qualquer dado, o backend precisa validar o token de reset.

O fluxo e:

1. receber o token;
2. calcular o hash desse token;
3. buscar `PasswordResetToken` pelo hash;
4. verificar se ele existe;
5. verificar se `usedAt` ainda esta `null`;
6. verificar se `expiresAt` ainda esta no futuro.

Sem essas checagens, qualquer link antigo, repetido ou vencido poderia continuar autorizando troca de senha.

### 11.2.2 Hash da nova senha

Quando o token de reset passa na validacao, o backend processa a nova senha.

Essa senha nunca deve ser salva em texto puro.

O backend:

1. recebe `newPassword`;
2. gera `bcrypt hash`;
3. atualiza `AuthAccount.passwordHash` da conta local do usuario.

Esse passo segue exatamente a mesma regra de seguranca usada no cadastro e no login local.

Outro detalhe conceitual importante: reset de senha local exige que exista uma conta `AuthAccount` com `provider: LOCAL`. Se a conta do usuario depender apenas de login federado, o fluxo de troca de senha local nao se aplica da mesma forma.

### 11.2.3 Marcação do token como usado

Depois da redefinicao bem-sucedida, o token de reset deixa de poder ser reutilizado.

Isso e representado pela marcacao de `usedAt`.

No desenho completo, o resultado esperado e:

- o token consumido passa a ter `usedAt` preenchido;
- tokens pendentes equivalentes daquele usuario deixam de continuar abertos;
- qualquer nova tentativa com aquele mesmo link falha.

Esse e o mecanismo que transforma o reset em operacao de uso unico.

### 11.2.4 Atualização de passwordChangedAt

Ao trocar a senha, o backend atualiza `User.passwordChangedAt`.

Esse campo funciona como marcador de seguranca da ultima alteracao de credencial.

Ele serve para:

- auditoria;
- rastreio de mudanca sensivel;
- apoio a politicas de revogacao e invalidacao de sessoes.

Conceitualmente, ele registra:

```txt
esta conta teve sua credencial local alterada neste momento
```

### 11.2.5 Revogação de sessões ativas

Trocar a senha nao deve deixar as sessoes antigas seguirem normalmente como se nada tivesse acontecido.

Por isso, depois do reset bem-sucedido, o backend revoga as `Session` ativas do usuario.

Na pratica:

- `status` passa para `REVOKED`;
- `revokedAt` recebe o instante da revogacao.

Isso significa que refresh tokens antigos perdem a capacidade de renovar a sessao.

Esse passo e essencial porque reset de senha normalmente acontece em contexto sensivel:

- senha esquecida;
- suspeita de comprometimento;
- tentativa de retomar controle da conta.

Sem revogacao das sessoes ativas, uma credencial longa antiga poderia continuar prolongando acesso mesmo depois da troca de senha.

### Papel do frontend nesta etapa

Quando o usuario recebe o email e abre o link, o frontend entra na segunda metade do fluxo.

O link enviado pelo backend usa `PASSWORD_RESET_FRONTEND_URL`, que no ambiente local aponta para algo como:

```txt
https://localhost:5173/reset-password?token=<reset-token>
```

No frontend, a rota publica `/reset-password`:

1. le o `token` da query string;
2. exibe campos de `newPassword` e `confirmPassword`;
3. valida formato minimo da senha antes do envio;
4. envia `POST /api/auth/reset-password` com `token` e `newPassword`.

No projeto, isso foi distribuido assim:

- `ResetPassword.tsx`: leitura do token, validacao local e submit;
- `auth.service.ts`: chamada para `POST /api/auth/reset-password`;
- `App.tsx`: registro da rota publica `/reset-password`.

Alguns detalhes do comportamento atual do frontend sao importantes:

- se o link chegar sem `token`, o botao de submit fica inutilizado e a tela mostra erro;
- a senha nova precisa ter pelo menos 8 caracteres e conter ao menos uma letra e um numero, alinhando o frontend com a validacao do backend;
- depois do `204 No Content`, o frontend mostra mensagem de sucesso e redireciona o usuario de volta para `/login`.

Esse redirecionamento nao significa que a conta ficou autenticada. Ele apenas conclui a UX do reset e devolve o usuario ao ponto normal de entrada no sistema.

# 12. OAuth 42

## 12.1 Início do fluxo

O login federado com a 42 comeca quando o usuario aciona:

```txt
GET /api/auth/42
```

Essa rota nao autentica o usuario diretamente. Ela apenas inicia o redirecionamento para a pagina de autorizacao da 42.

O papel desse endpoint e:

1. preparar os parametros do fluxo OAuth;
2. criar protecao contra CSRF via `state`;
3. redirecionar o navegador para a 42.

No desenho completo do projeto, o navegador sai da aplicacao, passa pela 42 e depois volta para o backend no callback configurado.

Os parametros principais enviados para a 42 sao:

- `client_id`
- `redirect_uri`
- `response_type=code`
- `scope`
- `state`

O `client_id` identifica a aplicacao do projeto dentro da 42, enquanto o `redirect_uri` define exatamente para onde a 42 deve devolver o usuario depois da autorizacao.

## 12.2 Uso de state

O `state` e um valor aleatorio criado antes do redirecionamento.

Ele existe para proteger o fluxo OAuth contra CSRF e callback forjado.

No projeto, o raciocinio correto e:

1. o backend gera um `state` imprevisivel;
2. salva esse valor em cookie `httpOnly` temporario;
3. envia o mesmo `state` na URL de autorizacao da 42;
4. quando a 42 chama o callback, devolve esse `state`;
5. o backend compara o valor recebido com o valor salvo no cookie.

Se esses valores nao baterem, o callback nao deve ser aceito.

Esse controle responde a uma pergunta muito importante:

```txt
este callback realmente pertence ao fluxo iniciado por este navegador?
```

O uso de cookie `httpOnly` aqui e intencional:

- o frontend nao precisa manipular esse valor;
- o navegador o envia automaticamente de volta ao backend;
- o `state` nao fica exposto como dado de aplicacao controlado por JavaScript.

## 12.3 Callback com authorization code

Depois que o usuario autoriza a aplicacao na 42, o navegador volta para:

```txt
GET /api/auth/42/callback?code=...&state=...
```

Nesse momento, o backend recebe:

- `code`
- `state`

O `code` nao e token final de sessao do projeto. Ele e apenas um `authorization code` emitido pela 42 para ser trocado por credencial do provedor.

O callback faz a validacao de entrada nesta ordem:

1. verifica se `code` existe;
2. verifica se `state` existe;
3. le o `state` salvo no cookie;
4. compara os valores;
5. rejeita o fluxo se houver qualquer inconsistência.

Se o callback for valido, o backend segue para a troca do `code` pelo token do provedor.

Se o callback falhar na validacao de `state`, o fluxo deve terminar sem autenticar o usuario localmente.

Esse ponto ajuda a separar duas autenticacoes diferentes que acontecem no fluxo:

1. primeiro o usuario se autentica na 42;
2. depois a nossa aplicacao se identifica para a 42 ao trocar o `code` por token usando `client_id` e `client_secret`.

Entao, no callback, o backend ja nao esta mais pedindo senha do usuario.

Ele esta provando para a 42 que esta autorizado a receber o resultado daquele fluxo OAuth.

## 12.4 Troca por token do provedor

Com o `code` valido em maos, o backend envia uma requisicao de servidor para servidor para a 42:

```txt
POST https://api.intra.42.fr/oauth/token
```

Esse passo usa:

- `client_id`
- `client_secret`
- `code`
- `redirect_uri`
- `grant_type=authorization_code`

O objetivo aqui e obter um access token da 42.

Esse token do provedor nao e o mesmo access token usado pela API do projeto.

E importante separar:

- token da 42: permite consultar dados do usuario na API da 42;
- token interno do projeto: autentica o usuario nas rotas do sistema.

No desenho atual do projeto, o backend usa o token da 42 apenas para concluir o login federado e nao o expõe ao frontend como credencial da aplicacao.

## 12.5 Leitura do perfil externo

Depois de receber o access token da 42, o backend consulta o perfil do usuario no provedor:

```txt
GET https://api.intra.42.fr/v2/me
Authorization: Bearer <42_access_token>
```

Dessa resposta, o projeto extrai os campos que interessam para identidade local, como:

- id da 42;
- email;
- login;
- nome exibido;
- avatar, se existir.

Esses dados sao usados para responder duas perguntas:

```txt
quem e este usuario dentro da 42?
como essa identidade se conecta ao nosso modelo local?
```

O `id` da 42 vira o identificador principal do `AuthAccount` federado, porque ele e a prova mais estavel de que aquela conta externa ja foi vinculada antes.

No estado atual do codigo, o access token da 42 e usado essencialmente para esta etapa de leitura do perfil.

Depois disso, ele nao e reaproveitado como token operacional da aplicacao.

## 12.6 Criação ou vinculação de usuário local

O sistema nao trabalha apenas com a identidade externa. Ele precisa resolver isso para `User` e `AuthAccount` locais.

O desenho do projeto separa:

- `User`: identidade da conta dentro da aplicacao;
- `AuthAccount`: mecanismo de autenticacao usado por essa conta.

No login OAuth 42, o fluxo de resolucao e:

1. procurar `AuthAccount` com:
   - `provider: FORTY_TWO`
   - `providerAccountId: <id da 42>`
2. se existir, reutilizar essa vinculacao;
3. se nao existir, procurar `User` local pelo email;
4. se tambem nao existir, criar um `User` novo;
5. criar `AuthAccount` com provider `FORTY_TWO` ligado ao usuario resolvido.

Esse modelo permite:

- reconhecer o mesmo usuario da 42 em logins repetidos;
- evitar criar usuarios duplicados desnecessariamente;
- manter o registro local da forma de autenticacao federada.

Os campos conceituais mais importantes nessa vinculacao sao:

- `User.email`
- `User.username`
- `User.fullName`
- `User.avatarUrl`
- `User.accountType = oauth_42`
- `AuthAccount.provider = FORTY_TWO`
- `AuthAccount.providerAccountId = <id da 42>`
- `AuthAccount.providerEmail`

O `username` local precisa continuar obedecendo as regras da aplicacao. Por isso, quando necessario, o backend deriva um username unico a partir do login da 42 e resolve colisao localmente.

Hoje, o backend tambem salva `scope` no `AuthAccount`, mas esse campo funciona mais como metadado do vinculo OAuth do que como parte ativa da regra de negocio.

Em outras palavras:

- ele registra o escopo concedido pelo provedor;
- mas nao dirige nenhuma decisao relevante do backend no fluxo atual.

## 12.7 Emissão de tokens próprios

Depois que o usuario externo foi resolvido para uma conta local, o projeto emite as credenciais da propria aplicacao.

Esse passo e igual em natureza ao login local:

- gerar `accessToken` interno;
- gerar `refreshToken` interno.

Esses tokens nao representam acesso a API da 42. Eles representam acesso ao backend do projeto.

O `accessToken` continua sendo curto e serve para rotas privadas.
O `refreshToken` continua sendo longo, persistido apenas como hash em `Session`, e serve para renovar a sessao.

No fluxo OAuth, isso e importante porque a conta entra por autenticacao federada, mas depois navega dentro do sistema usando exatamente a mesma infraestrutura interna de sessao usada pelo restante da autenticacao.

Esse e o ponto central do fluxo:

- a 42 valida a identidade externa;
- o nosso backend converte isso em autenticacao interna propria.

Entao, depois de consultar `GET /v2/me`, o sistema deixa de depender dos tokens da 42 para a navegacao normal da aplicacao.

Quem passa a governar a sessao do usuario sao:

- os tokens emitidos pelo nosso backend;
- a `Session` local persistida no banco.

## 12.8 Criação de sessão local

Depois da emissao dos tokens internos, o backend cria a `Session` local associada ao refresh token.

Isso significa:

1. calcular hash do refresh token;
2. criar registro em `Session`;
3. associar a sessao ao `userId`;
4. guardar expiracao e metadados de origem.

Essa sessao e o ponto que unifica o fluxo OAuth com o restante da autenticacao do projeto.

Em seguida, o backend finaliza o callback assim:

1. seta `accessToken` em cookie `httpOnly`;
2. seta `refreshToken` em cookie `httpOnly`;
3. limpa o cookie temporario de `state`;
4. redireciona o navegador para:

```txt
/auth/callback
```

Nesse desenho, os tokens nao ficam expostos na URL. O backend encerra a parte federada do fluxo e entrega ao navegador uma sessao inicial baseada em cookies `httpOnly`.

## 12.9 Papel do frontend no callback

Quando o navegador chega em:

```txt
/auth/callback
```

o frontend nao recebe `accessToken` nem `refreshToken` na query string.

Isso e intencional. No modelo atual do projeto, o frontend:

- nao precisa ler token do query string;
- nao consegue ler diretamente os cookies `httpOnly`;
- usa o proprio backend para concluir a sessao visivel para a aplicacao React.

O fluxo do frontend fica assim:

1. a pagina de callback e carregada;
2. ela verifica se veio algum `?error=...` do backend;
3. se nao houve erro, chama `POST /api/auth/refresh`;
4. o navegador envia automaticamente o cookie `refreshToken`;
5. o backend valida a `Session` e devolve um novo par de tokens do projeto;
6. o frontend chama `GET /api/users/me`;
7. com o usuario resolvido, atualiza o estado autenticado da aplicacao e redireciona para a area interna.

Esse passo de `refresh` logo no callback nao existe para "fazer OAuth de novo". Ele existe para transformar a sessao iniciada por cookie `httpOnly` em estado utilizavel pelo frontend atual.

Na pratica, isso deixa o fluxo assim:

- cookies `httpOnly` continuam sendo a base de continuidade da sessao;
- o frontend obtem o usuario autenticado por meio do backend;
- `accessToken` e `refreshToken` internos voltam a ficar disponiveis no estado da aplicacao do jeito que o restante do frontend espera hoje.

## 12.10 Por que o frontend precisou ser alinhado com HTTPS

Esse desenho do callback depende de o navegador conseguir enviar os cookies de auth de volta para o backend logo apos o redirecionamento do OAuth.

No projeto, o backend roda em:

```txt
https://localhost:3000
```

e os cookies de auth sao emitidos com:

- `httpOnly: true`
- `secure: true`
- `sameSite: 'lax'`

Por isso, o frontend local tambem precisou passar a rodar em:

```txt
https://localhost:5173
```

Se o frontend ficasse em `http://localhost:5173`, o callback do OAuth podia cair numa situacao ruim:

1. a 42 redireciona para o backend em HTTPS;
2. o backend seta cookies seguros;
3. o backend redireciona para o frontend em HTTP;
4. o frontend tenta chamar `POST /api/auth/refresh`;
5. o navegador pode bloquear o envio desses cookies nesse request;
6. o backend responde `401 Unauthorized`.

Entao, neste fluxo, alinhar backend e frontend em HTTPS local nao e detalhe cosmetico. E parte funcional da conclusao do login OAuth.

## 12.11 Concorrencia no callback e o efeito do React StrictMode

Durante o desenvolvimento, a pagina de callback ficou exposta a um comportamento importante do React:

- em `StrictMode`, efeitos podem ser executados duas vezes no ambiente de desenvolvimento;
- isso existe para ajudar a revelar efeitos colaterais e fluxos nao idempotentes.

No nosso caso, isso significava:

1. a tela `/auth/callback` montava;
2. o `useEffect` disparava `POST /api/auth/refresh`;
3. o `StrictMode` remontava o componente;
4. o mesmo `useEffect` disparava outro `POST /api/auth/refresh`.

Essas duas requisicoes concorrentes nao eram apenas ruido visual. Elas realmente conseguiam interferir no fluxo.

### 12.11.1 O que isso expôs no backend

Antes do ajuste no `refreshToken`, o backend podia gerar dois refresh tokens identicos se:

- o `sub` fosse o mesmo;
- o `email` fosse o mesmo;
- o secret fosse o mesmo;
- a emissao ocorresse no mesmo segundo;
- e nao existisse nenhuma entropia extra no payload.

Nessa situacao:

- os dois JWTs de refresh podiam sair iguais;
- o hash salvo em `Session.refreshTokenHash` tambem ficava igual;
- a segunda insercao violava a constraint `UNIQUE`.

Por isso aparecia erro como:

```txt
duplicate key value violates unique constraint "Session_refreshTokenHash_key"
```

O ajuste estrutural do backend foi adicionar um `jti` aleatorio ao payload do refresh token.

Assim, mesmo que duas emissoes acontecam no mesmo segundo para o mesmo usuario, os refresh tokens deixam de ser identicos.

### 12.11.2 O que isso exigiu no frontend

Mesmo com o `jti` corrigindo a unicidade no backend, continuar disparando dois `refresh` no callback ainda seria desperdicio e deixaria o fluxo mais fragil.

Por isso, a pagina `OAuthCallback` passou a deduplicar a chamada de refresh em nivel de modulo:

- a primeira montagem cria uma promise compartilhada;
- a segunda montagem reutiliza essa mesma promise;
- apenas um `POST /api/auth/refresh` vai para a rede;
- o resultado final continua sendo processado pelo mount ativo.

Essa deduplicacao resolve melhor do que um `useRef` local porque o problema nao era so "rodar uma vez por mount". O problema era haver dois mounts reais do mesmo componente durante o `StrictMode` de desenvolvimento.

### 12.11.3 Leitura correta do problema

E importante ler esse episodio da forma certa:

- o `StrictMode` nao era o bug principal do backend;
- ele foi o gatilho que tornou a race condition facil de reproduzir;
- a fragilidade real era haver possibilidade de dois refresh tokens identicos;
- depois disso, o frontend tambem precisou ser tornado idempotente no callback.

Entao os dois lados tiveram papel na correcao:

- o backend passou a garantir unicidade do refresh token;
- o frontend passou a evitar refresh duplicado no callback.

## 12.12 Resultado final do fluxo OAuth 42

No estado atual do projeto, o fluxo completo termina assim:

- identidade externa validada pela 42;
- callback protegido por `state`;
- perfil externo convertido em `User` + `AuthAccount`;
- `Session` local criada no banco;
- cookies `httpOnly` emitidos pelo backend;
- frontend concluindo o callback com `refresh` + `getMe`;
- estado autenticado da aplicacao carregado sem expor token na URL.

Em outras palavras:

- a 42 continua sendo a porta de autenticacao externa;
- mas a sessao que governa a navegacao do projeto passa a ser totalmente nossa.

# 13. Two-Factor Authentication (2FA)

Antes de entrar no fluxo, vale separar cinco conceitos que aparecem o tempo todo nesta parte:

- **segredo TOTP**: chave-base compartilhada entre o backend e o aplicativo autenticador do usuario;
- **codigo TOTP**: numero temporario de 6 digitos gerado a partir desse segredo e do horario atual;
- **`otpauthUrl`**: formato padrao usado para provisionar o app autenticador com o segredo;
- **`twoFactorPendingSecretEnc` / `twoFactorSecretEnc`**: versoes cifradas desse segredo no banco, primeiro como setup pendente e depois como setup ativo;
- **`twoFactorToken`**: JWT temporario do nosso backend usado apenas no login em duas etapas, depois que a senha ja foi aprovada.

Esses conceitos pertencem a momentos diferentes:

- segredo TOTP, `otpauthUrl` e QR code pertencem ao **setup do 2FA**;
- `twoFactorPendingSecretEnc` e `twoFactorSecretEnc` pertencem ao **estado persistido da configuracao**;
- `twoFactorToken` pertence apenas ao **fluxo de login com 2FA ja habilitado**.

## 13.1 Setup

### 13.1.1 Geração do segredo

O setup de 2FA comeca quando o usuario autenticado pede para ativar autenticacao em duas etapas.

Nesse momento, o backend gera um segredo TOTP novo e exclusivo para aquela conta.

Esse segredo e a base matematica usada pelos aplicativos autenticadores para produzir codigos temporarios sincronizados com o servidor.

Ele precisa ser:

- aleatorio;
- imprevisivel;
- exclusivo do usuario;
- separado de senha, refresh token e token de reset.

Esse segredo nao representa uma sessao e nao substitui a senha. Ele representa a chave compartilhada entre:

- o backend;
- o aplicativo autenticador do usuario.

Conceitualmente, o setup de 2FA responde a esta pergunta:

```txt
qual segredo temporario o aplicativo autenticador e o backend vao compartilhar para gerar os mesmos codigos?
```

### 13.1.2 Geração de otpauthUrl

Depois de gerar o segredo, o backend monta uma `otpauthUrl`.

Essa URL segue o formato padrao usado por aplicativos autenticadores, como Google Authenticator, Authy e similares.

Ela carrega informacoes como:

- issuer da aplicacao;
- identificador visual da conta;
- segredo TOTP.

O papel dessa URL nao é autenticar o usuario diretamente. O papel dela é provisionar o autenticador do usuario com os dados necessarios para comecar a gerar codigos.

Em outras palavras:

- o segredo é a chave compartilhada;
- a `otpauthUrl` é o formato padronizado para transportar essa chave ate o aplicativo autenticador.

No nosso codigo, o `issuer` usado nessa URL vem de `TWO_FACTOR_ISSUER`. Se essa env nao estiver definida, o backend usa o fallback `Fazelo`.

Entao, nessa etapa, a env relevante e:

- `TWO_FACTOR_ISSUER`: nome exibido no aplicativo autenticador como emissor da credencial TOTP.

Sem essa URL, o frontend ainda poderia exibir o segredo manualmente. Mas com ela, o fluxo fica compativel com QR code e muito mais ergonomico para o usuario.

### 13.1.3 Geração de QR code

Com a `otpauthUrl` pronta, o backend gera um QR code.

Esse QR code é apenas uma representacao visual da `otpauthUrl`.

O objetivo dele e permitir que o usuario escaneie rapidamente a configuracao do 2FA no aplicativo autenticador, sem precisar digitar o segredo manualmente.

No desenho do projeto, o backend devolve esse QR code em formato data URL, para que o frontend possa exibi-lo diretamente na interface.

Entao a relacao conceitual e:

- segredo: conteudo sensivel base;
- `otpauthUrl`: forma padrao de provisionamento;
- QR code: forma visual de entregar essa URL ao usuario.

O QR code nao muda a seguranca do segredo por si so. Ele apenas muda a forma de entrega.

### 13.1.4 Persistência temporária do segredo

Quando o setup comeca, o segredo ainda nao deve ser tratado como 2FA ativo.

Ele precisa primeiro passar por uma etapa de confirmacao.

Por isso, o projeto separa dois estados:

- segredo pendente;
- segredo ativo.

O segredo gerado no setup fica guardado temporariamente em `twoFactorPendingSecretEnc`.

Esse campo merece uma leitura bem literal:

- `twoFactorPendingSecretEnc` guarda o segredo TOTP do usuario enquanto o setup ainda nao foi confirmado;
- o sufixo `Enc` indica que o segredo nao fica salvo em texto puro, e sim cifrado;
- essa cifragem depende de `AUTH_ENCRYPTION_KEY`.

Essa persistencia temporaria existe para permitir este fluxo:

1. o backend gera o segredo;
2. o usuario escaneia o QR code;
3. o usuario informa um codigo TOTP gerado pelo aplicativo;
4. so depois da verificacao o segredo passa a valer como configuracao ativa.

Essa separacao evita marcar 2FA como habilitado antes de haver prova real de que o usuario concluiu a configuracao corretamente.

Tambem por isso o segredo pendente e armazenado de forma protegida, e nao exposto depois como dado publico da conta.

Entao, nessa etapa, a env relevante e:

- `AUTH_ENCRYPTION_KEY`: chave usada pelo backend para cifrar e decifrar `twoFactorPendingSecretEnc` e depois `twoFactorSecretEnc`.

### 13.1.5 Papel do frontend no início do setup

No frontend, o setup do 2FA comeca na aba `Security` do perfil.

Quando o usuario clica em `Enable 2FA`, a interface chama:

```txt
POST /api/account/2fa/setup
```

Essa resposta devolve tres dados principais:

- `secret`
- `otpauthUrl`
- `qrCodeDataUrl`

Com isso, o frontend entra em um estado intermediario de configuracao:

- mostra o QR code gerado pelo backend;
- mostra o segredo manualmente, para apps que nao leem QR code;
- mostra tambem a `otpauthUrl` como fallback tecnico;
- exibe um campo para o usuario digitar o codigo TOTP de 6 digitos.

Esse comportamento e importante porque o frontend nao "gera 2FA" sozinho.

Ele apenas:

1. pede ao backend para iniciar o setup;
2. exibe os dados de provisionamento devolvidos;
3. espera a confirmacao pratica do usuario.

## 13.2 Verificação e ativação

### 13.2.1 Envio do código TOTP

Depois de escanear o QR code, o usuario precisa provar que o autenticador foi configurado corretamente.

Para isso, ele envia um codigo TOTP no endpoint de verificacao de 2FA.

Esse codigo TOTP nao e o segredo em si.

Esse codigo e o primeiro sinal concreto de que:

- o aplicativo autenticador recebeu o segredo certo;
- o backend e o autenticador conseguem produzir resultados compativeis.

Esse passo e essencial porque setup de 2FA nao termina quando o segredo e gerado. Ele termina quando existe confirmacao pratica de funcionamento.

### 13.2.2 Validação do código

Ao receber o codigo, o backend busca o segredo pendente daquele usuario, descriptografa esse valor internamente e verifica se o TOTP informado bate com o que seria esperado para aquele instante.

Em outras palavras, o usuario nunca envia o segredo salvo no banco. Ele envia apenas o codigo de 6 digitos, e o backend recupera internamente o segredo pendente para verificar se aquele codigo seria valido naquele instante.

Essa validacao nao compara o codigo com valor fixo salvo no banco. Ela recalcula o comportamento esperado a partir do segredo e do tempo atual.

O objetivo aqui e responder:

```txt
este codigo realmente poderia ter sido gerado por um autenticador configurado com este segredo?
```

Se a resposta for negativa, o setup nao pode ser confirmado.

Se a resposta for positiva, o backend passa a considerar que a chave compartilhada foi provisionada corretamente.

### 13.2.3 Confirmação do segredo

Quando o codigo TOTP e validado com sucesso, o segredo pendente deixa de ser apenas uma tentativa de configuracao e passa a ser um segredo confirmado.

Esse e o momento em que o backend promove o segredo de:

```txt
pendente -> confirmado
```

Na pratica, isso significa mover o valor antes guardado em `twoFactorPendingSecretEnc` para `twoFactorSecretEnc`.

Aqui, os nomes tentam refletir exatamente o momento do fluxo:

- `twoFactorPendingSecretEnc`: segredo TOTP ainda pendente de confirmacao;
- `twoFactorSecretEnc`: o mesmo tipo de segredo TOTP, mas agora ja confirmado e ativo para os proximos logins da conta.

Essa promocao e o que separa:

- configuracao iniciada;
- configuracao validada de verdade.

Sem essa etapa, o sistema nao teria como distinguir entre um setup abandonado e um setup realmente concluido.

### 13.2.4 Ativação do 2FA no usuário

Depois da confirmacao do segredo, o backend atualiza o estado da conta para refletir que o 2FA esta realmente ativo.

Isso envolve marcar:

- `twoFactorEnabled: true`
- `twoFactorConfirmedAt` com o instante da confirmacao
- limpeza de `twoFactorPendingSecretEnc`

Esse conjunto de mudancas transforma o 2FA em parte oficial da identidade de login daquela conta.

A partir desse ponto, senha correta sozinha deixa de ser suficiente para concluir autenticacao local completa.

Ou seja, ativar 2FA nao e apenas salvar um segredo. E mudar a regra de login da conta.

### 13.2.5 Papel do frontend na confirmação e no estado da conta

Depois que o QR code foi escaneado, o frontend continua o fluxo na mesma aba `Security`.

O usuario informa o codigo de 6 digitos e a interface chama:

```txt
POST /api/account/2fa/verify
```

mandando apenas:

- `code`

Se o backend aceitar esse codigo:

- o setup temporario e encerrado;
- o frontend limpa o estado local de configuracao pendente;
- o `user` em memoria e atualizado com `twoFactorEnabled: true`;
- a UI passa a mostrar que o 2FA esta ativo e troca o botao de ativacao pelo fluxo de desabilitacao.

No estado atual do frontend, a aba `Security` ainda faz um detalhe importante de sincronizacao:

- ela consulta `GET /api/users/me`;
- compara `twoFactorEnabled` retornado pelo backend com o `user` que estava salvo no cliente;
- e corrige a store local se houver divergencia.

Esse passo existe porque o frontend nao deve confiar cegamente em um objeto de usuario antigo, principalmente depois de login OAuth, refresh de sessao ou alteracoes recentes de seguranca.

Quando o 2FA ja esta habilitado, o frontend tambem permite desativacao.

Nesse caso, a mesma aba:

1. pede um codigo TOTP atual;
2. chama:

```txt
DELETE /api/account/2fa
```

3. e, no sucesso, atualiza o `user` local para `twoFactorEnabled: false`.

Entao, no frontend, a aba `Security` concentra os dois papéis:

- iniciar e confirmar o setup do 2FA;
- refletir e manter sincronizado o estado real da conta.

## 13.3 Login com 2FA habilitado

### 13.3.1 Validação inicial de email e senha

Quando uma conta com 2FA habilitado tenta fazer login, o fluxo nao comeca pelo codigo TOTP. Ele continua comecando por email e senha.

Isso e importante porque 2FA e uma segunda prova, nao a prova principal de identidade da conta local.

Entao o backend primeiro:

1. localiza a conta local pelo email;
2. verifica a senha;
3. decide se a conta exige segunda etapa.

Se email ou senha estiverem incorretos, o fluxo termina ali.

So existe segunda etapa quando a primeira etapa ja demonstrou que a credencial primaria da conta esta correta.

### 13.3.2 Emissão de twoFactorToken

Se a senha estiver correta e a conta tiver 2FA ativo, o backend nao entrega imediatamente `accessToken` e `refreshToken`.

Em vez disso, ele entrega um token temporario de segunda etapa: `twoFactorToken`.

Esse token existe para representar:

```txt
esta conta passou pela etapa de senha, mas ainda nao concluiu a prova de 2FA
```

Ele nao autoriza rotas privadas normais e nao substitui o access token final da aplicacao.

O papel dele e apenas carregar o contexto da segunda etapa ate o endpoint que valida o codigo TOTP.

Esse ponto e importante para nao misturar conceitos:

- `twoFactorToken` nao e segredo TOTP;
- `twoFactorToken` nao e o codigo de 6 digitos do autenticador;
- `twoFactorToken` e um JWT temporario do nosso backend, emitido so para ligar a etapa da senha a etapa do TOTP.

Por isso, esse token:

- usa secret proprio;
- tem expiracao curta;
- contem apenas claims minimas;
- possui finalidade especifica de 2FA.

No nosso codigo, as envs relevantes dessa etapa sao:

- `JWT_2FA_SECRET`: secret usado para assinar e validar o `twoFactorToken`;
- `JWT_2FA_EXPIRES_IN`: tempo de vida curto desse token temporario.

### 13.3.3 Papel do frontend no login local com 2FA

No login local, o frontend comeca pelo fluxo normal:

```txt
POST /api/auth/sign-in
```

enviando:

- `email`
- `password`

Se a conta nao tiver 2FA ativo, a resposta ja vem com:

- `accessToken`
- `refreshToken`
- `user`

e o login termina ali.

Se a conta tiver 2FA ativo, o backend nao devolve os tokens finais ainda. Ele devolve:

- `requiresTwoFactor: true`
- `twoFactorToken`

Quando isso acontece, o frontend nao trata como erro. Ele muda o proprio estado da tela de login:

- esconde os campos de email e senha;
- substitui a UI por um campo de codigo TOTP;
- guarda o `twoFactorToken` temporariamente;
- e espera o usuario digitar o codigo de 6 digitos do autenticador.

Depois disso, a mesma tela chama:

```txt
POST /api/auth/2fa/sign-in
```

enviando:

- `twoFactorToken`
- `code`

So depois dessa segunda resposta o frontend recebe:

- `accessToken`
- `refreshToken`
- `user`

Entao, no login local com 2FA, a tela de login passa a ser uma interface em duas etapas:

1. senha correta;
2. codigo TOTP correto.

### 13.3.4 Papel do frontend no login OAuth 42 com 2FA

No fluxo OAuth 42, a ideia e a mesma, mas a transicao acontece por redirecionamento.

Se a conta autenticada pela 42 tambem tiver `twoFactorEnabled: true`, o backend:

- nao cria a sessao final ainda;
- nao seta os cookies finais de auth;
- gera `twoFactorToken`;
- redireciona o navegador para:

```txt
/auth/callback?twoFactorToken=...
```

Ao chegar nesse callback, o frontend percebe que recebeu um `twoFactorToken` na query string.

Nessa situacao, ele nao tenta concluir o login com `refresh` ainda.

Em vez disso, ele redireciona para a tela de login comum com esse token temporario, algo como:

```txt
/login?twoFactorToken=...&redirect=...
```

A partir dai, o fluxo converge com o login local:

- a tela entra diretamente na segunda etapa;
- pede o codigo TOTP;
- chama `POST /api/auth/2fa/sign-in`;
- e so depois recebe os tokens finais da aplicacao.

Entao o papel do `OAuthCallback` aqui e apenas entregar o usuario para a segunda etapa correta.

Ele nao tenta "resolver o 2FA sozinho". Ele apenas encaminha o navegador para a mesma UI de confirmacao usada no login local.

### 13.3.5 Confirmação do 2FA

Na segunda etapa do login, o usuario envia:

- `twoFactorToken`
- codigo TOTP atual

O backend primeiro valida o `twoFactorToken` para confirmar que aquela tentativa de login realmente passou pela etapa de senha.

Depois, busca o segredo ativo de 2FA do usuario e valida o codigo TOTP informado.

Esse desenho garante que a segunda etapa nao seja uma rota solta de "testar codigo", mas sim a conclusao de um fluxo autenticado em duas fases:

1. senha correta;
2. codigo temporario correto.

Quando essas duas provas batem, o login pode ser concluido.

### 13.3.6 Emissão final de access e refresh token

So depois da confirmacao da segunda etapa o backend emite o par final de tokens da aplicacao:

- `accessToken`
- `refreshToken`

Esse detalhe e central no desenho do 2FA.

Se o backend entregasse o `accessToken` antes do codigo TOTP, o 2FA seria apenas decoracao. O usuario teria acesso ao sistema antes de concluir a segunda prova.

No projeto, a emissao final de tokens acontece apenas quando:

- a senha foi validada;
- o `twoFactorToken` foi aceito;
- o codigo TOTP foi validado contra o segredo ativo.

So entao o fluxo volta a convergir com o restante da autenticacao normal baseada em sessao.

### 13.3.7 Criação da sessão

Depois que os tokens finais sao emitidos, o backend cria a `Session` associada ao refresh token exatamente como acontece nos demais fluxos de login.

Esse ponto e importante porque o 2FA muda a entrada no fluxo, mas nao muda o modelo de sessao persistida adotado pela aplicacao.

Entao, depois da segunda etapa bem-sucedida:

- o usuario recebe o par final de tokens;
- o refresh token passa a ter uma `Session` persistida;
- renovacao de sessao, logout e revogacao continuam seguindo as mesmas regras gerais do projeto.

Isso mantem coerencia com o restante da arquitetura:

- 2FA adiciona uma prova extra antes da emissao final;
- depois da emissao final, a conta volta a usar a mesma infraestrutura comum de sessao e refresh.

# 14. Regras de revogação

## 14.1 Sessão revogada

No projeto, revogar uma sessao significa marcar explicitamente que ela nao pode mais ser usada para renovar autenticacao.

Essa ideia e importante porque refresh token nao e controlado apenas pela assinatura do JWT. Ele tambem depende do estado da `Session` no banco.

Quando uma sessao e revogada, o backend registra esse encerramento por meio de campos como:

- `status: REVOKED`
- `revokedAt`

Conceitualmente, revogacao responde a esta pergunta:

```txt
esta sessao ainda tem direito de continuar renovando autenticacao?
```

Se a resposta for nao, a sessao deixa de ser utilizavel mesmo que o refresh token ainda nao tenha chegado ao seu `exp`.

Esse ponto e central para entender por que o projeto consegue fazer logout real, reset de senha seguro e rotacao de refresh token com controle fino.

Expirar e revogar nao sao a mesma coisa:

- expiracao e limite natural de tempo;
- revogacao e decisao ativa de encerrar a continuidade da sessao.

## 14.2 Sessão substituída

Nem toda sessao revogada representa logout manual ou incidente de seguranca.

Em muitos casos, a sessao antiga e revogada porque foi substituida por uma nova durante a rotacao de refresh token.

No fluxo de renovacao, o backend:

1. aceita um refresh token valido;
2. gera novo access token;
3. gera novo refresh token;
4. cria nova `Session`;
5. revoga a anterior;
6. liga a sessao antiga a nova por `replacedBySessionId`.

Essa ideia de sessao substituida existe para manter continuidade controlada.

O refresh token antigo deixa de poder circular, e o novo passa a ser o unico representante valido daquela continuidade autenticada.

Essa relacao entre sessoes ajuda o projeto a:

- manter rotacao segura;
- evitar reutilizacao prolongada do mesmo refresh token;
- registrar explicitamente a cadeia de substituicao entre sessoes.

No estado atual do codigo, `replacedBySessionId` ajuda mais nessa rastreabilidade do que na decisao principal de bloqueio, porque o efeito funcional de encerrar a sessao antiga ja e coberto por `revokedAt`.
- detectar reapresentacao indevida de token antigo.

Entao, quando a sessao esta substituida, isso nao significa apenas "encerrou". Significa:

```txt
esta continuidade foi movida para uma nova sessao mais recente
```

## 14.3 Revogação em logout

No logout, a regra de revogacao e direta:

1. o cliente apresenta o refresh token da sessao que deseja encerrar;
2. o backend calcula o hash desse token;
3. localiza a `Session` correspondente;
4. marca essa sessao como revogada.

O objetivo do logout nao e apagar retroativamente todos os access tokens ja emitidos da existencia.

O objetivo e impedir que aquela sessao continue se renovando.

Isso e suficiente porque, no desenho do projeto:

- o access token e curto;
- a continuidade da autenticacao depende do refresh token;
- sem refresh token valido, a sessao perde capacidade de se manter viva.

Entao a revogacao em logout e o mecanismo que corta continuidade.

Ela tambem e tratada de forma idempotente:

- se a sessao ja estiver revogada, o resultado final continua correto;
- se o token nao mapear uma sessao ativa, o backend nao precisa revelar detalhes internos sobre existencia ou historico daquela sessao.

## 14.4 Revogação após mudança de senha

Mudanca de senha e uma operacao de alta sensibilidade, tanto no reset quanto na troca autenticada dentro da conta.

Quando a senha e alterada com sucesso, o projeto revoga as sessoes ativas do usuario.

Essa decisao existe porque uma mudanca de credencial normalmente acontece em contexto em que nao se quer manter continuidade silenciosa de sessoes antigas.

O raciocinio e:

- se alguem estava com acesso persistido antes da redefinicao;
- e se esse acesso dependia de refresh token ainda ativo;
- a troca de senha deve cortar essa continuidade.

Por isso, depois da mudanca bem-sucedida, as `Session` ativas ligadas ao usuario passam a estado revogado.

O efeito pratico e:

- refresh tokens antigos deixam de renovar;
- qualquer nova continuidade autenticada precisa nascer de novo login valido.

Esse passo conecta recuperacao de senha com seguranca de sessao. Sem ele, a conta poderia trocar a senha e ainda assim manter cadeias antigas de renovacao vivas.

### Papel do frontend na troca autenticada de senha

No frontend, a troca autenticada de senha acontece dentro da aba `Security` do painel de perfil.

O fluxo atual e:

1. o usuario informa `currentPassword`, `newPassword` e `confirmPassword`;
2. o frontend valida localmente:
   - senha atual obrigatoria;
   - nova senha com pelo menos 8 caracteres;
   - nova senha com ao menos uma letra e um numero;
   - nova senha diferente da senha atual;
   - confirmacao igual a nova senha;
3. se passar na validacao, o frontend envia:

```txt
PATCH /api/account/password
```

com:

- `currentPassword`
- `newPassword`

No projeto, isso foi organizado assim:

- `ProfilePanel.tsx`: renderiza o formulario da aba `Security`, faz a validacao e mostra mensagens de erro ou sucesso;
- `account.service.ts`: centraliza a chamada para `PATCH /api/account/password`.

Outro detalhe importante e o comportamento depois do sucesso.

Como o backend agora revoga as sessoes ativas quando a senha muda, o frontend nao tenta manter o usuario dentro da sessao antiga. Em vez disso:

1. mostra a mensagem `Password updated. Please sign in again.`
2. executa o logout local;
3. redireciona para `/login`.

Isso deixa frontend e backend alinhados: a troca de senha nao termina com a sessao anterior "meio viva" no cliente enquanto o servidor ja a revogou.

## 14.5 Papel de passwordChangedAt

`passwordChangedAt` funciona como marcador de seguranca de alteracao de credencial local.

Ele nao substitui a revogacao de sessao e nao autentica usuario por conta propria.

O papel dele e registrar:

```txt
esta conta teve sua senha local alterada neste instante
```

Esse marcador e importante porque ele da contexto de seguranca para outras regras do sistema.

Por exemplo:

- auditoria;
- rastreio de mudanca sensivel;
- apoio a politicas de corte de continuidade;
- leitura clara de quando a credencial primaria foi modificada.

No projeto, ele conversa com os dois fluxos de mudanca de senha:

- a senha muda;
- `passwordChangedAt` e atualizado;
- sessoes ativas sao revogadas.

Entao `passwordChangedAt` nao e uma revogacao em si. Ele e o registro cronologico de que uma alteracao sensivel ocorreu, e isso ajuda a sustentar as regras de seguranca em torno da conta.

# 15. Segurança complementar

## 15.1 Bcrypt

No projeto, a senha local nunca e guardada em texto puro.

Ela passa por `bcrypt`, que e um algoritmo de hash adaptado para credenciais humanas.

O objetivo aqui nao e apenas "esconder a senha", mas tornar muito caro tentar recuperar senhas reais a partir de vazamento de banco.

Esse desenho e importante porque senha e um segredo de longa duracao.

Se uma senha for exposta em texto puro, o dano e imediato.

Com `bcrypt`, o backend guarda apenas o hash da senha e, no login, compara a senha enviada com esse hash.

O fluxo conceitual fica assim:

1. o usuario escolhe uma senha;
2. o backend aplica `bcrypt`;
3. o banco guarda apenas o hash;
4. no login, o backend usa `bcrypt.compare(...)`.

O projeto trata isso como regra basica de seguranca para autenticacao local.

## 15.2 Hash do refresh token

O refresh token tambem nao fica persistido em texto puro no banco.

No projeto, o backend guarda apenas `Session.refreshTokenHash`.

Esse hash nao usa `bcrypt`, porque o objetivo aqui nao e proteger uma senha humana curta, e sim permitir localizacao deterministica do token apresentado pelo cliente.

Por isso o projeto usa HMAC-SHA256 com `AUTH_TOKEN_PEPPER`.

Esse desenho atende duas necessidades ao mesmo tempo:

- o banco nao guarda o refresh token utilizavel em texto puro;
- o backend consegue recalcular o mesmo hash e localizar a sessao correspondente.

Em outras palavras:

- senha precisa de hash lento voltado a credencial humana;
- refresh token precisa de hash deterministico para lookup seguro.

Essa diferenca de tratamento faz parte da arquitetura de seguranca do projeto.

Outro ponto importante e que hash de refresh token protege principalmente a persistencia no banco, nao o transporte em rede.

Por isso ele precisa ser lido junto com as outras camadas:

- HTTPS para proteger trafego;
- expiracao curta do access token;
- revogacao e rotacao de sessao;
- CORS e politica de credenciais;
- rate limiting em endpoints sensiveis.

## 15.3 Rate limiting

O projeto aplica rate limiting como camada de protecao contra abuso, brute force e flooding de endpoints sensiveis.

O papel do rate limiting nao e autenticar o usuario nem substituir validacao de senha, token ou 2FA.

O papel dele e limitar quantas tentativas uma mesma origem consegue fazer em janela curta de tempo.

Isso e especialmente importante em rotas como:

- `POST /api/auth/sign-in`
- `POST /api/auth/2fa/sign-in`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`

Essas rotas sao sensiveis por motivos diferentes:

- `sign-in`: alvo natural de tentativa repetida de senha;
- `2fa/sign-in`: alvo natural de tentativa repetida de codigo TOTP;
- `forgot-password`: alvo de spam ou abuso de envio;
- `reset-password`: alvo de repeticao agressiva de tentativa com token;
- `refresh`: alvo de flood para manter sessao viva ou explorar token roubado.

No desenho do projeto, existe uma camada global de limite razoavel para a API e limites mais restritos para endpoints criticos.

Essa combinacao e importante:

- o limite global reduz abuso generico;
- o limite fino reduz risco nos pontos de autenticacao.

Rate limiting nao elimina ataque por completo, mas aumenta atrito operacional e reduz superficie de abuso automatizado.

## 15.4 Helmet

`helmet` e o conjunto de headers de seguranca HTTP aplicados pelo backend para endurecer o comportamento padrao das respostas.

Ele nao muda a regra de negocio da autenticacao, mas reforca a superficie HTTP da aplicacao.

Na pratica, `helmet` ajuda a adicionar ou ajustar headers que reduzem riscos em torno de:

- MIME sniffing;
- clickjacking;
- exposicao desnecessaria de comportamento do servidor;
- politicas de carregamento e isolamento em browser.

O papel dele no projeto e complementar:

- tokens, sessoes e DTOs tratam a seguranca da autenticacao;
- `helmet` trata o endurecimento da camada HTTP.

Esse tipo de protecao nao costuma aparecer no fluxo funcional de login, mas faz parte do pacote de defesa da aplicacao.

## 15.5 CORS

CORS e a politica que define como o navegador trata chamadas entre frontend e backend quando eles estao em origens diferentes.

No projeto, isso e especialmente relevante porque a autenticacao pode envolver:

- `Authorization` header;
- cookies `httpOnly`;
- redirects;
- chamadas autenticadas entre frontend e backend localizados em portas diferentes.

Uma configuracao de CORS coerente precisa responder:

- qual origem do frontend pode consumir a API;
- se credenciais podem participar da chamada;
- se o navegador deve aceitar essa combinacao de origem e autenticacao.

Por isso, a configuracao de CORS nao e detalhe opcional. Ela participa diretamente da capacidade de o frontend usar sessao, refresh, logout e OAuth sem o browser bloquear o fluxo.

Quando credenciais estao em jogo, a combinacao entre origem permitida e `credentials` passa a ser parte funcional da autenticacao.

Em um sistema que usa autenticacao, a origem permitida nao deve ser tratada como coringa.

Se o backend aceita cookies ou outras credenciais, ele precisa conhecer explicitamente qual frontend esta autorizado a falar com a API.

Por isso, uma configuracao ausente, vazia ou ampla demais de origem nao e apenas um detalhe operacional.

Ela enfraquece a separacao entre:

- frontend conhecido;
- navegador autorizado a carregar credenciais;
- backend que confia nessa combinacao.

O comportamento coerente e falhar cedo quando a origem esperada nao estiver configurada corretamente, em vez de transformar esse erro de configuracao em permissao implicita.

### CORS e `SameSite`

CORS decide se o navegador pode fazer a chamada entre frontend e backend.

`SameSite`, por sua vez, participa da decisao sobre quando um cookie pode acompanhar essa chamada.

Essas duas camadas nao sao a mesma coisa, mas elas se encontram no fluxo autenticado.

Quando frontend e backend permanecem no mesmo site do ponto de vista do navegador, como pode acontecer com portas diferentes do mesmo host ou com subdominios do mesmo dominio registravel, `sameSite: 'lax'` pode continuar coerente.

Quando a topologia passa a ser realmente cross-site, `lax` deixa de ser suficiente para `fetch` e XHR autenticados, e o backend passa a precisar de `sameSite: 'none'`.

Esse ajuste traz uma consequencia acoplada:

- `sameSite: 'none'` exige `Secure: true`.

Esse ponto conversa diretamente com HTTPS:

- o navegador decide se aceita credenciais entre origens;
- CORS define a politica dessa troca;
- HTTPS protege o transporte dessa troca.

Entao, no projeto, CORS e HTTPS nao aparecem como temas isolados. Eles trabalham juntos para permitir que frontend e backend conversem com autenticacao sem o browser bloquear ou enfraquecer o fluxo.

## 15.6 HTTPS

Para uma explicacao isolada e mais detalhada apenas sobre a camada de HTTPS, certificado, confianca do navegador e diferenca entre ambiente controlado e ambiente publico, ver tambem:

- [https-explicacao.md](/home/mde-souz/42/githubmurilo/ft_transcendence/https-explicacao.md)

HTTPS protege o trafego entre cliente e backend contra leitura e alteracao em transito.

No contexto do projeto, isso importa porque o trafego de autenticacao pode carregar:

- senha;
- access token;
- refresh token;
- cookies de sessao;
- token de reset;
- callback OAuth.

Sem HTTPS, todo esse material fica muito mais vulneravel a interceptacao em rede.

Por isso, HTTPS nao e um detalhe cosmetico da infraestrutura. Ele protege diretamente as credenciais e o estado autenticado da aplicacao.

No desenho completo do sistema, a autenticacao segura depende tanto da regra de negocio correta quanto do transporte protegido.

Para o backend subir em HTTPS, ele precisa de dois elementos criptograficos:

- uma chave privada;
- um certificado.

A chave privada pertence ao servidor e deve permanecer secreta.

O certificado e o documento que apresenta ao cliente a identidade criptografica usada naquela conexao.

De forma simplificada, quando o navegador acessa um endpoint `https://...`, ele verifica:

1. se o servidor apresentou um certificado;
2. se esse certificado corresponde ao host acessado;
3. se a cadeia de confianca daquele certificado pode ser aceita;
4. se a conexao TLS pode ser estabelecida com seguranca.

Se tudo bater, a conexao segue normalmente.

Se algo falhar, o navegador exibe aviso de seguranca.

No projeto, o backend pode carregar esses materiais por configuracao, usando variaveis como:

- `HTTPS_ENABLED`
- `HTTPS_KEY_PATH`
- `HTTPS_CERT_PATH`

Essa configuracao permite ao bootstrap da aplicacao decidir se o servidor sera iniciado com TLS.

No estado atual do projeto, essa camada nao ficou restrita ao backend. O frontend local tambem passou a subir em HTTPS para manter coerencia com os cookies de autenticacao e com o callback do OAuth 42.

Isso significa que o desenho local completo ficou assim:

- backend em `https://localhost:3000`
- frontend em `https://localhost:5173`
- ambos lendo certificados locais de `localhost`

No frontend, essa parte aparece em tres lugares:

- `VITE_API_URL=https://localhost:3000`
- `FRONTEND_URL=https://localhost:5173`
- `vite.config.ts` configurado com `server.https`

No ambiente com Docker Compose, o frontend tambem recebe a pasta `certs` montada em modo somente leitura, para que o Vite consiga ler:

- `localhost-key.pem`
- `localhost-cert.pem`

Isso e relevante porque o HTTPS do frontend, neste caso, nao existe apenas para "mostrar cadeado no navegador". Ele participa diretamente do funcionamento da autenticacao.

Sem esse alinhamento, o navegador poderia:

- aceitar o callback OAuth no backend;
- receber cookies `Secure`;
- mas deixar de enviar esses cookies no `POST /api/auth/refresh` disparado pelo frontend logo depois do callback.

Foi exatamente por isso que o frontend local deixou de ser apenas `http://localhost:5173` e passou a acompanhar o backend em HTTPS.

### Cookies `Secure` dependem do HTTPS real

No projeto, cookies de autenticacao e cookies auxiliares, como o `state` do OAuth, nao devem decidir o atributo `Secure` apenas com base em rotulos de ambiente como desenvolvimento ou producao.

O ponto relevante e outro:

- existe HTTPS real nessa execucao;
- o navegador esta falando com a aplicacao por transporte seguro.

Esse detalhe importa porque e comum existir ambiente de demonstracao, avaliacao ou teste em que:

- o projeto continua em modo de desenvolvimento;
- mas o backend ja responde em `https://...`.

Nessa situacao, amarrar `Secure` apenas a `NODE_ENV=production` cria um resultado conceitualmente errado:

- o trafego e HTTPS;
- mas o cookie se comporta como se nao fosse.

Por isso, a regra mais coerente e derivar `Secure` da presenca efetiva de HTTPS no ambiente em que a aplicacao esta rodando.

No nosso fluxo atual, isso vale em duas frentes ao mesmo tempo:

- cookies emitidos pelo backend para `accessToken`, `refreshToken` e `oauth42_state`;
- comportamento do navegador quando o frontend em React tenta reutilizar esses cookies logo apos o callback OAuth.

Entao, quando o backend responde em HTTPS e seta cookies `Secure`, o frontend local tambem precisa conversar com esse ambiente de forma coerente.

Se o backend estiver em `https://localhost:3000`, mas o frontend continuar em `http://localhost:5173`, o resultado pode ser:

- callback aparentemente bem-sucedido na 42;
- cookies setados pelo backend;
- falha no `POST /api/auth/refresh`;
- `401 Unauthorized` logo depois do redirecionamento.

Por isso, no projeto, falar de `Secure` nao e apenas falar do backend em abstrato. E falar da consistencia do ambiente inteiro em que o navegador esta executando o fluxo autenticado.

### Desenvolvimento e producao usam a mesma ideia geral

No nivel conceitual, desenvolvimento e producao usam a mesma base:

- existe uma chave privada;
- existe um certificado;
- o servidor sobe em HTTPS;
- o cliente se conecta por TLS.

Por isso, a arquitetura geral pode parecer igual.

O que muda nao e a existencia do HTTPS.

O que muda e o contexto de confianca em torno do certificado usado.

No ambiente local do projeto, isso aparece de forma bem concreta:

- o backend usa `HTTPS_ENABLED`, `HTTPS_KEY_PATH` e `HTTPS_CERT_PATH`;
- o frontend usa o Vite com `server.https`;
- o Docker Compose monta os mesmos certificados para os dois lados.

Em producao, essa responsabilidade pode sair da aplicacao e ir para a plataforma ou proxy reverso. Em desenvolvimento, porem, fomos nos que montamos explicitamente essa camada para que OAuth, cookies `Secure`, refresh e redirects funcionassem de forma realista no navegador.

### Certificado autoassinado em ambiente controlado

Em ambiente controlado, como demonstracao local ou teste de desenvolvimento, um certificado autoassinado pode cumprir bem o papel tecnico de ativar HTTPS.

Nesse caso:

- a conexao continua criptografada;
- o backend continua respondendo em `https://...`;
- o navegador pode mostrar aviso de certificado nao confiavel.

Esse aviso acontece porque o navegador nao reconhece automaticamente a autoridade que assinou aquele certificado.

O ponto importante aqui e:

```txt
certificado autoassinado nao significa ausencia de criptografia
```

Ele significa:

```txt
existe criptografia, mas nao existe cadeia publica de confianca automaticamente reconhecida pelo navegador
```

Por isso, certificado autoassinado pode servir para validacao tecnica e demonstracao controlada do requisito de HTTPS.

### Certificado confiavel em ambiente publico

Quando o projeto e exposto em dominio publico para usuarios reais, o problema muda de nivel.

Agora nao basta apenas haver criptografia.

Tambem e preciso que o cliente confie automaticamente na identidade apresentada pelo servidor.

Por isso, em ambiente publico, o ideal e usar certificado emitido por uma autoridade confiavel publicamente, como uma CA reconhecida pelo navegador.

Hoje isso pode ser gratuito com servicos como Let's Encrypt.

O navegador confia nesses certificados sem pedir que o usuario aceite excecao manual.

Esse e o ponto que separa:

- HTTPS de demonstracao;
- HTTPS publico com confianca padrao de navegador.

### Por que nao usar exatamente a mesma coisa em desenvolvimento e producao

O mecanismo pode ser o mesmo.

Ou seja, o backend continua lendo chave privada e certificado para subir em HTTPS.

Mas os arquivos e o contexto operacional nao devem ser tratados como equivalentes.

Em desenvolvimento:

- o host costuma ser `localhost`;
- o ambiente e controlado pelo proprio time;
- o objetivo principal e teste e demonstracao.

Em producao:

- o dominio e publico;
- clientes reais acessam;
- nao faz sentido exigir que cada usuario ignore aviso de seguranca;
- a identidade do servidor precisa ser validada automaticamente.

Entao o que muda nao e a teoria do TLS.

O que muda e a necessidade de confianca publica automatica.

Por isso, certificado autoassinado pode resolver ambiente controlado, mas nao e a solucao adequada para ambiente publico real.

### Impacto de HTTPS no restante do projeto

Quando o backend responde em `https://...`, algumas URLs do sistema precisam permanecer coerentes com isso.

Especialmente:

- `API_URL`
- `VITE_API_URL`
- `FORTY_TWO_CALLBACK_URL`
- URLs de frontend usadas em fluxos de reset e callback, quando aplicavel

Isso importa porque OAuth, reset password e chamadas autenticadas dependem de URLs absolutas consistentes.

Se parte do sistema estiver configurada em `http://` e parte em `https://`, surgem inconsistencias de callback, browser policy e integracao.

Esse ponto fica ainda mais sensivel quando o fluxo usa cookies `httpOnly`, porque transporte seguro e politica de credenciais passam a caminhar juntos.

Tambem e importante distinguir duas perguntas diferentes:

1. o backend esta protegendo seu trafego com HTTPS?
2. o ambiente inteiro ja esta coerente do ponto de vista do navegador?

Elas se relacionam, mas nao sao a mesma coisa.

E possivel ter um backend servindo a API em `https://...` e, ao mesmo tempo, um frontend local ainda servido em `http://...`.

Nesse caso, a API continua usando transporte protegido, mas o ambiente como um todo fica mais fragil do ponto de vista de:

- experiencia de navegador;
- politica de cookies;
- consistencia de callbacks;
- previsibilidade de websocket seguro em ambiente publicado.

Por isso, em demonstracao controlada, esse arranjo misto pode existir.

Em ambiente publico ou em uma entrega mais fiel ao comportamento final, a tendencia natural e que frontend, backend e websocket caminhem juntos em HTTPS e WSS.

### Certificado local e callback OAuth

No fluxo OAuth, o navegador e redirecionado para a URL de callback do backend.

Se essa callback aponta para um backend com certificado autoassinado, o navegador precisa aceitar essa confianca local antes de o fluxo ficar estavel.

Do contrario, o callback pode falhar antes mesmo de a regra de negocio do OAuth ser executada corretamente.

Entao, em ambiente controlado com certificado local, existe uma dependencia operacional simples:

- o navegador precisa reconhecer ou aceitar o certificado do backend que recebera a callback.

### Caminho dos arquivos de certificado

Quando o backend carrega certificado e chave privada por caminho de arquivo, o ambiente que inicia o processo precisa realmente ter acesso a esses arquivos.

Isso parece obvio, mas afeta diretamente a forma de subir a aplicacao:

- em container, os arquivos costumam entrar por volume ou por imagem;
- fora de container, eles precisam existir no sistema de arquivos visivel para o processo Node.

Entao, em HTTPS, nao basta a variavel apontar para um caminho correto em abstrato.

O arquivo correspondente precisa existir naquele ambiente de execucao concreto.

## 15.7 Logs sensíveis

O projeto trata logs como ferramenta de observabilidade, nao como deposito de segredo.

Isso significa que valores sensiveis nao devem ser despejados em log de forma indiscriminada.

Entre os dados que merecem cuidado especial estao:

- senha;
- access token;
- refresh token;
- twoFactorToken;
- segredo TOTP;
- reset token puro.

Esse cuidado e importante porque log muitas vezes:

- dura mais do que a sessao original;
- circula por terminal, container, arquivo ou painel;
- pode ser visto por mais gente do que o proprio banco.

Por isso, o desenho correto e:

- logar contexto util de operacao;
- evitar logar credenciais utilizaveis;
- usar fallback controlado apenas quando o proprio fluxo exige, como no reset password em ambiente local sem SMTP.

Mesmo nesses casos, o token exposto em log deve ser tratado como excecao consciente de ambiente de desenvolvimento, nao como comportamento normal de producao.

# 16. Comportamentos do frontend

## 16.1 Envio do access token

## 16.2 Uso do refresh token

## 16.3 Interceptação de 401

## 16.4 Tentativa automática de refresh

## 16.5 Repetição da requisição original

## 16.6 Redirecionamento para login após falha

# 17. FAQ - Perguntas para revisar

## 17.1 Access token e refresh token sao armazenados do mesmo jeito no frontend?

Hoje, no fluxo local atual do frontend, os dois acabam ficando armazenados do mesmo jeito:

- `accessToken` em `localStorage`
- `refreshToken` em `localStorage`

Entao, na pratica, o seu raciocinio faz sentido:

- se algum JavaScript malicioso conseguir ler o `localStorage`
- ou se houver algum outro vazamento nesse ponto

existe chance alta de os dois vazarem juntos.

Isso enfraquece parte do ganho de seguranca que normalmente existe na separacao entre access token e refresh token.

Mesmo assim, a separacao ainda continua tendo utilidade, porque eles nao cumprem o mesmo papel:

- o `accessToken` expira rapido;
- o `refreshToken` expira mais tarde;
- o `refreshToken` depende de uma `Session` valida no banco;
- o `refreshToken` pode ser rotacionado;
- o `accessToken` circula muito mais nas requisicoes do dia a dia.

Entao, mesmo quando os dois estao no mesmo lugar, ainda existe diferenca de funcao e de comportamento.

O ponto e que o desenho fica bem mais forte quando o `refreshToken` nao fica exposto ao JavaScript do frontend.

Esse e justamente o motivo de o modelo com cookie `httpOnly` ser considerado mais forte:

- o frontend ainda pode usar o `accessToken` quando necessario;
- mas o `refreshToken` deixa de ficar tao facil de ler diretamente por script.

Ou seja:

- no estado atual do fluxo local, a separacao existe, mas fica parcialmente enfraquecida;
- no fluxo com cookie `httpOnly`, essa separacao fica bem mais convincente do ponto de vista de seguranca.

## 17.2 O access token e o refresh token sao enviados do mesmo jeito nas requisicoes?

Nao.

No nosso projeto, o `accessToken` e usado como credencial de acesso a recurso e, por isso, vai no:

- `Authorization` header

no formato:

```txt
Authorization: Bearer <accessToken>
```

Ja o `refreshToken` tem outro papel.

Ele nao e a credencial padrao das rotas privadas.

Ele e a credencial usada especificamente para:

- renovar sessao em `POST /api/auth/refresh`
- encerrar sessao em `POST /api/auth/logout`

Por isso, no nosso backend, o `refreshToken` pode chegar de dois jeitos:

- no body;
- em cookie.

Entao, no desenho atual do projeto:

- `accessToken` -> header
- `refreshToken` -> body ou cookie

Isso nao acontece porque exista uma regra tecnica obrigatoria que proiba refresh token em header.

Em teoria, ele poderia ir em header tambem.

O motivo de isso nao ser o desenho mais comum e semantico:

- o `accessToken` representa "estou autenticado para acessar este recurso agora";
- o `refreshToken` representa "quero renovar ou encerrar a minha sessao".

Por isso, o `Authorization` header ficou naturalmente associado ao `accessToken`, enquanto o `refreshToken` costuma aparecer como dado de entrada de endpoint especifico, normalmente no body ou em cookie `httpOnly`.

No nosso caso, existe ainda uma diferenca pratica entre os fluxos:

- no login local atual do frontend, o refresh ainda e tratado principalmente como token devolvido no corpo e salvo no navegador;
- no fluxo OAuth 42, o backend ja seta `accessToken` e `refreshToken` em cookies;
- alem disso, o backend ja esta preparado para ler o `refreshToken` por cookie em `refresh` e `logout`, e nao apenas no OAuth.

## 17.3 Onde a informacao de expiracao do refresh token existe de fato no nosso codigo?

No nosso projeto, a expiracao do `refreshToken` existe nas duas camadas ao mesmo tempo:

- dentro do proprio JWT de refresh;
- e na `Session.expiresAt` salva no banco.

Na pratica, o backend valida as duas coisas.

Quando o `refreshToken` chega em `POST /api/auth/refresh`, o fluxo passa por estas etapas:

1. o backend verifica o proprio JWT do refresh token;
2. depois busca a `Session` correspondente no banco;
3. por fim, confere se essa sessao ainda esta realmente aceitavel.

Isso significa que o refresh token so continua valendo se:

- o JWT ainda nao expirou;
- a sessao no banco ainda esta `ACTIVE`;
- a sessao nao foi revogada;
- a `Session.expiresAt` ainda nao passou;
- o `userId` da sessao bate com o `sub` do token.

Entao, no nosso codigo, a validade do refresh nao depende apenas de uma camada.

Ela depende ao mesmo tempo de:

- validade criptografica do token;
- e validade administrativa da sessao persistida.

Isso cria uma duplicacao intencional da informacao de expiracao.

Essa nuance e importante:

- uma coisa e ter `Session` persistida;
- outra coisa e duplicar o `expiresAt` tambem dentro da `Session`.

Se o projeto quisesse, ele poderia continuar tendo:

- `Session`;
- `refreshTokenHash`;
- `revokedAt`;
- `replacedBySession`;
- rotacao de refresh token;

mesmo sem guardar `Session.expiresAt`.

Nesse desenho alternativo, a expiracao temporal ficaria concentrada apenas no proprio JWT de refresh, enquanto a sessao no banco continuaria cuidando de:

- revogacao;
- logout;
- rotacao;
- rastreabilidade.

Entao, a existencia da `Session` nao depende necessariamente dessa duplicacao de expiracao.

O que o nosso modelo escolheu foi combinar:

- `refreshToken` como JWT assinada e expiravel;
- mais `Session` persistida, revogavel e tambem com `expiresAt`.

O motivo prático dessa duplicacao e separar duas perguntas:

1. o token ainda e valido em si?
2. o servidor ainda aceita esse token?

O JWT responde mais a primeira.

A sessao no banco responde mais a segunda.

Além disso, manter `expiresAt` tambem na sessao pode ser util para:

- consultas administrativas no banco;
- auditoria;
- limpeza de sessoes antigas;
- leitura desse estado sem depender do token bruto original.

### E o `accessToken`, tambem tem expiracao?

Sim.

O `accessToken` tambem e um JWT com expiração.

Mas, diferente do `refreshToken`, o `accessToken` nao tem um `expiresAt` proprio persistido no banco para ser consultado a cada request.

No caso dele, a expiracao e validada apenas pelo proprio JWT durante a verificacao feita pelo guard/strategy.

Entao a diferenca pratica fica assim:

- `accessToken`: expiracao so no JWT
- `refreshToken`: expiracao no JWT + controle de validade na `Session`

## 17.5 Existe alguma reacao especifica quando um refresh token e usado de forma suspeita?

Hoje, no nosso codigo, a principal resposta e:

- rejeitar a tentativa

Isso acontece quando o backend percebe que o refresh token nao deveria mais ser aceito, por exemplo porque:

- o JWT e invalido;
- a `Session` nao existe;
- a `Session` nao esta `ACTIVE`;
- a sessao ja foi revogada;
- a sessao ja expirou;
- ou o `userId` da sessao nao bate com o `sub` do token.

Entao, se um refresh token antigo for reapresentado depois de uma rotacao, ou se aparecer fora do fluxo esperado, ele deixa de renovar a sessao.

Essa parte funciona e e importante.

O que nao existe hoje e uma acao adicional especifica alem dessa rejeicao.

Ou seja, no estado atual do projeto, o backend nao faz automaticamente algo como:

- revogar todas as outras sessoes do usuario;
- bloquear a conta;
- abrir fluxo proprio de incidente;
- elevar o evento a uma categoria especial de seguranca.

Entao a resposta curta e:

- sim, o uso suspeito e barrado;
- nao, ainda nao existe uma reacao especial alem da rejeicao da tentativa.

## 17.6 O campo `lastLoginAt` e usado de forma pratica no projeto?

O campo `emailVerifiedAt` foi removido do modelo porque, no estado atual do projeto, ele nao era preenchido por fluxo real nem participava de nenhuma regra importante do sistema.

Ja o `lastLoginAt` continua existindo porque ele e realmente gravado quando o login e concluido com sucesso.

Esse campo, por outro lado, e realmente preenchido.

Ele e atualizado quando o login e concluido com sucesso em fluxos como:

- `signUp`
- `signIn`
- `signInWithTwoFactor`
- OAuth 42

Entao ele nao e apenas decorativo no momento da gravacao.

Mas, depois de salvo, ele tambem nao parece participar de nenhuma regra importante do sistema hoje.

No estado atual do projeto:

- ele nao aparece como criterio relevante de seguranca;
- nao dirige comportamento do backend;
- e nem esta sendo exposto como parte central da experiencia do frontend.

Entao a leitura mais fiel ao codigo atual e:

- `lastLoginAt`: e salvo corretamente, mas hoje seu papel e basicamente de auditoria.

## 17.7 O campo `accountType` em `User` ainda faz sentido?

No estado atual do projeto, `accountType` parece ter perdido quase todo o valor como fonte real de autenticacao.

Hoje ele:

- e salvo no backend;
- e exposto para o frontend;
- aparece na UI como `Account Type`;
- e tambem aparece no contrato documentado da API.

Mas ele nao representa bem nenhuma destas ideias de forma confiavel:

- como foi o primeiro cadastro;
- como foi o ultimo login;
- quais metodos de autenticacao a conta possui;
- qual e a verdadeira fonte de autenticacao daquela conta.

Quem modela isso de forma estrutural melhor e `AuthAccount`.

Por isso, conceitualmente, `accountType` hoje fica mais proximo de um rotulo legado do que de uma fonte de verdade.

### Qual e a opcao mais simples?

A opcao mais simples, se o time decidir limpar isso de vez, e:

- remover `accountType` do projeto inteiro;
- nao substituir por outro campo agora;
- e passar a tratar `AuthAccount` como unica fonte real da autenticacao no backend.

Essa e a opcao mais simples porque evita criar um novo campo derivado no meio da migracao.

O custo e que o frontend deixa de receber e mostrar o rotulo `Account Type`.

### Quais passos seriam necessarios para retirar `accountType` do projeto sem substituir por outro?

#### 1. Ajustar o schema e o banco

- remover `accountType` do model `User` em `schema.prisma`;
- gerar migration;
- aplicar migration;
- revisar seeds ou scripts que ainda tentem preencher esse campo.

#### 2. Ajustar o backend

No backend, seria preciso:

- parar de preencher `accountType` em `signUp`;
- parar de atualizar `accountType` nos fluxos de OAuth 42;
- remover `accountType` da serializacao de usuario em `AuthService`;
- remover `accountType` do `GET /users/me`;
- revisar qualquer outro `select`, `create` ou `update` que ainda inclua esse campo;
- garantir que qualquer decisao sobre autenticacao continue baseada apenas em `AuthAccount`.

Em outras palavras:

- `AuthAccount.provider` passa a ser a unica fonte estrutural para saber quais metodos de autenticacao a conta possui;
- `User` deixa de carregar esse resumo ambíguo.

#### 3. Ajustar o frontend

No frontend, seria preciso:

- remover `accountType` dos tipos de usuario;
- remover o uso desse campo na store e no fluxo de auth;
- remover a exibicao de `Account Type` no perfil;
- revisar qualquer componente que ainda espere esse campo na resposta do backend.

Como a proposta aqui e nao substituir por outro campo, a consequencia pratica e simples:

- o frontend deixa de mostrar essa informacao.

#### 4. Ajustar o contrato da API

No contrato documentado da API, seria preciso:

- remover `accountType` dos exemplos e schemas de resposta;
- atualizar os trechos em que esse campo aparece como parte do `user`;
- alinhar o contrato ao payload real devolvido pelo backend.

Aqui, "contrato" significa principalmente o arquivo:

- `docs/project_shared/backend/API.md`

Se isso nao for atualizado, a documentacao continuara prometendo um campo que o backend ja nao entrega mais.

#### 5. Ajustar testes

Depois da remocao, seria preciso revisar:

- testes unitarios de `AuthService`;
- testes e2e de auth;
- qualquer teste que hoje espere `accountType` no `user` serializado;
- mocks de frontend ou backend que ainda incluam esse campo.

#### 6. Ajustar documentacao explicativa

Tambem seria preciso revisar documentacao como:

- este proprio `autenticacao-explicacao.md`;
- `autenticacao-setup.md`, se houver exemplos de payload;
- qualquer nota que ainda descreva `accountType` como parte do modelo de autenticacao.

### Isso pode dar problema?

Sim, mas o problema principal nao e tecnico.

O principal risco e de integracao e contrato:

- backend parar de enviar o campo;
- frontend ainda esperar esse campo;
- documentacao continuar descrevendo esse campo como obrigatorio.

Entao a remocao e viavel, mas precisa ser feita de ponta a ponta:

- banco;
- backend;
- frontend;
- testes;
- contrato;
- documentacao.

Se essa limpeza for feita inteira, o modelo final tende a ficar mais coerente do que o atual.

## 17.8 Para que serve `replacedBySession` se a sessao ja tem `revokedAt`?

Os dois campos nao significam a mesma coisa.

- `revokedAt` responde: esta sessao foi encerrada?
- `replacedBySession` responde: por qual nova sessao ela foi substituida?

Mas a sua observacao e correta:

no estado atual do nosso codigo, o efeito funcional principal de bloquear a sessao antiga ja e coberto por `revokedAt`.

Ou seja:

- para aceitar ou rejeitar o refresh no fluxo atual, `revokedAt` ja basta;
- `replacedBySession` nao e hoje a peca central da validacao.

Entao, na pratica atual do projeto, `replacedBySession` funciona mais como:

- rastreabilidade;
- historico de rotacao;
- auditoria da cadeia de substituicao entre sessoes.

Ele deixa explicito que:

- a sessao antiga nao apenas morreu;
- ela foi trocada por outra sessao especifica.

Isso pode ser util para leitura administrativa, auditoria e evolucoes futuras de seguranca.

Mas, se a pergunta for estritamente sobre o comportamento atual de aceitar ou rejeitar o refresh token antigo, a resposta e:

- sim, hoje `revokedAt` ja cobre o efeito funcional principal;
- `replacedBySession` acrescenta mais contexto do que necessidade imediata de validacao.

## 17.9 Como uma sessao passa a ser tratada como expirada no nosso projeto?

Hoje, no nosso codigo, uma sessao nao recebe um status persistido de `EXPIRED`.

A expiracao existe de forma temporal: quando o backend recebe um refresh token, ele busca a `Session` correspondente e rejeita o fluxo se `session.expiresAt <= new Date()`.

Ou seja:

- a sessao nasce como `ACTIVE`;
- se for revogada por logout, rotacao ou reset de senha, passa para `REVOKED`;
- se apenas chegar ao prazo final, ela continua registrada no banco, mas deixa de ser aceita porque `expiresAt` ficou no passado.

Essa foi a decisao mais simples e mais coerente com o comportamento real do projeto: remover `EXPIRED` do enum e tratar expiracao apenas com base em `expiresAt`.

Isso evita um estado intermediario confuso em que a sessao ja estaria vencida na pratica, mas ainda apareceria como `ACTIVE` no banco so porque ninguem materializou o status `EXPIRED`.
