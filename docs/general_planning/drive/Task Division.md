## **Murilo: Data & Authentication (25% of project)**

### **Primary Responsibilities**

**Database Architecture**

* Design complete PostgreSQL schema  
* Implement all Prisma models and relationships  
* Create and manage migrations  
* Write seed scripts with test data  
* Optimize queries and indexes  
* Handle complex joins and relations

**Authentication System**

* User registration and login endpoints  
* JWT token generation and validation  
* Password hashing with bcrypt  
* Session management  
* Password reset flow  
* OAuth integration (Google \+ GitHub)  
* Token refresh logic

**Security Infrastructure**

* HTTPS configuration  
* CORS setup  
* Rate limiting implementation  
* Input sanitization middleware  
* Security headers configuration  
* Environment variables management  
* API key validation

**File Storage**

* Database schema for file metadata  
* File storage strategy  
* Access control logic for files  
* Query optimization for file retrieval

### **Supporting Responsibilities**

* Collaborate with Daniela on API endpoint data requirements  
* Provide database query optimization support  
* Review backend PRs for security concerns  
* Document database schema and relationships

---

## **Daniela: Backend Core (25% of project)**

### **Primary Responsibilities**

**API Development**

* RESTful endpoint design and implementation  
* Request validation schemas  
* Error handling and response formatting  
* API documentation  
* Pagination logic  
* Business logic layer

**WebSocket Server**

* Socket.io server configuration  
* Real-time event handlers  
* Room management (workspace-based)  
* Broadcast logic for task updates  
* Connection/disconnection handling  
* Socket authentication

**Core Backend Features**

* Organization CRUD endpoints  
* Task CRUD endpoints  
* Subject/Category management  
* Comment system endpoints  
* Friends system logic  
* Chat message endpoints  
* Notification creation logic

**File Upload Backend**

* File upload endpoint implementation  
* File type and size validation  
* Secure file handling  
* File URL generation  
* File deletion endpoint

### **Supporting Responsibilities**

* Collaborate with Murilo on data requirements  
* Work with Frontend team on API contracts  
* Code review for backend PRs  
* Backend testing and debugging

---

## **Lucas: Frontend Core (25% of project)**

### **Primary Responsibilities**

**UI Component Library**

* Design system setup with Tailwind  
* Reusable component library (buttons, inputs, cards, modals)  
* Form components with validation  
* Layout components (headers, sidebars, footers)  
* Loading and error state components  
* Responsive component variants

**Task Management Interface**

* Kanban board layout implementation  
* Task card design and display  
* Drag and drop functionality (react-beautiful-dnd or dnd-kit)  
* Task creation modal/form  
* Task detail view  
* Task edit interface  
* Column management UI  
* Subject/category visual organization

**User Interface Pages**

* Dashboard layout  
* Workspace selection page  
* Settings pages  
* User profile view  
* Friends list interface  
* Organization management pages

**Responsive Design**

* Mobile layouts for all pages  
* Tablet breakpoint optimization  
* Touch interaction handling  
* Mobile navigation menu  
* Responsive Kanban board

### **Supporting Responsibilities**

* Collaborate with Ana on component architecture  
* Integrate Socket.io client events  
* Frontend testing  
* Code review for frontend PRs

---

## **Ana Laura: Frontend Lead & Integration (25% of project)**

### **Primary Responsibilities**

**Authentication & Routing**

* React Router setup and configuration  
* Protected route implementation  
* Login/signup page components  
* OAuth integration on frontend  
* Authentication state management  
* Avatar upload component  
* Profile editing interface

**Real-time Features Integration**

* Socket.io client setup  
* WebSocket event listeners  
* Real-time UI update logic  
* Optimistic UI updates  
* Conflict resolution handling  
* Presence indicators  
* Live typing indicators

**State Management**

* Global state architecture (Context API or Zustand)  
* API integration layer  
* HTTP client configuration (Axios)  
* Data fetching hooks  
* Cache management  
* Error boundary implementation

**Advanced Features**

* Chat interface implementation  
* Message list with real-time updates  
* Notification panel/dropdown  
* Notification badge system  
* Search interface  
* Filter controls  
* Advanced search results display

**Integration & Coordination**

* API contract definition with Backend team  
* Frontend-Backend integration testing  
* Component integration  
* Error handling standardization  
* Loading state patterns

### **Supporting Responsibilities**

* Code review leadership for frontend  
* Coordinate with Lucas on component usage  
* Work with Daniela on API requirements  
* Frontend architecture documentation

---

## **Shared Responsibilities (Everyone \- 20% each)**

### **DevOps & Deployment**

**All team members**

* Docker configuration understanding  
* Docker Compose file maintenance  
* Environment setup documentation  
* Deployment testing

### **Documentation**

**Murilo**: Database schema documentation, API security docs **Daniela**: API endpoint documentation, WebSocket events docs **Lucas**: Component library documentation, UI patterns **Ana Laura**: Integration docs, state management docs **All**: README sections, Privacy Policy, Terms of Service

### **Testing & Quality**

**Each person tests their own work**

* Unit tests for own code  
* Integration testing participation  
* Bug fixing in own area  
* Cross-browser testing  
* Code reviews for team

### **Project Management**

**All team members equally**

* Attend standups/check-ins  
* Update task status  
* Git workflow participation (branches, PRs)  
* Team communication  
* Progress reporting

---

## **Cross-Team Collaboration Points**

### **Murilo ↔ Daniela**

* Database schema alignment with API needs  
* Query optimization discussions  
* Security implementation coordination  
* OAuth token handling

### **Daniela ↔ Ana Laura**

* API contract definition  
* WebSocket event specifications  
* Real-time feature coordination  
* Error response formatting

### **Lucas ↔ Ana Laura**

* Component architecture decisions  
* State management patterns  
* Reusable component API design  
* Responsive design strategy

### **Frontend Team ↔ Backend Team**

* Weekly API sync meetings  
* Shared Postman/API documentation  
* Integration testing sessions  
* Bug triage coordination

---

## **Module Ownership**

### **Murilo Leads**

* User Management \- OAuth (Minor \- 1pt)  
* Web \- ORM (Minor \- 1pt)  
* Database infrastructure for all modules

### **Daniela Leads**

* Web \- Real-time features (Major \- 2pts)  
* Web \- User interaction (Major \- 2pts)  
* Web \- Notification system (Minor \- 1pt)

### **Lucas Leads**

* Web \- Advanced search (Minor \- 1pt)  
* User Management \- Standard (Major \- 2pts) *shared with Ana*  
* Kanban interface for all task modules

### **Ana Laura Leads**

* Web \- Use frameworks (Major \- 2pts) *coordination role*  
* User Management \- Organization system (Major \- 2pts)  
* Web \- Real-time collaborative features (Minor \- 1pt)  
* Web \- File upload (Minor \- 1pt)

**Total: 16 points across all members**

---

## **Phase-Based Work Distribution**

### **Phase 1: Foundation**

* **Murilo**: Database schema \+ Auth setup  
* **Daniela**: Basic API structure \+ endpoints  
* **Lucas**: Component library \+ basic layouts  
* **Ana Laura**: React setup \+ routing \+ auth pages

### **Phase 2: Core Features**

* **Murilo**: OAuth \+ file storage setup  
* **Daniela**: CRUD endpoints (orgs, tasks, subjects)  
* **Lucas**: Kanban board \+ task cards  
* **Ana Laura**: State management \+ API integration

### **Phase 3: Collaboration**

* **Murilo**: Friends system data layer  
* **Daniela**: Chat endpoints \+ WebSocket events  
* **Lucas**: Friends UI \+ profile pages  
* **Ana Laura**: Chat interface \+ real-time integration

### **Phase 4: Real-time & Advanced**

* **Murilo**: Notification data \+ file metadata  
* **Daniela**: Notification logic \+ file upload endpoint  
* **Lucas**: Drag-drop \+ search UI  
* **Ana Laura**: Notification panel \+ WebSocket coordination

### **Phase 5: Enhancement**

* **Murilo**: Security hardening \+ OAuth polish  
* **Daniela**: API optimization \+ WebSocket stability  
* **Lucas**: UI polish \+ responsive fixes  
* **Ana Laura**: Search integration \+ advanced features

### **Phase 6: Testing & Documentation**

* **All**: Own area testing \+ documentation  
* **Ana Laura**: Integration testing lead  
* **Murilo**: Database docs \+ security docs  
* **Daniela**: API documentation  
* **Lucas**: Component documentation

