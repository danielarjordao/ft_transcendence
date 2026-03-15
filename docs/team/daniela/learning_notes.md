# NestJS Learning Notes & Concepts

This document contains my personal notes and explanations of NestJS concepts to help me build the Fazelo backend.

## 1. Mental Map: NestJS vs Angular

Since I already know Angular, this is how I map the concepts:

* **@Module()** -> Same as Angular Modules. Groups related code (e.g., Workspaces).
* **@Controller()** -> Similar to Angular Components, but instead of returning HTML/UI, it returns JSON data to the frontend routes (e.g., `/api/workspaces`).
* **@Injectable() (Services)** -> Same as Angular Services. This is the "brain" where the business logic and database calls live.

## 2. DTOs (Data Transfer Objects)

* **What is it?** It's a class used to define the exact shape of the data coming *into* the backend (from the frontend request).
* **Why use a `class` and not an `interface`?** Because TypeScript interfaces disappear after compilation. Classes remain, allowing NestJS to use tools like `class-validator` to read the rules and block bad data (like missing titles or wrong types) automatically, returning a 400 Bad Request.
* **Libraries used:** `class-validator` and `class-transformer`.

## 3. Common Errors & Troubleshooting

* **"Unsafe call of a type..." / ESLint red lines:** Usually just formatting issues (like line breaks in imports) or the VS Code TypeScript server cache being outdated after `npm install`.
* **Fix:** Fix the formatting (Shift + Alt + F) or restart the TS Server in VS Code (Ctrl/Cmd + Shift + P -> "Restart TS Server").

## 4. Validation Flow (The API "Security Guard")

To make DTOs actually work, NestJS uses a global "filter" called the **ValidationPipe**. It ensures that the data entering the system is clean and follows our rules.

### How Data Flows

1. **Request:** The Frontend sends a JSON to `/workspaces`.
2. **ValidationPipe:** NestJS intercepts this JSON *before* it reaches my code.
3. **DTO Check:** It looks at the decorators (`@IsString`, `@IsNotEmpty`, etc.) defined in my DTO class.
4. **Outcome:**
   * **Invalid Data:** NestJS blocks the request and automatically returns a `400 Bad Request`.
   * **Valid Data:** NestJS transforms the JSON into a validated object and passes it to the Controller.

### Main Benefits

* **Security:** My Services never receive "garbage" or malformed data.
* **Code Cleanliness:** I don't need to write manual `if (name === undefined)` checks inside my logic.

## 5. The Entry Point (`main.ts`)

Just like Angular bootstraps the main module, NestJS uses `main.ts` to start the application and configure global rules that apply to every route.

### Key Global Configurations

* **Global Prefix (`app.setGlobalPrefix('api')`):**
  Ensures all backend routes automatically start with `/api` (e.g., `localhost:3000/api/workspaces`). This cleanly separates the data layer from the frontend routing.

* **Global Validation Pipe (`app.useGlobalPipe(...)`):**
  This acts as a global "security guard", enforcing our DTOs across the entire application before the data ever reaches our Controllers.
  * `whitelist: true`: Automatically strips away any extra fields sent by the client that are not defined in our DTO class. (Protects against data injection).
  * `forbidNonWhitelisted: true`: Works with the whitelist. Instead of just silently removing extra fields, it throws a `400 Bad Request` error, warning the client that invalid properties were sent.
  * `transform: true`: Automatically converts the incoming plain JSON string into an actual instance of our TypeScript DTO class, matching types (e.g., converting string dates into Date objects if specified).

* **CORS (`app.enableCors()`):**
  Cross-Origin Resource Sharing. It allows our React frontend (which will run on a different port, like `localhost:5173`) to make HTTP requests to this NestJS backend (`localhost:3000`) without the browser blocking them for security reasons.

## 6. Async Bootstrap & Promises

* **Floating Promises:** In `main.ts`, the `bootstrap()` function is `async`. Modern ESLint rules forbid "floating promises" (calling an async function without handling its potential failure).
* **The Fix:** We must append `.catch()` to log any fatal errors that might occur during the server startup (like a port already being in use), ensuring the app doesn't fail silently.

## 7. Controllers and Services

NestJS enforces a strict separation of concerns, heavily inspired by Angular:

* **Controllers (`@Controller`):** Their ONLY job is to handle incoming HTTP requests (GET, POST, PATCH, DELETE) and return responses. They should not contain business logic. They use decorators like `@Body()` to extract data and pass it to a Service.
* **Services / Providers (`@Injectable`):** This is where the actual work happens. The Service holds the business logic, interacts with the database (or returns mocks), and processes data.
* **Modules (`@Module`):** The glue that binds Controllers and Services together. Every feature (like Workspaces) gets its own module, which is then imported into the root `AppModule`.

## 8. Testing the API Locally

Once the NestJS server is running (`npm run start:dev`), we need to verify if the routes and validation rules are actually working.

### Testing GET Requests (Read Data)

For simple GET routes, the browser is the easiest tool.

* **Action:** Open `http://localhost:3000/api/workspaces` in Chrome/Firefox.
* **Expected Result:** A raw JSON response containing our mock data (e.g., the paginated workspace list).

### 8.1. API Testing Cheat Sheet: Using `curl`

While the browser is fine for simple `GET` requests, testing a REST API properly requires sending specific HTTP methods (POST, PATCH, DELETE) and JSON payloads. The `curl` command-line tool is perfect for this, as it interacts directly with our controllers.

**The Anatomy of a `curl` Request:**

* `-X [METHOD]`: Specifies the HTTP verb (e.g., `-X POST`, `-X PATCH`, `-X DELETE`). If omitted, it defaults to `GET`.
* `-H "Content-Type: application/json"`: The Header. It tells the NestJS backend that we are sending JSON data. Without this, the `ValidationPipe` might ignore or reject the payload.
* `-d '{ "key": "value" }'`: The Data (payload) we are sending. Notice the single quotes around the entire JSON block, and double quotes for the keys and values inside.

#### 1. GET (Read Data)

Fetches a list or a specific item. Query parameters can be directly attached to the URL (wrap the URL in quotes if you use `?` or `&`).

```bash
curl "http://localhost:3000/api/workspaces/ws_1/tasks?limit=5"

```

#### 2. POST (Create Data)

Used to trigger `@Post()` routes. Requires a JSON body that matches our `CreateDTO`.

```bash
curl -X POST http://localhost:3000/api/workspaces/ws_1/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Setup Prisma",
    "status": "todo",
    "priority": "high"
  }'

```

#### 3. PATCH (Update Data)

Used to trigger `@Patch()` routes. Thanks to `PartialType` in our DTOs, we only need to send the exact fields we want to change.

```bash
curl -X PATCH http://localhost:3000/api/tasks/tsk_12345 \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress"}'

```

#### 4. DELETE (Remove Data)

Used to trigger `@Delete()` routes. Usually doesn't need a body. If successful, our backend returns a `204 No Content`, meaning the terminal will just jump to the next line without printing any JSON.

```bash
curl -X DELETE http://localhost:3000/api/tasks/tsk_12345

```

**Terminal Pro-Tip:** If the JSON response comes back printed on a single line and your terminal prompt (e.g., `user@computer:$`) appears glued to the end of it, that is completely normal. It just means the raw API response didn't include a trailing "Enter" (newline) character.

## 9. NestJS CLI: Automatic Code Generation

Instead of manually creating folders, modules, controllers, and services one by one, NestJS provides a powerful CLI (Command Line Interface) that behaves just like the Angular CLI.

```bash
npx nest generate resource <feature-name>
```

*(Example: `npx nest generate resource tasks`)*

### What it does automatically

1. **Creates the folder structure:** e.g., `/src/tasks`.
2. **Generates the core files:** Controller, Service, Module, and testing (`.spec.ts`) files.
3. **Generates DTOs & Entities:** Creates a `/dto` folder with `create-task.dto.ts` and `update-task.dto.ts`, plus an `/entities` folder.
4. **Auto-Wiring:** Automatically imports the new `TasksModule` into the root `app.module.ts` so it works immediately.
5. **CRUD Boilerplate:** If prompted, selecting "REST API" and "Y" for CRUD entry points will pre-write all the standard HTTP routes (GET, POST, PATCH, DELETE) in the Controller and the corresponding empty methods in the Service.

**Note:** Sometimes running this command causes a peer dependency error (e.g., `ERESOLVE unable to resolve dependency tree`). This is just npm being overly cautious about package versions. Running the failed installation with `--legacy-peer-deps` fixes it.

* **The "Id" Trap:** By default, the Nest CLI generates code assuming IDs are numbers. It adds a `+` prefix to params (e.g., `+id`) to cast them.
* **The Fix:** Since we use string-based IDs (e.g., `task_123`), we must manually remove the `+` sign in the Controller to avoid `type mismatch` errors between the Controller and the Service.

Here is the structured content for your `learning_notes.md` in English. I’ve organized it to reflect the specific technical hurdles we cleared today.

## 10. Tasks Module & Advanced NestJS Concepts

### Advanced DTOs & Partial Updates

* **Validation Enums:** Using `enum` for fields like `Priority` (LOW, MEDIUM, HIGH) ensures the API strictly rejects any value outside the predefined set.
* **The `PartialType` Helper:** * Found in `UpdateTaskDto`. It clones the `CreateTaskDto` but makes every field optional (`?`).
* **Why it matters:** Essential for `PATCH` requests. It allows a user to update just one field (e.g., moving a task to a different column by changing only the `fieldId`) without being forced to resend the title or description.

### TypeScript & Compilation Safety

* **Interface vs. DTO:** * **DTOs** define what the user sends (input).
* **Interfaces/Entities** define how the data is stored internally (input + generated fields like `id` and `createdAt`).

* **The `import type` Requirement:** * When importing an interface into a Controller to type a return value (e.g., `: Task`), you must use `import type { Task } from ...`.
* **Why?** Because of `isolatedModules` and `emitDecoratorMetadata` flags. It tells the compiler the import is purely for type-checking and shouldn't be treated as a JavaScript class at runtime.
