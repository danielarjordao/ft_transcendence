# API Contracts: To Be Defined

This document lists all the endpoints, payloads, and WebSocket events that the Frontend and Backend teams need to discuss and agree upon.

## 1. Auth & Users (REST)

* **`POST /auth/signup` & `POST /auth/signin`**
  * *To define:* What exactly does the frontend send? (email, username, password). How does the backend return the JWT token? (Cookie or JSON body?)
* **`GET /auth/42/callback` (OAuth)**
  * *To define:* How does the frontend handle the redirect after a successful 42 login?
* **`POST /auth/forgot-password` & `POST /auth/reset-password`**
  * *To define:* What is the payload? How is the reset token validated?
* **`PATCH /users/me` (Profile Edit)**
  * *To define:* How are avatar image uploads handled? (Multipart form-data or Base64?). What fields can be updated? (Bio, Name, Password).
* **`POST /users/2fa/enable` & `POST /users/2fa/verify`**
  * *To define:* How does the backend send the QR Code/Secret to the frontend?

## 2. Workspaces & Members (REST)

* **`GET /workspaces` (Dashboard List)**
  * *To define:* Does the backend return all data, or just a summary (name, member count, role)? How does the frontend send the search/filter query?
* **`POST /workspaces` (Create Workspace)**
  * *To define:* What are the mandatory fields? (Name, Description, Initial Subjects?).
* **`POST /workspaces/:id/invite`**
  * *To define:* Does the frontend send an email array? What is the default role (Member)?

## 3. Tasks & Kanban (REST)

* **`GET /workspaces/:id/tasks` (Board & Filters)**
  * *To define:* How do we structure the query parameters for filtering? (e.g., `?priority=HIGH&assignee=lucas&subject=Backend`).
* **`POST /tasks` (Create Task) & `PATCH /tasks/:id` (Edit Task)**
  * *To define:* What is the exact JSON structure for a task? Which fields are mandatory vs. optional? (Due date, Assignee, Description).
* **`POST /tasks/:id/comments`**
  * *To define:* What data is sent to create a comment? What does the returned comment object look like (author name, avatar, timestamp)?
* **`POST /tasks/:id/attachments`**
  * *To define:* File size limits and allowed extensions.

## 4. Notifications (REST)

* **`GET /notifications`**
  * *To define:* Do we need pagination? How does the frontend know which notification links
