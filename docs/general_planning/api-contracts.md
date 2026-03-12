# Feature Checklist

All functionalities covered by the project, organized by module. Cross-reference with the full contract in `docs/project_shared/backend/API.md`.

Legend: **API** = endpoint defined in API.md | **WS** = WebSocket event defined in API.md

---

## 1. Authentication & Account (Module: Standard User Mgmt + Remote Auth)

- [ ] Sign Up with email, password, fullName, username — **API 1.1**
- [ ] Sign In with email and password, returns JWT — **API 1.2**
- [ ] Refresh access token using refresh token — **API 1.3**
- [ ] Logout and invalidate refresh token — **API 1.4**
- [ ] Forgot Password — send reset email — **API 1.5**
- [ ] Reset Password via token — **API 1.6**
- [ ] OAuth 42 login redirect — **API 1.7**
- [ ] OAuth 42 callback, creates or updates user, returns JWT — **API 1.8**
- [ ] Change password (authenticated) — **API 1.13**
- [ ] 2FA setup — returns QR Code and secret — **API 1.14**
- [ ] 2FA verify and enable — **API 1.15**
- [ ] 2FA disable — **API 1.16**

---

## 2. User Profile & Preferences (Module: Standard User Mgmt)

- [ ] Get current user profile — **API 1.9**
- [ ] Update profile (fullName, username, bio) — **API 1.10**
- [ ] Upload avatar (multipart, max 5MB, JPG/PNG/GIF) — **API 1.11**
- [ ] Default avatar fallback when none is set
- [ ] Update preferences (theme, notification settings) — **API 1.12**
- [ ] Search users by name/username — **API 2.1**
- [ ] View another user's public profile — **API 2.2**

---

## 3. Friends & Presence (Module: Allow Users to Interact + Standard User Mgmt)

- [ ] List friends with online/offline status — **API 2.3**
- [ ] List pending friend requests (incoming and outgoing) — **API 2.4**
- [ ] Send friend request — **API 2.5**
- [ ] Accept friend request — **API 2.6**
- [ ] Reject friend request — **API 2.7**
- [ ] Remove friend — **API 2.8**
- [ ] Real-time presence indicator (online/offline) — **WS `friend_presence_changed`**
- [ ] Real-time friend request notification — **WS `friend_request_received`**

---

## 4. Workspaces (Module: Organization System)

- [ ] List workspaces with search filter — **API 3.1**
- [ ] Create workspace (name, description, initial subjects/fields) — **API 3.2**
- [ ] Get workspace details (metadata, subjects, fields, members) — **API 3.3**
- [ ] Update workspace (name, description) — **API 3.4**
- [ ] Delete workspace (admin only) — **API 3.5**
- [ ] List workspace members with roles and status — **API 3.6**
- [ ] Invite member by email with role — **API 3.7**
- [ ] List my pending workspace invitations — **API 3.8**
- [ ] Accept or reject workspace invitation — **API 3.9**
- [ ] Update member role (admin only) — **API 3.10**
- [ ] Remove member from workspace (admin only) — **API 3.11**
- [ ] Real-time: member added/removed/role updated — **WS `member_added`, `member_role_updated`, `member_removed`**
- [ ] Real-time: workspace invitation received — **WS `workspace_invitation_received`**

---

## 5. Kanban Configuration (Module: Organization System)

- [ ] List subjects (tags) in a workspace — **API 4.1**
- [ ] Create subject with name and color — **API 4.2**
- [ ] Update subject — **API 4.3**
- [ ] Delete subject — **API 4.4**
- [ ] List fields (columns) in a workspace — **API 4.5**
- [ ] Create field (column) with name and color — **API 4.6**
- [ ] Update field — **API 4.7**
- [ ] Delete field — **API 4.8**
- [ ] Real-time: subject/field created, updated, deleted — **WS `subject_*`, `field_*`**

---

## 6. Tasks (Module: Organization System + Advanced Search + Real-time Collaborative)

- [ ] List and filter tasks (search, priority, subject, assignee, status, dueDate, sort, pagination) — **API 5.1**
- [ ] Create task — **API 5.2**
- [ ] Get full task details — **API 5.3**
- [ ] Update task (all fields) — **API 5.4**
- [ ] Delete task — **API 5.5**
- [ ] Move task between columns (PATCH status) — **API 5.4**
- [ ] Real-time: task created/updated/deleted — **WS `task_created`, `task_updated`, `task_deleted`**
- [ ] Real-time: task moved (drag-and-drop sync) — **WS `task_moved`**

---

## 7. Comments (Module: Organization System)

- [ ] List comments for a task — **API 5.6**
- [ ] Add comment — **API 5.7**
- [ ] Update comment — **API 5.8**
- [ ] Delete comment — **API 5.9**
- [ ] Real-time: comment added/updated/deleted — **WS `comment_added`, `comment_updated`, `comment_deleted`**

---

## 8. Attachments (Module: File Upload)

- [ ] List attachments for a task — **API 5.10**
- [ ] Upload attachment (multipart, max 10MB per file, PDF/PNG/JPG/GIF) — **API 5.11**
- [ ] Download or preview attachment — **API 5.12**
- [ ] Delete attachment — **API 5.13**
- [ ] Reject executables and oversized files — API validation
- [ ] Real-time: attachment uploaded/deleted — **WS `attachment_uploaded`, `attachment_deleted`**

---

## 9. Chat (Module: Allow Users to Interact + Real-time Features)

- [ ] List conversations (sidebar preview with unread count) — **API 6.1**
- [ ] Get chat history (paginated) — **API 6.2**
- [ ] Send message via WebSocket — **WS `send_message`**
- [ ] Receive message in real time — **WS `receive_message`**
- [ ] Typing indicator (start/stop) — **WS `typing_start`, `typing_stop`**
- [ ] REST fallback for message sending — **API 6.3**

---

## 10. Notifications (Module: Notification System)

- [ ] List notifications with filters (type, read, pagination) — **API 6.4**
- [ ] Get unread notification count (header badge) — **API 6.5**
- [ ] Mark single notification as read — **API 6.6**
- [ ] Mark all notifications as read — **API 6.7**
- [ ] Delete notification — **API 6.8**
- [ ] Receive notification in real time (toast/dropdown) — **WS `notification_received`**
- [ ] Notification updated in real time — **WS `notification_updated`**

---

## 11. WebSocket Infrastructure (Module: Real-time Features)

- [ ] JWT authentication on Socket.io handshake — **API 7.1**
- [ ] Auto-join `user:{userId}` room on connect — **API 7.1**
- [ ] Join/leave `workspace:{wsId}` room on navigation — **WS `join_workspace`, `leave_workspace`**
- [ ] Automatic reconnection on transport failure — **API 7.5**
- [ ] Rejoin workspace rooms after reconnect — **API 7.5**

---

## 12. Frontend Pages & UI (Cross-cutting)

- [ ] Landing page (public)
- [ ] Sign In page
- [ ] Sign Up page
- [ ] Forgot Password page
- [ ] Dashboard (workspace list + search + create)
- [ ] Kanban Board (columns, cards, drag-and-drop)
- [ ] Task Detail Modal (description, assignee, dueDate, attachments, comments, status)
- [ ] Profile page (view + edit + avatar upload)
- [ ] Account Settings page (password, 2FA, notification preferences)
- [ ] Notifications page (list, filter, mark read, delete)
- [ ] Header dropdown (notifications, chat drawer, dark mode toggle, profile menu)
- [ ] Chat drawer (conversation list + message history + send + typing indicator)
- [ ] Dark mode toggle (preference persisted via API 1.12)
