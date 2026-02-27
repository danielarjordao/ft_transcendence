# **ft\_transcendence: Task Management Platform**

---

## **Executive Summary**

This document outlines a comprehensive plan to develop a collaborative task management platform for our ft\_transcendence project. The platform will function as a Notion-style Kanban board system where teams can organize work across multiple workspaces, create tasks under different subjects/categories, and collaborate in real-time.

The proposed solution meets all mandatory requirements from the subject and targets 16 module points, providing a 2-point buffer for evaluation.

---

## **Product Vision**

### **What We're Building**

A web-based task management platform where teams can:

**Core Functionality:**

* Create workspaces (Organizations) for different teams or projects
* Organize tasks under subjects/categories within each workspace
* Visualize work using Kanban boards (To Do, In Progress, Done)
* Move tasks between columns and categories with drag-and-drop
* Assign tasks to team members
* Track progress and deadlines
* Collaborate through comments and chat
* Receive notifications for updates
* Attach files to tasks

**User Experience:** Think of it as a simplified Notion workspace focused on task management. Users log in, select or create a workspace, see their Kanban boards organized by subject/category, and can seamlessly move tasks around while collaborating with teammates in real-time.

### **Key User Flows**

**New User Journey:**

1. Sign up with email/password or OAuth (Google/GitHub)
2. Upload profile picture
3. Create first workspace or get invited to existing one
4. Create subjects (e.g., "Backend Development", "UI Design", "Documentation")
5. Create tasks under subjects
6. Assign tasks, set deadlines, add descriptions
7. Move tasks through workflow stages (columns)
8. Add friends to connect with other users
9. Chat with teammates
10. Receive notifications on task updates

**Daily User Journey:**

1. Log in and see dashboard with all workspaces
2. Select workspace to view Kanban board
3. See tasks organized by subject in columns
4. Drag task from "To Do" to "In Progress"
5. Add comment with progress update
6. Attach screenshot or document
7. Mention teammate in comment
8. Teammate receives notification
9. Move completed task to "Done"
10. Check chat for team discussions

---

## **Technical Stack Recommendation**

### **Frontend**

**React with TypeScript**

* Component-based architecture
* Strong typing reduces bugs
* Extensive documentation and community
* Good for team collaboration

**Tailwind CSS**

* Rapid UI development
* Consistent styling
* No CSS conflicts
* Easy responsive design

### **Backend**

**Node.js with NestJS (TypeScript)**

* End-to-end TypeScript (same language frontend/backend)
* Structured architecture built-in
* Excellent for team projects
* WebSocket support included
* Dependency injection and modularity

### **Database**

**PostgreSQL with Prisma ORM**

* Robust relational database
* Type-safe database queries
* Visual schema management
* Easy migrations
* Handles complex relationships well

### **Real-time Communication**

**Socket.io**

* Reliable WebSocket implementation
* Built-in room support
* Automatic reconnection
* Fallback mechanisms

### **Deployment**

**Docker \+ Docker Compose**

* Single command deployment
* Consistent environments
* Easy team setup
* Meets subject requirements

---

## **Module Selection (16 Points)**

### **Mandatory Foundation (10 points)**

**1\. Web \- Use frameworks (Major \- 2pts)**

* React frontend \+ NestJS backend
* Full-stack framework coverage

**2\. Web \- Real-time features (Major \- 2pts)**

* Live task updates across all connected users
* Real-time chat messages
* Instant notifications
* Live presence indicators

**3\. Web \- User interaction (Major \- 2pts)**

* Chat system between users
* User profiles with information display
* Friends system (add/remove, view friends list)

**4\. User Management \- Standard (Major \- 2pts)**

* Update profile information
* Upload and change avatar
* Add friends and see online status
* Profile pages displaying user info

**5\. Web \- ORM (Minor \- 1pt)**

* Prisma for type-safe database access

**6\. Web \- Notification system (Minor \- 1pt)**

* Notifications for task creation
* Notifications for task updates
* Notifications for task deletion
* Notifications for comments
* Notifications for assignments

### **Strategic Additions (6 points)**

**7\. User Management \- OAuth (Minor \- 1pt)**

* Google authentication
* GitHub authentication
* Seamless account linking

**8\. User Management \- Organization system (Major \- 2pts)**

* Create workspaces (organizations)
* Add/remove users from workspaces
* Assign roles (admin, member, viewer)
* Perform workspace-specific actions

**9\. Web \- Real-time collaborative features (Minor \- 1pt)**

* Shared Kanban boards
* Live task movement visibility
* Concurrent editing support

**10\. Web \- Advanced search (Minor \- 1pt)**

* Filter tasks by status
* Filter by assignee
* Filter by due date
* Sort options
* Search by keywords

**11\. Web \- File upload (Minor \- 1pt)**

* Attach files to tasks
* Multiple file type support
* Size and type validation
* Secure storage
* File preview where possible

**Total: 16 points** (2-point safety buffer)

---

## **Database Schema**

### **Core Tables**

**Users**

* User ID
* Email (unique)
* Password hash
* Username
* Avatar URL
* Online status
* Created/updated timestamps

**Organizations (Workspaces)**

* Organization ID
* Name
* Description
* Created by (user reference)
* Created/updated timestamps

**Organization Members**

* Member ID
* Organization ID
* User ID
* Role (admin, member, viewer)
* Joined date

**Subjects (Categories)**

* Subject ID
* Organization ID
* Name
* Color code
* Display order

**Tasks**

* Task ID
* Subject ID
* Title
* Description
* Status (todo, in\_progress, done)
* Priority (low, medium, high)
* Assigned to (user reference)
* Created by (user reference)
* Due date
* Created/updated timestamps

**Comments**

* Comment ID
* Task ID
* User ID
* Content
* Created timestamp

**Attachments**

* Attachment ID
* Task ID
* Filename
* File URL
* Uploaded by (user reference)
* Upload timestamp

**Friends**

* Friendship ID
* User ID
* Friend ID
* Status (pending, accepted)
* Created timestamp

**Messages**

* Message ID
* Sender ID
* Receiver ID
* Content
* Read status
* Created timestamp

**Notifications**

* Notification ID
* User ID
* Type
* Content
* Read status
* Related entity ID
* Created timestamp

---

## **Feature Breakdown**

### **Phase 1: Foundation (Must Complete First)**

**Project Setup**

* Initialize Git repository with clear structure
* Setup Docker and Docker Compose
* Configure development environment
* Create environment variables template
* Setup CI/CD basics

**Authentication System**

* User registration with email validation
* Secure login (password hashing with bcrypt)
* JWT token management
* Password reset flow
* Session management

**Database Infrastructure**

* Design complete schema
* Setup Prisma ORM
* Create initial migrations
* Seed database with test data
* Establish relationships

**Basic Frontend Structure**

* React application setup
* Routing configuration
* Layout components
* Authentication pages
* Protected routes

**Deliverable:** Users can register, login, and access protected dashboard

---

### **Phase 2: Core Task Management**

**User Profiles**

* View profile page
* Edit profile information
* Upload/change avatar
* Default avatar system
* Profile settings

**Organization Management**

* Create workspace
* Edit workspace details
* Delete workspace (admin only)
* View workspace members
* Invite users to workspace

**Subject/Category System**

* Create subjects within workspace
* Assign colors to subjects
* Reorder subjects
* Edit subject names
* Delete subjects (with task handling)

**Task CRUD Operations**

* Create task under subject
* View task details
* Edit task information
* Delete task
* Assign task to user
* Set task priority
* Set due dates

**Kanban Board Interface**

* Display tasks in columns (To Do, In Progress, Done)
* Group tasks by subject
* Visual distinction between subjects
* Task cards with essential info
* Column headers and counts

**Deliverable:** Users can manage workspaces, create subjects, and perform full CRUD operations on tasks with basic Kanban visualization

---

### **Phase 3: Collaboration Features**

**Friends System**

* Send friend request
* Accept/decline requests
* View friends list
* Remove friends
* See friend online status
* Search users to add

**Chat System**

* Direct messaging between friends
* Real-time message delivery
* Message history
* Read receipts
* Typing indicators
* Chat list with last message preview

**Comments on Tasks**

* Add comment to task
* View comment history
* Edit own comments
* Delete own comments
* Mention users with @ symbol
* Timestamp display

**Deliverable:** Users can add friends, chat in real-time, and discuss tasks through comments

---

### **Phase 4: Real-time & Advanced Features**

**Real-time Task Updates**

* Live task creation across clients
* Live task updates across clients
* Live task deletion across clients
* Live task movement between columns
* Live assignment updates
* Presence indicators (who's viewing)

**Notification System**

* Task assignment notifications
* Comment mention notifications
* Task update notifications
* Friend request notifications
* Message notifications
* Mark as read functionality
* Notification dropdown/panel

**Drag and Drop**

* Drag tasks between columns
* Drag tasks between subjects
* Smooth animations
* Optimistic updates
* Conflict resolution

**File Upload System**

* Attach files to tasks
* Multiple file support
* File type validation (images, PDFs, documents)
* File size limits (10MB per file)
* Preview for images
* Download functionality
* Delete attachments

**Deliverable:** Full real-time collaboration with drag-and-drop Kanban, notifications, and file attachments

---

### **Phase 5: Enhancement & OAuth**

**OAuth Integration**

* Google OAuth setup
* GitHub OAuth setup
* Account linking
* OAuth profile picture import
* Fallback to email/password

**Advanced Search & Filters**

* Search tasks by keyword
* Filter by status
* Filter by assignee
* Filter by due date range
* Filter by priority
* Sort options (date, priority, alphabetical)
* Combine multiple filters
* Save filter presets (optional)

**UI Polish**

* Responsive design (mobile, tablet, desktop)
* Loading states
* Error handling
* Empty states
* Success feedback
* Consistent styling
* Accessibility improvements

**Deliverable:** OAuth authentication working, advanced search functional, polished responsive UI

---

### **Phase 6: Testing & Documentation**

**Testing**

* Frontend validation (all forms)
* Backend validation (all endpoints)
* Real-time feature testing
* Cross-browser testing (Chrome, Firefox, Safari)
* Mobile responsiveness testing
* Performance testing
* Security audit

**Documentation**

* Complete README.md with all required sections
* Privacy Policy page (accessible from footer)
* Terms of Service page (accessible from footer)
* API documentation
* Code comments
* Environment setup guide
* Deployment instructions

**Security Hardening**

* HTTPS configuration
* CORS setup
* Rate limiting
* Input sanitization
* XSS prevention
* CSRF protection
* Secure file upload

**Final Polish**

* Fix all console errors
* Remove debug code
* Optimize bundle size
* Database optimization
* Clean up unused dependencies
* Final code review

**Deliverable:** Production-ready application with complete documentation, no errors, and full security implementation

---

## **Work Distribution Framework**

The work is divided into clear responsibility areas. Team members can choose based on their interests and strengths. The goal is balanced contribution across frontend, backend, and full-stack tasks.

### **Backend-Heavy Responsibilities**

**Authentication & Security**

* User registration and login endpoints
* JWT token generation and validation
* Password hashing implementation
* OAuth integration (Google, GitHub)
* HTTPS configuration
* Security middleware (CORS, rate limiting)
* Session management

**Database & ORM**

* Design and implement database schema
* Setup Prisma ORM
* Create migrations
* Write database queries
* Optimize database performance
* Handle relationships
* Seed data scripts

**API Development**

* RESTful endpoint design
* Request validation
* Error handling
* Response formatting
* API documentation
* Pagination implementation
* Query optimization

**File Upload System**

* File upload endpoint
* File type validation
* File size limits
* Secure file storage
* File retrieval endpoint
* Delete file endpoint
* Generate file URLs

**WebSocket Events**

* Setup Socket.io server
* Define event handlers
* Room management (by workspace)
* Broadcast logic
* Connection/disconnection handling
* Error handling for sockets

**Estimated Workload:** 35% of total project

---

### **Frontend-Heavy Responsibilities**

**UI Component Library**

* Design system setup
* Reusable components (buttons, inputs, cards)
* Layout components
* Navigation components
* Modal/dialog components
* Form components
* Loading states
* Error states

**Task Management Interface**

* Kanban board layout
* Task cards design
* Drag and drop implementation
* Task creation forms
* Task edit forms
* Task detail view
* Subject/category display
* Column management

**User Interface Pages**

* Dashboard layout
* Workspace selection
* Profile pages
* Settings pages
* Login/signup pages
* Chat interface
* Friends list
* Notification panel

**Real-time UI Updates**

* Socket.io client setup
* Listen for task updates
* Update UI on events
* Optimistic UI updates
* Handle conflicts
* Presence indicators
* Live typing indicators

**Responsive Design**

* Mobile layouts
* Tablet layouts
* Desktop layouts
* Touch interactions
* Mobile navigation
* Responsive Kanban board

**Estimated Workload:** 35% of total project

---

### **Full-Stack Responsibilities**

**Organization System**

* Backend: Organization CRUD endpoints
* Backend: Member management
* Backend: Role-based permissions
* Frontend: Workspace creation UI
* Frontend: Member management UI
* Frontend: Organization settings
* Integration: Connect frontend to backend

**Chat System**

* Backend: Message storage
* Backend: Message retrieval
* Backend: WebSocket message events
* Frontend: Chat interface
* Frontend: Message list
* Frontend: Real-time message updates
* Integration: End-to-end messaging flow

**Notification System**

* Backend: Notification creation logic
* Backend: Notification retrieval
* Backend: Mark as read endpoint
* Frontend: Notification panel
* Frontend: Notification badges
* Frontend: Real-time notification updates
* Integration: Notification triggers

**Search & Filter**

* Backend: Search endpoints
* Backend: Filter logic
* Backend: Query optimization
* Frontend: Search interface
* Frontend: Filter controls
* Frontend: Search results display
* Integration: Connect search UI to API

**Friends System**

* Backend: Friend request logic
* Backend: Accept/decline endpoints
* Backend: Friends list endpoint
* Frontend: Add friend UI
* Frontend: Friend requests UI
* Frontend: Friends list display
* Integration: Online status updates

**Estimated Workload:** 30% of total project

---

### **Shared Responsibilities (Everyone)**

**DevOps & Deployment**

* Docker configuration
* Docker Compose setup
* Environment variables
* Deployment scripts
* CI/CD setup (if time permits)

**Testing**

* Unit tests for own code
* Integration testing
* Bug fixing
* Code review for teammates
* Cross-browser testing

**Documentation**

* README sections
* Privacy Policy
* Terms of Service
* Code comments
* API documentation (backend)
* Component documentation (frontend)

**Project Management**

* Daily/weekly standups
* Task tracking
* Git workflow (branches, PRs, merges)
* Communication
* Progress reports

---

## **Technical Implementation Guidelines**

### **Git Workflow**

**Branch Structure:**

* `main` \- production-ready code
* `develop` \- integration branch
* `feature/[feature-name]` \- individual features
* `bugfix/[bug-name]` \- bug fixes

**Commit Message Format:**

\[type\]: Brief description

Examples:
feat: Add task creation endpoint
fix: Resolve drag and drop bug
docs: Update README with OAuth setup
style: Format code with Prettier
refactor: Restructure auth service

**Pull Request Process:**

1. Create feature branch from `develop`
2. Implement feature with commits
3. Push branch to GitHub
4. Create PR to `develop`
5. Request review from at least one teammate
6. Address review comments
7. Merge after approval
8. Delete feature branch

---

### **Security Checklist**

**Authentication:**

*  Passwords hashed with bcrypt (minimum 10 salt rounds)
*  JWT tokens with reasonable expiration (7 days)
*  Secure password reset flow
*  OAuth tokens stored securely
*  No passwords in logs

**API Security:**

*  HTTPS enforced everywhere
*  CORS configured properly
*  Rate limiting on endpoints
*  Input validation on all endpoints
*  SQL injection prevention (Prisma handles this)
*  XSS prevention (React handles most)
*  CSRF tokens for state changes

**File Upload:**

*  File type whitelist (images, PDFs, documents only)
*  Maximum file size enforced (10MB)
*  Sanitize filenames
*  Store files outside webroot
*  Virus scanning (if possible)
*  Authenticated access only

**General:**

*  Environment variables for secrets
*  .env file in .gitignore
*  No hardcoded credentials
*  Error messages don't leak info
*  Logging implemented
*  Security headers set

---

### **Environment Variables Template**

Create `.env.example` file:

bash
\# Database
DATABASE\_URL\="postgresql://user:password@localhost:5432/taskmanager"

\# Authentication
JWT\_SECRET\="your-jwt-secret-key-change-this"
JWT\_EXPIRATION\="7d"

\# OAuth \- Google
GOOGLE\_CLIENT\_ID\="your-google-client-id"
GOOGLE\_CLIENT\_SECRET\="your-google-client-secret"
GOOGLE\_CALLBACK\_URL\="http://localhost:3000/auth/google/callback"

\# OAuth \- GitHub
GITHUB\_CLIENT\_ID\="your-github-client-id"
GITHUB\_CLIENT\_SECRET\="your-github-client-secret"
GITHUB\_CALLBACK\_URL\="http://localhost:3000/auth/github/callback"

\# File Upload
MAX\_FILE\_SIZE\="10485760"
UPLOAD\_DIR\="./uploads"
ALLOWED\_FILE\_TYPES\="image/jpeg,image/png,image/gif,application/pdf,application/msword"

\# Application
NODE\_ENV\="development"
PORT\="3000"
FRONTEND\_URL\="http://localhost:3001"

\# Redis (for sessions, optional)
REDIS\_HOST\="localhost"
REDIS\_PORT\="6379"
\`\`\`

\---

\#\#\# Project Structure
\`\`\`
ft\_transcendence/
├── docker-compose.yml
├── .env.example
├── .gitignore
├── README.md
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   └── schema.prisma
│   └── src/
│       ├── main.ts
│       ├── auth/
│       ├── users/
│       ├── organizations/
│       ├── tasks/
│       ├── chat/
│       ├── notifications/
│       └── uploads/
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│       ├── App.tsx
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       ├── services/
│       └── utils/
└── docs/
    ├── PRIVACY\_POLICY.md
    └── TERMS\_OF\_SERVICE.md
---

## **Success Criteria**

### **Technical Requirements**

*  All 16 modules fully implemented and functional
*  No errors in browser console
*  HTTPS configured properly
*  Works on latest Chrome (primary), Firefox, Safari
*  Mobile responsive (works on phones and tablets)
*  Page load time under 3 seconds
*  Real-time features work smoothly
*  All forms have validation (frontend and backend)
*  Database schema properly structured with relationships
*  Docker deployment works with single command

### **Feature Requirements**

*  Users can register and login securely
*  OAuth works for Google and GitHub
*  Users can create workspaces
*  Users can add subjects/categories
*  Tasks can be created, edited, deleted
*  Kanban board displays tasks properly
*  Drag and drop works smoothly
*  Real-time updates visible across clients
*  Chat works between friends
*  Notifications appear for all actions
*  Files can be attached to tasks
*  Search and filter works accurately
*  Friends system functional

### **Documentation Requirements**

*  README.md complete with all sections
*  Team roles documented
*  Project management approach described
*  Technical stack justified
*  Database schema visualized
*  Features list with contributors
*  Module justifications provided
*  Individual contributions detailed
*  Privacy Policy page accessible
*  Terms of Service page accessible

### **Team Requirements**

*  All members have meaningful Git commits
*  Work distributed fairly
*  Everyone can explain the project
*  Everyone can explain their contributions
*  Code reviewed by teammates
*  Communication maintained throughout

---

## **Risk Management**

### **High-Priority Risks**

**Risk: Team coordination issues**

* Impact: Delays, duplicated work, conflicts
* Mitigation: Clear communication channels (Discord), regular check-ins, defined roles
* Contingency: Daily standup messages, task tracking board

**Risk: Real-time feature complexity**

* Impact: Bugs, poor user experience, synchronization issues
* Mitigation: Start simple, thorough testing, incremental implementation
* Contingency: Fallback to polling if WebSocket fails

**Risk: Scope creep**

* Impact: Project not completed on time, burnout
* Mitigation: Stick to 16 points, resist adding features
* Contingency: Cut bonus features if falling behind

**Risk: Lack of framework experience**

* Impact: Slower development, more bugs
* Mitigation: Documentation-heavy approach, pair programming, code reviews
* Contingency: Allocate extra time for learning, use official tutorials

### **Medium-Priority Risks**

**Risk: OAuth integration issues**

* Impact: Missing 1 module point
* Mitigation: Follow official documentation, test thoroughly
* Contingency: Implement last, can drop if critical issues

**Risk: Database schema changes mid-project**

* Impact: Migration issues, data loss
* Mitigation: Design schema carefully upfront, use migrations properly
* Contingency: Prisma handles migrations well, test on development data

**Risk: File upload security issues**

* Impact: Vulnerability, failed evaluation
* Mitigation: Strict validation, file type checking, size limits
* Contingency: Use established libraries, security audit before submission

---

## **Learning Resources**

### **React \+ TypeScript**

* Official React docs (react.dev)
* TypeScript handbook
* React TypeScript cheatsheet

### **NestJS**

* Official NestJS documentation
* NestJS fundamentals course
* Task management API tutorial

### **Prisma**

* Prisma quickstart guide
* Schema reference
* Prisma with PostgreSQL guide

### **Socket.io**

* Official Socket.io docs
* Real-time chat tutorial
* Socket.io with React guide

### **Tailwind CSS**

* Official Tailwind documentation
* Component examples
* Responsive design guide

---

## **Evaluation Preparation**

### **What Evaluators Will Check**

**Mandatory Requirements:**

1. Is it a web application with frontend, backend, and database?
2. Does Git show commits from all members with clear messages?
3. Does Docker deployment work with one command?
4. Compatible with latest Chrome?
5. No console errors?
6. Privacy Policy and Terms pages present and accessible?
7. Multiple users can use it simultaneously?

### **Demonstration Script**

Prepare to show:

1. Login/registration flow (OAuth too)
2. Create workspace
3. Add subjects
4. Create tasks under subjects
5. Drag task between columns
6. Assign task to user
7. Add comment to task
8. Attach file to task
9. Use search and filters
10. Send chat message
11. Show notification system
12. Add friend and see online status
13. Open second browser \- demonstrate real-time updates
14. Show code for critical features
15. Explain database schema
16. Show README, Privacy Policy, Terms

---

## **Timeline by Deliverables**

### **Deliverable 1: Authentication & Setup**

**What's Done:**

* Git repository initialized
* Docker configuration working
* Database schema designed and implemented
* User registration working
* User login working
* JWT authentication
* Basic frontend structure
* Protected routes

**Acceptance Criteria:**

* Can register new user
* Can login with credentials
* Cannot access dashboard without login
* Password is hashed in database
* Docker runs with one command

---

### **Deliverable 2: Core Workspace & Tasks**

**What's Done:**

* User can create workspace
* User can view workspace
* User can add subjects to workspace
* User can create tasks under subjects
* User can edit tasks
* User can delete tasks
* User can view tasks in list
* User profile page exists
* User can upload avatar

**Acceptance Criteria:**

* Full CRUD on workspaces
* Full CRUD on subjects
* Full CRUD on tasks
* Tasks linked to subjects
* Profile page shows user info
* Avatar upload works

---

### **Deliverable 3: Kanban Board**

**What's Done:**

* Kanban board layout
* Tasks display in columns
* Tasks grouped by subject
* Drag and drop between columns
* Task cards show essential info
* Create task from Kanban view
* Task status updates when moved

**Acceptance Criteria:**

* Kanban board displays correctly
* Can drag tasks between columns
* Visual distinction between subjects
* Task status persists after move
* Responsive on mobile

---

### **Deliverable 4: Collaboration Features**

**What's Done:**

* Friends system (send request, accept, decline)
* Friends list displays
* Online status shows
* Chat interface
* Send messages
* Receive messages in real-time
* Message history
* Comments on tasks
* View comment history

**Acceptance Criteria:**

* Can add friends
* Online status accurate
* Messages send instantly
* Chat history persists
* Comments save to tasks
* Can mention users with @

---

### **Deliverable 5: Real-time & Notifications**

**What's Done:**

* WebSocket connection established
* Real-time task updates across clients
* Real-time chat updates
* Notification system
* Notification panel/dropdown
* Mark notifications as read
* Notifications for assignments
* Notifications for mentions
* Notifications for task updates

**Acceptance Criteria:**

* Open two browsers, changes in one appear in other
* Notifications appear without refresh
* Can mark notifications as read
* No lag in real-time updates

---

### **Deliverable 6: Advanced Features**

**What's Done:**

* File upload on tasks
* File validation (type, size)
* File download
* OAuth with Google
* OAuth with GitHub
* Search functionality
* Filter by status
* Filter by assignee
* Filter by date
* Advanced search UI

**Acceptance Criteria:**

* Files attach to tasks successfully
* Invalid files rejected
* OAuth login works
* Search returns accurate results
* Filters combine properly
* UI responsive on all devices

---

### **Deliverable 7: Documentation & Security**

**What's Done:**

* README.md complete
* All required sections filled
* Privacy Policy written
* Terms of Service written
* HTTPS configured
* All security measures implemented
* No console errors
* Code cleaned up
* All tests passing

**Acceptance Criteria:**

* README has all sections from subject
* Privacy Policy accessible from footer
* Terms accessible from footer
* HTTPS working everywhere
* Security audit passed
* Cross-browser testing complete
* Mobile responsive verified
