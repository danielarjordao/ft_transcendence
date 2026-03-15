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

### Testing POST Requests & Validation (Create Data)

To test POST requests and see the global `ValidationPipe` in action, we can use the terminal with `curl` (or an API client like Insomnia). Keep the server running in one terminal tab, and use another tab to run these commands:

* **Test A: Sending Invalid Data (Should fail)**

  ```bash
  curl -X POST http://localhost:3000/api/workspaces \
    -H "Content-Type: application/json" \
    -d '{"description": "A workspace without a name"}'
