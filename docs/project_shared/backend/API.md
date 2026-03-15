# API Protocol & Data Contracts (Fazelo)

This document is the single source of truth for API communication between the React frontend and the NestJS backend. It covers REST endpoints, WebSocket events, authentication rules, pagination, and error contracts.

## Base Configuration

### Base URL

All REST endpoints are prefixed with `/api`:

| Environment | Base URL |
| | |
| Development | `http://localhost:3000/api` |
| Production | `https://fazelo.com/api` |

So a call to `GET /api/users/me` in development becomes `http://localhost:3000/api/users/me`.

### REST Authentication

Most endpoints are **protected** — the client must prove who it is by sending a JWT access token in every request header:

```code
Authorization: Bearer <accessToken>
```

The token is obtained after signing in (`POST /api/auth/sign-in`) or signing up (`POST /api/auth/sign-up`). It expires after a short period. When it expires, the client silently calls `POST /api/auth/refresh` with the refresh token to get a new pair without logging the user out.

Routes that do **not** require a token (public): `sign-up`, `sign-in`, `forgot-password`, `reset-password`, `GET /api/auth/42`.

### WebSocket Authentication

The WebSocket connection also requires authentication, but headers are not available during the Socket.io handshake. Instead, the token is passed as a query parameter when opening the connection:

```js
// Frontend connection example
import { io } from 'socket.io-client';

const socket = io('https://fazelo.com', {
  query: { token: accessToken }
});
```

The backend validates this token on connect and rejects the socket immediately if it is missing or invalid.

### Content Types

| Scenario | Content-Type |
| | |
| Regular JSON payloads (most endpoints) | `application/json` |
| File uploads (avatar, task attachments) | `multipart/form-data` |

Never send a file as a Base64 string inside JSON — use `multipart/form-data` for all uploads. The backend expects files in specific fields (e.g., `file` for avatar, `files` for task attachments) and will reject requests that do not conform.

### Timestamps

All dates and times are **ISO 8601 strings in UTC**. Example: `"2026-03-12T14:30:00Z"`.

The frontend is responsible for converting to the user's local timezone for display (e.g., using `date-fns` or `dayjs`).

### Identifiers

All `id` fields are **strings** (e.g., `"usr_123"`, `"tsk_1"`), not numbers. Always treat them as opaque strings — do not parse or do arithmetic on them.

## Response Conventions

### Success Responses

List endpoints may return either a raw array or a paginated envelope.

For paginated resources, the contract is:

```json
{
  "items": [],
  "pageInfo": {
    "limit": 20,
    "offset": 0,
    "total": 73,
    "hasMore": true
  }
}
```

### Error Responses

All non-2xx responses must follow this shape:

```json
{
  "type": "validation_error",
  "message": "The request payload is invalid.",
  "details": {
    "field": "email"
  }
}
```

### Common HTTP Status Codes

* **400 Bad Request** -> malformed payload, invalid filters, invalid state transitions.
* **401 Unauthorized** -> missing token, invalid token, expired token.
* **403 Forbidden** -> authenticated but not allowed to access the resource.
* **404 Not Found** -> resource does not exist or is not visible to the user.
* **409 Conflict** -> duplicate username, duplicate invite, invalid concurrent state.
* **413 Payload Too Large** -> upload exceeded file size limit.
* **415 Unsupported Media Type** -> upload type is not allowed.
* **422 Unprocessable Entity** -> structurally valid request with business-rule failure.
* **429 Too Many Requests** -> rate-limited routes such as sign-in and forgot password.
* **500 Internal Server Error** -> unexpected backend failure.

### Common Error Types

* `validation_error`
* `unauthorized`
* `token_expired`
* `forbidden`
* `not_found`
* `username_taken`
* `email_taken`
* `invalid_credentials`
* `invalid_oauth_code`
* `workspace_member_exists`
* `friend_request_exists`
* `invalid_state_transition`
* `payload_too_large`
* `unsupported_file_type`
* `rate_limited`
* `internal_error`

## 1. Authentication & Account

### 1.1 Sign Up

* **POST** `/api/auth/sign-up`
* **Request Payload:**

```json
{
  "email": "ana.laura@42.fr",
  "password": "StrongPassword123!",
  "fullName": "Ana Laura",
  "username": "ana_laura"
}
```

* **Response (201 Created):**

```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "usr_123",
    "email": "ana.laura@42.fr",
    "fullName": "Ana Laura",
    "username": "ana_laura",
    "bio": "",
    "avatarUrl": null,
    "accountType": "standard"
  }
}
```

* **Errors:** `400 validation_error`, `409 email_taken`, `409 username_taken`, `429 rate_limited`.

### 1.2 Sign In

* **POST** `/api/auth/sign-in`
* **Request Payload:**

```json
{
  "email": "ana.laura@42.fr",
  "password": "StrongPassword123!"
}
```

* **Response (200 OK):** same shape as sign-up.
* **Errors:** `400 validation_error`, `401 invalid_credentials`, `429 rate_limited`.

### 1.3 Refresh Session

* **POST** `/api/auth/refresh`
* **Request Payload:**

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

* **Response (200 OK):**

```json
{
  "accessToken": "new-jwt-access-token",
  "refreshToken": "new-jwt-refresh-token"
}
```

* **Errors:** `401 unauthorized`, `401 token_expired`.

### 1.4 Logout

* **POST** `/api/auth/logout`
* **Request Payload:**

```json
{
  "refreshToken": "jwt-refresh-token"
}
```

* **Response (204 No Content)**

### 1.5 Forgot Password

* **POST** `/api/auth/forgot-password`
* **Request Payload:**

```json
{
  "email": "ana.laura@42.fr"
}
```

* **Response (202 Accepted)**
* **Errors:** `400 validation_error`, `429 rate_limited`.

### 1.6 Reset Password

* **POST** `/api/auth/reset-password`
* **Request Payload:**

```json
{
  "token": "reset-token",
  "newPassword": "NewStrongPassword123!"
}
```

* **Response (204 No Content)**
* **Errors:** `400 validation_error`, `401 token_expired`, `404 not_found`.

### 1.7 OAuth 42 Redirect

* **GET** `/api/auth/42`
* **Response (302 Found):** redirects the browser to the 42 OAuth consent page.

### 1.8 OAuth 42 Callback

* **GET** `/api/auth/42/callback?code=oauth_code`
* **Response (200 OK):** same shape as sign-up, with `accountType: "oauth_42"` when applicable.
* **Errors:** `400 invalid_oauth_code`, `401 unauthorized`.

### 1.9 Get Current User

* **GET** `/api/users/me`
* **Response (200 OK):**

```json
{
  "id": "usr_123",
  "email": "ana.laura@42.fr",
  "fullName": "Ana Laura",
  "username": "ana_laura",
  "bio": "Frontend lead @ ft_transcendence.",
  "avatarUrl": "https://...",
  "createdAt": "2024-01-15T10:30:00Z",
  "accountType": "standard",
  "preferences": {
    "theme": "dark",
    "notifications": {
      "mentions": true,
      "workspaceInvites": true,
      "directMessages": true
    }
  }
}
```

### 1.10 Update Profile

* **PATCH** `/api/users/me`
* **Request Payload:**

```json
{
  "fullName": "Ana Laura",
  "username": "ana_laura",
  "bio": "New bio content"
}
```

* **Response (200 OK):** updated user object.
* **Errors:** `400 validation_error`, `409 username_taken`.

### 1.11 Upload Avatar

* **POST** `/api/users/avatar`
* **Request:** `multipart/form-data` with field `file`.
* **Constraints:** Max 5MB. Types: JPG, PNG, GIF.
* **Response (200 OK):**

```json
{
  "avatarUrl": "https://cdn.example.com/avatars/usr_123.png"
}
```

* **Errors:** `413 payload_too_large`, `415 unsupported_file_type`.

### 1.12 Update Preferences

* **PATCH** `/api/users/me/preferences`
* **Request Payload:**

```json
{
  "theme": "dark",
  "notifications": {
    "mentions": true,
    "workspaceInvites": false,
    "directMessages": true
  }
}
```

* **Response (200 OK):** updated preferences object.

### 1.13 Change Password

* **PATCH** `/api/account/password`
* **Request Payload:**

```json
{
  "currentPassword": "OldStrongPassword123!",
  "newPassword": "NewStrongPassword123!"
}
```

* **Response (204 No Content)**
* **Errors:** `400 validation_error`, `401 invalid_credentials`.

### 1.14 Two-Factor Authentication Setup

* **POST** `/api/account/2fa/setup`
* **Response (200 OK):**

```json
{
  "secret": "BASE32SECRET",
  "otpauthUrl": "otpauth://totp/Fazelo:ana.laura@42.fr?...",
  "qrCodeDataUrl": "data:image/png;base64,..."
}
```

### 1.15 Two-Factor Authentication Verify

* **POST** `/api/account/2fa/verify`
* **Request Payload:**

```json
{
  "code": "123456"
}
```

* **Response (204 No Content)**
* **Errors:** `400 validation_error`, `401 unauthorized`.

### 1.16 Disable Two-Factor Authentication

* **DELETE** `/api/account/2fa`
* **Request Payload:**

```json
{
  "code": "123456"
}
```

* **Response (204 No Content)**

## 2. Users, Friends & Presence

### 2.1 Search Users

* **GET** `/api/users?search=ana&limit=10`
* **Response (200 OK):** paginated list of lightweight user cards.

### 2.2 Get User Public Profile

* **GET** `/api/users/:userId`
* **Response (200 OK):**

```json
{
  "id": "usr_456",
  "fullName": "Lucas Silva",
  "username": "lucas_dev",
  "bio": "Frontend engineer.",
  "avatarUrl": "https://...",
  "status": "online"
}
```

### 2.3 List Friends

* **GET** `/api/friends`
* **Response (200 OK):**

```json
[
  {
    "id": "usr_456",
    "username": "lucas_dev",
    "fullName": "Lucas Silva",
    "avatarUrl": "https://...",
    "status": "online"
  }
]
```

### 2.4 List Friend Requests

* **GET** `/api/friend-requests`
* **Response (200 OK):** array with pending incoming and outgoing requests.

### 2.5 Send Friend Request

* **POST** `/api/friend-requests`
* **Request Payload:**

```json
{
  "targetUserId": "usr_456"
}
```

* **Response (201 Created)**
* **Errors:** `404 not_found`, `409 friend_request_exists`, `422 invalid_state_transition`.

### 2.6 Accept Friend Request

* **PATCH** `/api/friend-requests/:requestId`
* **Request Payload:**

```json
{
  "action": "accept"
}
```

* **Response (200 OK):** friendship object.

### 2.7 Reject Friend Request

* **PATCH** `/api/friend-requests/:requestId`
* **Request Payload:**

```json
{
  "action": "reject"
}
```

* **Response (200 OK):** request status object.

### 2.8 Remove Friend

* **DELETE** `/api/friends/:friendId`
* **Response (204 No Content)**

## 3. Workspaces & Memberships

### 3.1 List Workspaces

* **GET** `/api/workspaces?search=platform&limit=20&offset=0`
* **Response (200 OK):** paginated list of workspace summary objects.

### 3.2 Create Workspace

* **POST** `/api/workspaces`
* **Request Payload:**

```json
{
  "name": "Fazelo Core",
  "description": "Main product workspace.",
  "subjects": [
    {
      "name": "Backend",
      "color": "#4A90D9"
    }
  ],
  "fields": [
    {
      "name": "To Do",
      "color": "#7A8A99"
    },
    {
      "name": "In Progress",
      "color": "#FFA500"
    },
    {
      "name": "Done",
      "color": "#2E8B57"
    }
  ]
}
```

* **Response (201 Created):** workspace details object.
* **Errors:** `400 validation_error`, `409 conflict`.

### 3.3 Get Workspace Details

* **GET** `/api/workspaces/:wsId`
* **Response (200 OK):** workspace object with metadata, subjects, fields, and member summary.
* **Errors:** `403 forbidden`, `404 not_found`.

### 3.4 Update Workspace

* **PATCH** `/api/workspaces/:wsId`
* **Request Payload:**

```json
{
  "name": "Fazelo Platform",
  "description": "Updated description"
}
```

* **Response (200 OK):** updated workspace object.
* **Errors:** `403 forbidden`, `404 not_found`.

### 3.5 Delete Workspace

* **DELETE** `/api/workspaces/:wsId`
* **Response (204 No Content)**
* **Errors:** `403 forbidden`, `404 not_found`.

### 3.6 List Workspace Members

* **GET** `/api/workspaces/:wsId/members`
* **Response (200 OK):**

```json
[
  {
    "userId": "usr_123",
    "username": "ana_laura",
    "fullName": "Ana Laura",
    "role": "admin",
    "status": "online"
  }
]
```

### 3.7 Invite Member by Email

* **POST** `/api/workspaces/:wsId/invitations`
* **Request Payload:**

```json
{
  "email": "murilo@42.fr",
  "role": "member"
}
```

* **Response (201 Created):** invitation object.
* **Errors:** `404 not_found`, `409 workspace_member_exists`, `409 conflict`.
* **Related Real-time Event(s):** `workspace_invitation_received` (to `user:{userId}`).

### 3.8 List My Workspace Invitations

* **GET** `/api/workspace-invitations`
* **Response (200 OK):** array of pending invitations.

### 3.9 Respond to Workspace Invitation

* **PATCH** `/api/workspace-invitations/:invitationId`
* **Request Payload:**

```json
{
  "action": "accept"
}
```

* **Response (200 OK):** updated invitation object.

### 3.10 Update Member Role

* **PATCH** `/api/workspaces/:wsId/members/:memberId`
* **Request Payload:**

```json
{
  "role": "admin"
}
```

* **Response (200 OK):** updated member object.
* **Errors:** `403 forbidden`, `404 not_found`, `422 invalid_state_transition`.
* **Related Real-time Event(s):** `member_role_updated` (to `workspace:{wsId}`).

### 3.11 Remove Member

* **DELETE** `/api/workspaces/:wsId/members/:memberId`
* **Response (204 No Content)**
* **Errors:** `403 forbidden`, `404 not_found`.
* **Related Real-time Event(s):** `member_removed` (to `workspace:{wsId}`).

## 4. Workspace Configuration

### 4.1 List Subjects

* **GET** `/api/workspaces/:wsId/subjects`
* **Response (200 OK):** array of subject objects.

### 4.2 Create Subject

* **POST** `/api/workspaces/:wsId/subjects`
* **Request Payload:**

```json
{
  "name": "Backend",
  "color": "#4A90D9"
}
```

* **Response (201 Created):** created subject object.
* **Related Real-time Event(s):** `subject_created` (to `workspace:{wsId}`).

### 4.3 Update Subject

* **PATCH** `/api/subjects/:subjectId`
* **Request Payload:**

```json
{
  "name": "Infrastructure",
  "color": "#2D6CDF"
}
```

* **Response (200 OK):** updated subject object.
* **Related Real-time Event(s):** `subject_updated` (to `workspace:{wsId}`).

### 4.4 Delete Subject

* **DELETE** `/api/subjects/:subjectId`
* **Response (204 No Content)**
* **Related Real-time Event(s):** `subject_deleted` (to `workspace:{wsId}`).

### 4.5 List Fields

* **GET** `/api/workspaces/:wsId/fields`
* **Response (200 OK):** array of field objects.

### 4.6 Create Field

* **POST** `/api/workspaces/:wsId/fields`
* **Request Payload:**

```json
{
  "name": "In Review",
  "color": "#FFA500"
}
```

* **Response (201 Created):** created field object.
* **Related Real-time Event(s):** `field_created` (to `workspace:{wsId}`).

### 4.7 Update Field

* **PATCH** `/api/fields/:fieldId`
* **Request Payload:**

```json
{
  "name": "Blocked",
  "color": "#D9534F"
}
```

* **Response (200 OK):** updated field object.
* **Related Real-time Event(s):** `field_updated` (to `workspace:{wsId}`).

### 4.8 Delete Field

* **DELETE** `/api/fields/:fieldId`
* **Response (204 No Content)**
* **Related Real-time Event(s):** `field_deleted` (to `workspace:{wsId}`).

## 5. Tasks, Comments & Attachments

### 5.1 List and Filter Tasks

* **GET** `/api/workspaces/:wsId/tasks`
* **Query Parameters (Optional):** `search`, `priority`, `subject`, `assignee`, `status`, `dueFrom`, `dueTo`, `sortBy`, `sortOrder`, `limit`, `offset`.
* **Example:** `/api/workspaces/ws_1/tasks?search=nest&priority=high&status=in_progress&sortBy=dueDate&sortOrder=asc&limit=20&offset=0`
* **Response (200 OK):** paginated list of task objects.

### 5.2 Create Task

* **POST** `/api/workspaces/:wsId/tasks`
* **Request Payload:**

```json
{
  "title": "Setup NestJS project",
  "description": "Initialize NestJS with TypeScript config.",
  "subjectId": "sub_1",
  "priority": "high",
  "status": "todo",
  "dueDate": "2025-03-10",
  "assigneeId": "usr_789"
}
```

*(Note: `priority` must be `low`, `medium`, or `high`. `status` is the field name slug, e.g. `todo`, `in_progress`, `done`.)*

* **Response (201 Created):** full task object.
* **Errors:** `400 validation_error`, `403 forbidden`, `404 not_found`.
* **Related Real-time Event(s):** `task_created` (to `workspace:{wsId}`).

### 5.3 Get Task Details

* **GET** `/api/tasks/:taskId`
* **Response (200 OK):** full task object with attachments and comments summary.

### 5.4 Update Task

* **PATCH** `/api/tasks/:taskId`
* **Request Payload:**

```json
{
  "title": "Setup NestJS backend",
  "description": "Initialize NestJS with TypeScript and Prisma.",
  "priority": "medium",
  "status": "in_progress",
  "subjectId": "sub_1",
  "assigneeId": "usr_789",
  "dueDate": "2025-03-15"
}
```

* **Response (200 OK):** updated task object.
* **Errors:** `400 validation_error`, `403 forbidden`, `404 not_found`, `422 invalid_state_transition`.
* **Related Real-time Event(s):** `task_updated` and, when `status` changes, `task_moved` (to `workspace:{wsId}`).

### 5.5 Delete Task

* **DELETE** `/api/tasks/:taskId`
* **Response (204 No Content)**
* **Related Real-time Event(s):** `task_deleted` (to `workspace:{wsId}`).

### 5.6 List Comments

* **GET** `/api/tasks/:taskId/comments`
* **Response (200 OK):** array of comment objects.

### 5.7 Add Comment

* **POST** `/api/tasks/:taskId/comments`
* **Request Payload:**

```json
{
  "text": "Working on refresh token logic."
}
```

* **Response (201 Created):**

```json
{
  "id": "c2",
  "author": {
    "id": "usr_123",
    "username": "daniela_be"
  },
  "text": "Working on refresh token logic.",
  "createdAt": "2026-03-12T14:30:00Z"
}
```

* **Related Real-time Event(s):** `comment_added` (to `workspace:{wsId}`).

### 5.8 Update Comment

* **PATCH** `/api/comments/:commentId`
* **Request Payload:**

```json
{
  "text": "Updated comment text"
}
```

* **Response (200 OK):** updated comment object.
* **Related Real-time Event(s):** `comment_updated` (to `workspace:{wsId}`).

### 5.9 Delete Comment

* **DELETE** `/api/comments/:commentId`
* **Response (204 No Content)**
* **Related Real-time Event(s):** `comment_deleted` (to `workspace:{wsId}`).

### 5.10 List Attachments

* **GET** `/api/tasks/:taskId/attachments`
* **Response (200 OK):** array of attachment metadata objects.

### 5.11 Upload Task Attachment

* **POST** `/api/tasks/:taskId/attachments`
* **Request:** `multipart/form-data` with field `files`.
* **Constraints:** Max 10MB per file. Types: PDF, PNG, JPG, JPEG, GIF.
* **Response (201 Created):** array of uploaded attachment metadata.
* **Errors:** `413 payload_too_large`, `415 unsupported_file_type`.
* **Related Real-time Event(s):** `attachment_uploaded` (to `workspace:{wsId}`).

### 5.12 Download or Preview Attachment

* **GET** `/api/attachments/:attachmentId`
* **Response (200 OK):** file stream or signed download URL depending on storage strategy.

### 5.13 Delete Attachment

* **DELETE** `/api/attachments/:attachmentId`
* **Response (204 No Content)**
* **Related Real-time Event(s):** `attachment_deleted` (to `workspace:{wsId}`).

## 6. Chat & Notifications

### 6.1 List Conversations

* **GET** `/api/conversations?limit=20&offset=0`
* **Response (200 OK):** paginated list of recent 1:1 conversations.

### 6.2 Get Chat History

* **GET** `/api/messages/:friendId?limit=50&offset=0`
* **Response (200 OK):**

```json
[
  {
    "id": "m1",
    "senderId": "usr_456",
    "text": "Hey! Did you see the new designs?",
    "createdAt": "2026-03-12T10:32:00Z",
    "readAt": null
  }
]
```

### 6.3 Send Message via REST Fallback

* **POST** `/api/messages`
* **Request Payload:**

```json
{
  "toUserId": "usr_456",
  "text": "Can you review the API contract?"
}
```

* **Response (201 Created):** created message object.
* **Related Real-time Event(s):** `receive_message` (to `user:{userId}`), plus `typing_start`/`typing_stop` while composing.

### 6.4 List Notifications

* **GET** `/api/notifications?type=mention&read=false&limit=20&offset=0`
* **Response (200 OK):** paginated list of notifications.

### 6.5 Get Unread Notification Count

* **GET** `/api/notifications/unread-count`
* **Response (200 OK):**

```json
{
  "count": 4
}
```

### 6.6 Mark Notification as Read

* **PATCH** `/api/notifications/:notificationId`
* **Request Payload:**

```json
{
  "read": true
}
```

* **Response (200 OK):** updated notification object.
* **Related Real-time Event(s):** `notification_updated` (to `user:{userId}`).

### 6.7 Read All Notifications

* **PATCH** `/api/notifications/read-all`
* **Response (200 OK):**

```json
{
  "updated": true
}
```

* **Related Real-time Event(s):** `notification_updated` (batch update to `user:{userId}`).

### 6.8 Delete Notification

* **DELETE** `/api/notifications/:notificationId`
* **Response (204 No Content)**

## 7. WebSocket Protocol (Socket.io)

### 7.1 Handshake and Authorization

* Clients must authenticate with a valid JWT during the Socket.io handshake.
* Unauthorized socket connections must be rejected with error type `unauthorized`.
* After successful connection, the backend automatically joins the socket to `user:{userId}`.

### 7.2 Rooms

Clients may join or leave workspace rooms as they navigate:

* `user:{userId}` -> direct messages, personal notifications, invites, presence updates.
* `workspace:{wsId}` -> Kanban sync, workspace membership changes, task updates.

### 7.3 Listened Events (Frontend -> Backend)

* `join_workspace` -> Payload: `{ wsId }`
* `leave_workspace` -> Payload: `{ wsId }`
* `send_message` -> Payload: `{ toUserId, text }`
* `typing_start` -> Payload: `{ toUserId }`
* `typing_stop` -> Payload: `{ toUserId }`
* `mark_notification_read` -> Payload: `{ notificationId }`

### 7.4 Emitted Events (Backend -> Frontend)

**To `workspace:{wsId}`:**

* `task_created` -> Payload: full Task object.
* `task_updated` -> Payload: full Task object.
* `task_deleted` -> Payload: `{ taskId }`
* `task_moved` -> Payload: `{ taskId, oldStatus, newStatus, movedBy }`
* `comment_added` -> Payload: `{ taskId, comment }`
* `comment_updated` -> Payload: `{ taskId, comment }`
* `comment_deleted` -> Payload: `{ taskId, commentId }`
* `attachment_uploaded` -> Payload: `{ taskId, attachments }`
* `attachment_deleted` -> Payload: `{ taskId, attachmentId }`
* `subject_created` -> Payload: subject object.
* `subject_updated` -> Payload: subject object.
* `subject_deleted` -> Payload: `{ subjectId }`
* `field_created` -> Payload: field object.
* `field_updated` -> Payload: field object.
* `field_deleted` -> Payload: `{ fieldId }`
* `member_added` -> Payload: member object.
* `member_role_updated` -> Payload: member object.
* `member_removed` -> Payload: `{ memberId }`

**To `user:{userId}`:**

* `receive_message` -> Payload: message object.
* `typing_start` -> Payload: `{ userId }`
* `typing_stop` -> Payload: `{ userId }`
* `notification_received` -> Payload: notification object.
* `notification_updated` -> Payload: notification object.
* `friend_request_received` -> Payload: friend request object.
* `friend_request_updated` -> Payload: friend request object.
* `friend_removed` -> Payload: `{ userId }`
* `friend_presence_changed` -> Payload: `{ userId, status }`
* `workspace_invitation_received` -> Payload: invitation object.

### 7.5 Connection Lifecycle

* Clients should attempt automatic reconnection on transport failure.
* After reconnecting, the client must rejoin active workspace rooms.
* Presence updates are eventually consistent and should not be treated as transactional.

## 8. Core Domain Objects

### Task Object

```json
{
  "id": "tsk_1",
  "workspaceId": "ws_1",
  "title": "Setup NestJS project",
  "description": "Initialize NestJS with TypeScript config.",
  "priority": "high",
  "status": "in_progress",
  "subject": {
    "id": "sub_1",
    "name": "Backend",
    "color": "#4A90D9"
  },
  "assignee": {
    "id": "usr_789",
    "username": "murilo_db",
    "fullName": "Murilo",
    "avatarUrl": "https://..."
  },
  "dueDate": "2025-03-10",
  "attachmentCount": 2,
  "commentsCount": 5,
  "createdAt": "2026-03-12T14:30:00Z",
  "updatedAt": "2026-03-12T16:00:00Z"
}
```

### Notification Object

```json
{
  "id": "ntf_1",
  "type": "mention",
  "title": "You were mentioned in a task",
  "message": "Ana Laura mentioned you in Setup NestJS project.",
  "read": false,
  "resource": {
    "kind": "task",
    "id": "tsk_1",
    "workspaceId": "ws_1"
  },
  "createdAt": "2026-03-12T16:00:00Z"
}
```

### Conversation Preview Object

```json
{
  "user": {
    "id": "usr_456",
    "username": "lucas_dev",
    "fullName": "Lucas Silva",
    "avatarUrl": "https://...",
    "status": "online"
  },
  "lastMessage": {
    "id": "msg_9",
    "text": "I pushed the new board filters.",
    "createdAt": "2026-03-12T18:05:00Z"
  },
  "unreadCount": 2
}
```
