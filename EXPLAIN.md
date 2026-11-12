# EXPLAIN.md — Qubenix AI Intern Management System

This document explains how the system works, file by file, in beginner-friendly language. It reflects the actual implementation in this repository, so every answer can be defended in a technical interview.

---

## 1. Project architecture

The project is a **client–server application** split into two deployable apps:

- `client/` — a React single-page application built with Vite. It renders the UI, keeps the signed-in user in context, and talks to the API over HTTP.
- `server/` — an Express REST API that owns all business rules and stores data in MongoDB through Mongoose.

The frontend never talks to MongoDB directly and never decides permissions on its own. Every protected action is authorized again on the server.

Layers on the server:

1. **Routes** (`server/src/routes`) map HTTP verbs and paths to controllers and attach validation and role middleware.
2. **Controllers** (`server/src/controllers`) read the request, call a service and format the response. They contain very little logic.
3. **Services** (`server/src/services`) hold the business rules: task transitions, submission eligibility, review outcomes, safe deletion, dashboard counts.
4. **Models** (`server/src/models`) define MongoDB schemas, validation and indexes.
5. **Utilities** (`server/src/utils`) provide the response envelope, error class, serializers, pagination and JWT helpers.

This separation is why the same rules can be tested directly through the API without duplicating them in the UI.

---

## 2. Frontend-to-backend request flow

Example: an admin opens the Interns page.

1. `InternsPage` calls `listInterns({ search, department, status, page })` from `client/src/services/internService.js`.
2. That service calls the shared Axios instance in `client/src/services/api.js`.
3. The request interceptor reads the JWT from `localStorage` and adds `Authorization: Bearer <token>`.
4. Axios sends `GET /api/interns?...` to `VITE_API_URL`.
5. Express runs Helmet, CORS, JSON parsing, Mongo sanitization and the global rate limiter, then reaches the interns router.
6. `authenticate` verifies the token and loads the user; `authorize('admin')` checks the role.
7. `listInternsValidation` + `validate` reject bad query parameters.
8. `internController.getInterns` calls `internService.listInterns`.
9. The service builds a Mongo filter, runs `find` and `countDocuments` in parallel, and maps results through `internDTO`.
10. The controller returns `{ success, message, data: { items, pagination } }`.
11. The page stores the result in state and renders the table. Errors are converted into a readable message by the response interceptor and shown in an `ErrorState`.

---

## 3. Admin login flow

1. The admin enters email and password on `/login`.
2. `validateLogin` performs client-side checks.
3. `AuthContext.login` calls `loginRequest` → `POST /api/auth/login`.
4. The server validates the body, then `authService.login` looks up the user **including the password hash** (`select('+passwordHash')`), because hashes are hidden by default.
5. bcrypt compares the submitted password with the hash.
6. Inactive users and interns without an active profile are rejected.
7. The server signs a JWT and returns `{ token, user }`.
8. The context stores the token and user in `localStorage` and state.
9. `LoginPage` redirects to `/admin` (or the originally requested route, if it belongs to the user's role).

No password hash is ever included in the response: the serializer builds an explicit user object.

---

## 4. JWT generation and verification

Generation (`server/src/utils/token.js`):

```js
jwt.sign({ sub: user._id.toString(), role: user.role }, env.jwtSecret, {
  expiresIn: env.jwtExpiresIn,     // default 1d
  issuer: 'qubenix-intern-management',
  audience: 'qubenix-web-client',
});
```

The payload intentionally contains no password or personal data. The `sub` claim is the user id; the token proves identity, not authority — authority is always re-read from the database.

Verification happens in `server/src/middleware/auth.js`:

- Extract the token from `Authorization: Bearer ...`.
- `jwt.verify` checks signature, expiry, issuer and audience.
- Expired tokens get a specific 401 message; malformed/forged tokens get a generic one.
- The user is reloaded so deactivated accounts lose access immediately, even with a valid token.

---

## 5. Protected routes (frontend)

- `ProtectedRoute` checks `AuthContext`:
  - while the stored session is being re-validated it shows a full-page loader;
  - if there is no session it redirects to `/login` and remembers the intended path in router state;
  - otherwise it renders the dashboard layout.
- On page refresh, `AuthContext` sees a stored token and calls `GET /api/auth/me`. A valid token keeps the user signed in; an invalid/expired one clears the session. This is why refresh does not break navigation.
- `RoleRoute` redirects users away from the other role's pages (e.g. an intern visiting `/admin`).

These guards improve UX, but the server independently enforces every rule.

---

## 6. Role-based authorization (backend)

`authorize(...roles)` is a small middleware:

```js
export const authorize = (...roles) => (req, _res, next) => {
  if (!req.user) return next(ApiError.unauthorized());
  if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
  return next();
};
```

Usage:

- Intern management router: `router.use(authenticate, authorize(ROLES.ADMIN))`.
- Task routes: read endpoints open to both roles; create/update/delete `authorize(ROLES.ADMIN)`; status update `authorize(ROLES.INTERN)`.
- Submission review router: admin only.
- Submission creation lives under tasks and is intern-only.

Resource-level authorization is separate and lives in services. For example, `updateTaskStatusAsIntern` compares `task.assignedTo` with `req.intern._id`. A role check alone cannot prevent intern A from touching intern B's task.

---

## 7. Creating an intern

`POST /api/interns` → `internController.postIntern` → `internService.createIntern`.

Steps:

1. Normalize the email and reject it if a `User` already exists (409).
2. Hash the password with bcrypt (12 rounds).
3. Start `withTransaction`:
   - create the `User` with `role: 'intern'` and the hash;
   - create the `Intern` profile with `user: user._id`;
   - return the profile.
4. Map the profile through `internDTO`.
5. If anything fails, delete the created user (`User.deleteOne`) so no orphan login account can exist.

Why the fallback? MongoDB transactions require a replica set. Atlas provides one, but a standalone local MongoDB does not. `withTransaction` detects the specific "transactions unsupported" error and runs the work without a session; the compensating delete then provides the same invariant. Duplicate-key errors are converted to 409.

The response includes the intern profile but never the password or hash.

---

## 8. Creating and assigning a task

`POST /api/tasks` (admin only):

1. Validation (`createTaskValidation`) checks title length, description length, intern id, priority enum and a valid ISO deadline, including "deadline cannot be in the past".
2. `taskService.createTask` re-checks the deadline (server-side defense in depth).
3. `findAssignableIntern` ensures the intern exists, is not archived and has `status: 'active'`.
4. The task is created with `status: 'Pending'`, `createdBy: req.user._id` and the selected `assignedTo`.
5. The response populates the intern (`name`, `email`, `department`, `status`) so the table can render immediately.

The UI (`TaskFormModal`) mirrors these validations and only lists active interns.

---

## 9. Intern updating task status

Endpoint: `PATCH /api/tasks/:id/status`, accessible to interns only.

`updateTaskStatusAsIntern`:

1. Validates the task id, loads the task (404 if missing).
2. Rejects the request if `task.assignedTo` is not the signed-in intern (403).
3. Rejects `Completed` with a clear message: completion only happens through admin approval.
4. Rejects reopening a completed task.
5. Moves a Pending task to In Progress (idempotent if already there).
6. Saves and returns the updated task.

This prevents the classic bypass where a client calls the API directly to mark work complete.

---

## 10. Submitting work

Endpoint: `POST /api/tasks/:id/submissions` (intern only, rate limited).

`submissionService.createSubmission`:

1. Loads the task; 404 if it does not exist.
2. Rejects submission if the task belongs to another intern (403).
3. Rejects submission if the task is already Completed.
4. Looks at the latest submission: if it is still `Submitted`, the intern must wait for review (409). This stops duplicate pending attempts.
5. Calculates `attempt = count + 1`.
6. Creates the submission with `reviewStatus: 'Submitted'`, the task, the intern, description and links.
7. Ensures the task status is `In Progress` (a Pending task becomes In Progress when work is submitted).
8. Returns the populated submission.

Validation requires a description (10–4000 characters) and **at least one** valid HTTP/HTTPS link (GitHub or document). Empty strings are normalized, and URLs are validated on both client and server.

---

## 11. Admin reviewing work

Endpoint: `PATCH /api/submissions/:id/review`, admin only.

Request: `{ reviewStatus: 'Approved' | 'Needs Changes', adminFeedback?: string }`.

`reviewSubmission`:

1. Loads the submission; 404 if missing.
2. Refuses to review an already approved submission (409), preserving final decisions.
3. If `Needs Changes`, requires at least 10 characters of trimmed feedback.
4. Loads the linked task.
5. In a transaction:
   - updates `reviewStatus`, `adminFeedback`, `reviewedBy`, `reviewedAt`;
   - **Approved** → task `Completed` + `completedAt`;
   - **Needs Changes** → task stays `In Progress`, `completedAt` cleared.
6. Returns the populated submission and the task's new status.

The modal shows a confirmation step before either action so an accidental click cannot change a task's state.

---

## 12. MongoDB relationships

- `User` 1—1 `Intern`: `Intern.user` is a unique ObjectId reference. One login per profile.
- `Intern` 1—N `Task`: `Task.assignedTo`.
- `User` (admin) 1—N `Task`: `Task.createdBy`.
- `Task` 1—N `Submission`: every attempt is a new document, giving full history.
- `Intern` 1—N `Submission`: `Submission.intern` records who submitted.
- `User` 1—N `Submission` (reviewer): optional `reviewedBy`.

References are stored as ObjectIds; the API populates only what a screen needs (e.g. submissions populate task title/status and intern name/email/department). This keeps payloads small and avoids leaking unrelated data.

---

## 13. Mongoose schemas

**User** (`server/src/models/User.js`)

- `name`, `email` (unique, lowercase), `passwordHash` (`select: false`), `role` enum, `isActive`.
- Instances get `setPassword` and `verifyPassword` methods so hashing never happens accidentally in controllers.

**Intern** (`server/src/models/Intern.js`)

- `user` (unique ref), `name`, `email`, Indian phone validation, `department` enum, `joiningDate`, `status` enum, `deletedAt` for archival.
- Indexes for name/email and department+status searches.

**Task**

- `title`, `description`, `assignedTo`, `deadline`, `priority` enum, `status` enum, `createdBy`, `completedAt`.
- Compound indexes for intern+status and status+priority.

**Submission**

- `task`, `intern`, `description`, `githubUrl`, `documentUrl`, `submittedAt`, `reviewStatus` enum, `adminFeedback`, `reviewedBy`, `reviewedAt`, `attempt`.
- URL validators; indexes for task history and review queues.

`toJSON` transforms rename `_id` to `id` and delete `passwordHash`/`__v` as a second line of defense behind the serializers.

---

## 14. Password hashing

- `bcryptjs` hashes with a cost factor of 12 (`env.bcryptRounds`).
- A salt is generated automatically and embedded in the hash; identical passwords produce different hashes.
- Login compares with `bcrypt.compare`, which is constant-time with respect to the hash.
- Failed logins return the same message for unknown email and wrong password, so accounts cannot be enumerated.
- The hash field is excluded from queries by default and deleted from JSON, so it cannot leak through a forgotten `select`.

bcrypt is deliberately slow: that is what makes offline brute-force attacks expensive.

---

## 15. Middleware

- `authenticate` — verifies the JWT, loads the user, rejects inactive accounts, attaches `req.user` and `req.intern`.
- `authorize` — role gate.
- `validate` — converts express-validator errors into a 400 with `{ field, message }` entries.
- `errorHandler` — central error mapper (see section 16).
- `notFoundHandler` — 404 for unknown routes.
- `loginLimiter` — 12 failed attempts / 15 minutes per IP; successful logins do not consume quota.
- `submissionLimiter` — limits submission spam.
- Global limiter — 600 requests / 15 minutes per IP, with `429` responses.
- `asyncHandler` — catches rejected promises so an async error cannot crash the process.
- `express-mongo-sanitize` — removes `$`/`.` operators from user input, blocking NoSQL injection.
- `helmet` — security headers; `cors` — origin allow-list from `FRONTEND_URL`.

---

## 16. Error handling

Services throw `ApiError` with a status code and optional field errors. The central handler:

1. Uses `error.statusCode` when present.
2. Maps Mongoose `ValidationError` → 400 with field messages.
3. Maps `CastError` → 400.
4. Maps duplicate key (`11000`) → 409 with a friendly email message.
5. Maps malformed JSON → 400.
6. Logs 5xx errors and, in production, replaces the message with a generic one and hides stack traces.

Every error response uses the same shape:

```json
{ "success": false, "message": "…", "errors": [{ "field": "email", "message": "…" }] }
```

Status codes used: 200, 201, 400, 401, 403, 404, 409, 429, 500, 503 (health when the DB is down).

---

## 17. Frontend API services

`client/src/services/api.js` creates one Axios instance:

- `baseURL` from `VITE_API_URL`;
- request interceptor adds the bearer token;
- response interceptor converts failures into `ApiClientError` with `status` and `errors`, clears the session on 401 and emits a `qubenix:unauthorized` event that `AuthContext` listens to.

Feature services (`authService`, `internService`, `taskService`, `submissionService`, `dashboardService`) each expose small functions and return `response.data.data`. Components never build URLs themselves, so API changes happen in one place.

`params.js` removes empty filters so the API does not receive meaningless query parameters.

---

## 18. React state management

- **Server state** is fetched per page with local state (`data`, `loading`, `error`) inside `useEffect`, and refreshed after mutations. This keeps the assessment dependency-light and explicit.
- **Session state** lives in `AuthContext`, exposed through `useAuth()`. It hydrates from `/auth/me` on refresh and clears itself on token expiry.
- **UI state** (modals, filters, confirmation steps) is local to components.
- URL query parameters seed initial filters (e.g. `/admin/tasks?status=Pending`), so dashboard links land on filtered tables.
- Toasts communicate success and failure without blocking the UI.

---

## 19. Validation

**Backend** (authoritative): express-validator chains plus Mongoose schema validation. Examples: email format, password complexity, Indian mobile pattern, department enum, priority/status enums, future deadline, URL protocol, 10-character minimum feedback, pagination bounds.

**Frontend** (UX): `client/src/utils/validation.js` mirrors the important rules so users get immediate feedback without a round trip. The submit handlers stop on client errors, but the server remains the source of truth.

**Consistency:** both layers use the same departments/statuses/priorities from shared constants, so the UI cannot submit values the API rejects.

---

## 20. Security decisions

- Passwords hashed with bcrypt; hashes excluded from queries and responses.
- JWT with signature, expiry, issuer and audience checks.
- Server-side role and resource authorization on every protected route.
- Helmet security headers, CORS origin allow-list, rate limits on login and submissions.
- Input validation and sanitization; Mongo operator sanitization against NoSQL injection.
- Generic login errors to prevent account enumeration.
- No secrets in the repository: only `.env.example` files; `.env` is git-ignored.
- Production fail-fast for missing/weak configuration, including a missing `FRONTEND_URL` (otherwise the deployed SPA would be blocked by CORS).
- Login page demo shortcuts are opt-in through `VITE_DEMO_*` variables and are absent from production builds; administrator credentials are never hardcoded in the bundle.
- Safe deletion preserves audit history.
- Errors do not expose stack traces or driver details in production.

Known trade-off: the JWT is stored in `localStorage`, which is readable by JavaScript. httpOnly cookies with CSRF protection would be stronger for a high-security product; for this assessment, the simpler approach is documented and acceptable.

---

## 21. Deployment architecture

- **Frontend:** Vercel serves the static Vite build; `vercel.json` rewrites SPA routes to `index.html` and caches hashed assets. `VITE_API_URL` points at Render.
- **Backend:** Render runs `npm install` and `npm start` in `server/`, exposes the API over HTTPS and checks `/api/health`. `TRUST_PROXY=1` (or `true`) lets Express and rate limiting see the real client IP; the configuration parser accepts either form and normalises it to one proxy hop.
- **Database:** MongoDB Atlas provides the replica set (transactions work) and network access is restricted to the API.
- **CORS:** Render's `FRONTEND_URL` must exactly match the Vercel origin, or the browser will block requests.

The repository contains `render.yaml` and `client/vercel.json`. Deployment itself requires accounts and secrets, so it has not been performed here.

---

## 22. Testing strategy

- **Tooling:** Vitest + Supertest + mongodb-memory-server. Each test file starts an isolated in-memory MongoDB, so tests never touch Atlas.
- **Real HTTP:** requests go through the actual Express app, middleware and MongoDB, not mocked services.
- **Fixtures:** `tests/factories.js` creates admins, interns and tasks directly in the database; tokens come from the real login endpoint.
- **Coverage:** authentication and token edge cases, role restrictions, CRUD validation, task transitions, the entire submission/review/resubmission loop, safe deletion, dashboard counts, and rate limiting.
- **Result:** 63 tests across 5 suites, all passing.
- **Build:** the frontend production build is verified after every significant change.

What is not automated: browser end-to-end tests. UI verification was manual (login, dashboards, tables, modals). The API behavior behind those screens is covered.

---

## 23. Important trade-offs and limitations

| Decision | Why | Trade-off |
| --- | --- | --- |
| Service layer + DTOs | Clear rules, stable responses, no leaks | More files than a minimal demo |
| Transactions with fallback | Works on Atlas and standalone MongoDB | Fallback is not atomic under extreme concurrency |
| Archive-on-delete | Preserves history | Archived interns still exist in the database |
| Duplicate-submission guard | Prevents noisy review queues | Intern must wait for feedback before resubmitting |
| Cascade task deletion | Task without submissions is meaningless | Review history is lost if a task is deleted |
| localStorage JWT | Simple, assessment-appropriate | XSS-readable; cookies would be safer |
| In-memory dev DB | Runs without Atlas credentials | Data is not persistent |
| No refresh tokens | Small scope, 1-day expiry | Users must sign in again after expiry |
| No password reset | Out of scope | Admin cannot reset a forgotten intern password |
| URL links instead of uploads | No file storage dependency | Interns host files elsewhere |

---

# 20 Likely Interview Questions & Answers

### 1. Why did you choose this project architecture?

It separates concerns: React owns presentation and session UX, Express owns the API and all rules, and MongoDB owns persistence. Inside the server, routes handle HTTP, controllers coordinate, services enforce business rules, and models define data constraints. This made the workflow testable through real HTTP requests and keeps authorization in one place instead of scattered across components.

### 2. How does the frontend talk to the backend?

Through a single Axios instance (`client/src/services/api.js`) whose base URL comes from `VITE_API_URL`. A request interceptor adds the JWT, and a response interceptor normalizes errors and clears expired sessions. Feature services wrap each endpoint and return only `data.data`, so components never construct URLs or duplicate API logic.

### 3. Walk me through admin login.

The form validates input, calls `POST /api/auth/login`, and the server fetches the user with `+passwordHash`, compares with bcrypt, rejects deactivated accounts and inactive intern profiles, then signs a JWT. The client stores the token and user, redirects by role, and re-validates the token via `/auth/me` on refresh.

### 4. How does JWT authentication work here?

Tokens carry `sub` and `role`, expire in one day, and include an issuer and audience. The auth middleware verifies all four, reloads the user from MongoDB, and rejects missing, invalid, expired, forged or deactivated-account tokens with 401/403. The role in the token is never trusted for permissions; roles are re-read from the database.

### 5. Authentication vs authorization in this app?

Authentication proves who you are (login, JWT verification, loading the user). Authorization decides what you may do: role guards on routes, plus resource checks like "is this task assigned to the signed-in intern?" Both exist on the server; frontend guards are only for UX.

### 6. How do you prevent an intern from accessing another intern's task?

Two layers. `GET /api/tasks` forces `filter.assignedTo = req.intern._id`, ignoring any `internId` query parameter from interns. `GET /api/tasks/:id`, status updates and submissions compare the task's `assignedTo` with `req.intern._id` and return 403 on mismatch. Submission listing and review endpoints are admin-only.

### 7. How is a task created and assigned?

`POST /api/tasks` is admin-only. Validation requires title, description, an intern id, a future deadline and a valid priority. The service confirms the intern exists, is not archived and is active, then stores the task as Pending with `createdBy` set to the admin. The response populates the intern so the UI updates immediately.

### 8. How does the task status workflow work?

New tasks are Pending. Interns can only move their own Pending task to In Progress; they cannot set Completed. Submitting work also ensures In Progress. Only an admin approval changes a task to Completed (and sets `completedAt`). Requesting changes keeps it In Progress. Admins can also edit status directly through the admin task form.

### 9. Why can't interns mark tasks completed?

Completion is a review outcome, not a self-assessment. The service explicitly rejects `Completed` from interns with 403, and the database state is only changed by the admin review service. This prevents unverified work from inflating dashboard metrics.

### 10. Explain the submission and review flow.

An assigned intern submits a description plus at least one valid link. The server rejects submissions for completed tasks, tasks owned by someone else, or while an earlier attempt is awaiting review. It creates a new `Submission` with `reviewStatus: 'Submitted'` and attempt number. The admin approves (task Completed) or requests changes with mandatory feedback (task stays In Progress). The intern sees the feedback, resubmits as a new attempt, and all attempts remain in history.

### 11. How do you model the database relationships?

`Intern.user` is a unique reference to `User`. `Task.assignedTo` references an Intern and `createdBy` references an admin User. `Submission.task` and `Submission.intern` reference their parents, and `reviewedBy` references the reviewing admin. One task has many submissions, which is what makes resubmission history possible. Populate is used selectively.

### 12. Why store submissions instead of one submission per task?

History matters: reviewers need to see previous feedback and what changed. A new document per attempt keeps an immutable audit trail, supports attempt numbers, and avoids overwriting the reviewer's earlier decision. The unique "one user ↔ one intern" rule, by contrast, is enforced with a unique index.

### 13. How does password hashing work and why bcrypt?

bcrypt salts and hashes with a configurable cost (12 here). Salts make rainbow tables useless; the cost makes brute force slow. `passwordHash` is `select: false`, DTOs never include it, and `toJSON` removes it as a second safeguard. I used `bcryptjs` (the same bcrypt algorithm in pure JavaScript) to avoid native build tooling on Windows.

### 14. What happens when intern creation fails halfway?

`createIntern` uses `withTransaction`. On Atlas, both writes commit or roll back together. On a standalone MongoDB that does not support transactions, the helper detects that specific error and runs the work without a session; if the Intern profile fails, the service deletes the just-created User. Either way there is no login account without a profile.

### 15. How does centralized error handling work?

Services throw `ApiError` with a status and optional field errors. `errorHandler` maps Mongoose validation, cast and duplicate-key errors into 400/409, logs 5xx errors, and hides internals in production. Every error uses `{ success: false, message, errors }`, which the frontend interceptor converts into a readable message for toasts and alerts.

### 16. What security measures are implemented?

Helmet headers, a CORS allow-list from `FRONTEND_URL`, bcrypt hashing, JWT with issuer/audience checks, role and resource authorization, express-validator, Mongo operator sanitization, login and submission rate limits, no password hashes in responses, generic login errors, environment-based secrets, fail-fast production config and safe deletion. Frontend checks are never the only defense.

### 17. How do you prevent NoSQL injection?

Two things: `express-mongo-sanitize` strips `$` and `.` operators from request input, and query filters are built from validated enums and known fields rather than passing `req.query` directly to Mongoose. Search terms are escaped before becoming regular expressions, so a crafted pattern cannot alter query semantics.

### 18. How is the dashboard kept accurate?

`GET /api/dashboard/stats` computes counts directly from MongoDB with `countDocuments` and status filters, plus recent submissions and tasks with populate. There is no cached or hardcoded data. Tests assert the six required metrics against records created in the test database. Interns get a separate scoped summary from the same endpoint.

### 19. How did you test the API?

Vitest + Supertest against the real Express app and an isolated in-memory MongoDB per test file. Fixtures create users and tasks directly, but authentication always goes through the login endpoint. The 63 tests cover login edge cases, expired and forged tokens, role restrictions, intern CRUD, duplicate emails, task validation and transitions, the full submission/review/resubmission loop, safe deletion, dashboard counts and rate limiting.

### 20. What would you improve before production?

I would move tokens to httpOnly cookies with refresh rotation and CSRF protection, add password reset and email notifications, use a shared rate-limit store (Redis) for multiple instances, add structured logging/monitoring and CI, add browser end-to-end tests, clean up expired submissions/archived data policies, and add pagination indexes based on real query patterns. I would also configure Atlas backups and tighter network rules.

---

## File map — where to look

| File | Responsibility |
| --- | --- |
| `server/src/app.js` | Express app, security middleware, route mounting |
| `server/src/server.js` | Startup, DB connection, optional demo DB + auto-seed, graceful shutdown |
| `server/src/config/env.js` | Environment loading and production validation |
| `server/src/config/db.js` | Mongoose connect/disconnect/status |
| `server/src/middleware/auth.js` | JWT authentication + role guard |
| `server/src/middleware/errorHandler.js` | Central error mapping |
| `server/src/services/internService.js` | Intern CRUD, atomic account creation, safe deletion |
| `server/src/services/taskService.js` | Task rules, scoping, status transitions |
| `server/src/services/submissionService.js` | Submission eligibility, review outcomes |
| `server/src/services/dashboardService.js` | Real metric aggregation |
| `server/src/utils/serializers.js` | Response DTOs (no hashes, stable ids) |
| `client/src/services/api.js` | Axios instance, JWT injection, error normalization |
| `client/src/context/AuthContext.jsx` | Session hydration, login/logout, unauthorized handling |
| `client/src/routes/AppRoutes.jsx` | Route map and guards |
| `client/src/pages/admin/SubmissionsPage.jsx` | Review queue UI |
| `client/src/components/submissions/ReviewModal.jsx` | Approve / request changes with confirmation |
| `client/src/pages/intern/InternTaskDetailPage.jsx` | Task brief, feedback, submission history |

This document is intentionally implementation-specific: every claim maps to code in this repository.
