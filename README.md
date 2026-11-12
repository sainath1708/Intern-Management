# Qubenix AI — Intern Management System

A full-stack intern management platform for **Qubenix AI Pvt. Ltd.** Administrators onboard interns, assign and track work, review submissions with feedback, and monitor live KPIs. Interns sign in to a scoped workspace where they can start tasks, submit GitHub or document links, and respond to review feedback.

The application is deployed and running in production:

| Service | URL |
| --- | --- |
| Frontend (Vercel) | https://intern-management-nu.vercel.app |
| Backend API (Render) | https://intern-management-hsf2.onrender.com/api |
| API health check | https://intern-management-hsf2.onrender.com/api/health |
| Source code (GitHub) | https://github.com/sainath1708/Intern-Management |

## Live Deployment & Demo Credentials

| Role | Email | Password |
| --- | --- | --- |
| Administrator | `admin@qubenix.ai` | `Admin@12345` |
| Intern | `aarav.sharma@qubenix.ai` | `Intern@12345` |
| Intern | `diya.patel@qubenix.ai` | `Intern@12345` |
| Intern | `rohan.iyer@qubenix.ai` | `Intern@12345` |

These accounts belong to the seeded assessment dataset. Rotate the credentials and the Atlas user before using the system with real data.

## Key Features

### 1. Authentication and Authorization
- Email and password login with bcrypt-hashed passwords.
- JWT access tokens with issuer, audience and expiry validation.
- Server-side role guards for administrators and interns.
- Protected React routes with role-based redirects.
- Expired or invalid sessions are cleared automatically.
- Login rate limiting and generic credential errors prevent abuse and account enumeration.

### 2. Intern Management (CRUD)
- Create an intern with name, email, phone number, department and joining date.
- The login account and intern profile are created together in one operation.
- Search, filter by department or status, and paginate the intern table.
- Edit profile and account details with email synchronisation.
- Safe deletion: interns with task or submission history are archived instead of destroyed.
- Individual intern profile with task statistics and submission history.

### 3. Task Management
- Create tasks with title, description, assignee, deadline and priority.
- Status lifecycle: **Pending → In Progress → Completed**.
- Overdue and due-soon highlighting based on the deadline.
- Filter by status, priority and intern, with text search and pagination.
- Reassignment is blocked once submission history exists, keeping reviews coherent.
- Interns only ever see and update their own assigned tasks.

### 4. Task Submissions and Review
- Interns submit work with a description and at least one GitHub or document URL.
- Submission attempts are versioned, preserving a complete review history.
- Duplicate submissions are blocked while an attempt is awaiting review.
- Administrators approve work or request changes with mandatory feedback.
- Approval marks the task **Completed**; requesting changes keeps it **In Progress**.
- Approved submissions cannot be reviewed again.

### 5. Analytics Dashboard
- Total interns.
- Active interns.
- Total assigned tasks.
- Completed tasks.
- Pending tasks.
- In-progress tasks, overdue tasks and submissions awaiting review.
- Recent submissions and recent task activity.
- All metrics are database-backed and scoped correctly for each role.

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 18, Vite 6, Tailwind CSS 3, React Router 6, Axios, React Context, React Hot Toast, Lucide |
| Backend | Node.js, Express 4 (ES modules), Mongoose 8, JWT, bcryptjs, express-validator |
| Database | MongoDB Atlas |
| Security | Helmet, CORS allow-list, express-rate-limit, express-mongo-sanitize |
| Testing | Vitest, Supertest, mongodb-memory-server |
| Deployment | Vercel (frontend), Render (API), MongoDB Atlas (database) |

## Architecture

```text
Browser (React SPA, Vercel)
        │  Axios + Bearer JWT
        ▼
Express API (Render)
        │  Helmet · CORS · rate limiting · JWT auth · role guards · validation
        ▼
Controllers → Services (business rules) → Mongoose models
        │
        ▼
MongoDB Atlas (replica set, transaction support)
```

Business rules live in the service layer, so authorization and workflow constraints are enforced regardless of which route or client calls the API.

## Project Structure

```text
intern-management/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── interns/
│   │   │   ├── layout/
│   │   │   ├── submissions/
│   │   │   ├── tasks/
│   │   │   └── ui/
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── layouts/
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── auth/
│   │   │   └── intern/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── vercel.json
│   └── package.json
├── server/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── seed/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── validators/
│   │   ├── app.js
│   │   └── server.js
│   ├── tests/
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── screenshots/
│   ├── DEMO_SCRIPT.md
│   └── VERIFICATION.md
├── render.yaml
├── package.json
└── README.md
```

## Local Setup

**Prerequisites:** Node.js 18.18 or newer, npm, and a MongoDB Atlas cluster (or the built-in in-memory demo database).

```bash
git clone https://github.com/sainath1708/Intern-Management.git
cd Intern-Management
npm install
npm run install:all
```

Create the environment files:

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Configure `server/.env` with your Atlas connection string and a strong JWT secret, then start both applications:

```bash
npm run dev
```

| Service | Local URL |
| --- | --- |
| Frontend | http://localhost:5173 |
| API | http://localhost:5000/api |
| Health check | http://localhost:5000/api/health |

To seed an Atlas database:

```bash
npm run seed
```

For a quick local demo without Atlas, set `USE_IN_MEMORY_DB=true` in `server/.env`. The API starts an in-memory MongoDB, seeds demo data automatically, and resets on restart. This option is rejected when `NODE_ENV=production`.

## Environment Variables

### `server/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `NODE_ENV` | Yes | `development`, `production` or `test` |
| `PORT` | No | API port (defaults to `5000`; Render supplies its own) |
| `MONGODB_URI` | Yes | MongoDB Atlas connection string including the database name |
| `USE_IN_MEMORY_DB` | No | `true` enables the temporary local demo database |
| `JWT_SECRET` | Yes in production | At least 32 characters |
| `JWT_EXPIRES_IN` | No | Token lifetime (defaults to `1d`) |
| `FRONTEND_URL` | Yes in production | Allowed browser origins, comma separated |
| `ADMIN_NAME` | Seed only | Administrator display name |
| `ADMIN_EMAIL` | Seed only | Administrator email |
| `ADMIN_PASSWORD` | Seed only | Administrator password (minimum 8 characters) |
| `SEED_INTERN_PASSWORD` | Seed only | Password assigned to seeded demo interns |
| `TRUST_PROXY` | No | Proxy hops; accepts `true`, `false` or a number |
| `DNS_SERVERS` | No | Custom resolvers for networks that cannot resolve Atlas SRV records |

### `client/.env`

| Variable | Required | Description |
| --- | --- | --- |
| `VITE_API_URL` | Yes | API base URL including `/api` |
| `VITE_DEMO_ADMIN_EMAIL` | No | Optional local login shortcut |
| `VITE_DEMO_ADMIN_PASSWORD` | No | Optional local login shortcut |
| `VITE_DEMO_INTERN_EMAIL` | No | Optional local login shortcut |
| `VITE_DEMO_INTERN_PASSWORD` | No | Optional local login shortcut |

The `VITE_DEMO_*` values are blank in the example file and must remain unset in production. No secrets, connection strings or real credentials are committed to the repository.

## API Endpoints

All endpoints are prefixed with `/api`.

| Method | Endpoint | Access | Description |
| --- | --- | --- | --- |
| `GET` | `/health` | Public | API and database health |
| `POST` | `/auth/login` | Public | Authenticate and receive a JWT |
| `GET` | `/auth/me` | Authenticated | Current user and intern profile |
| `GET` | `/interns` | Admin | List interns with search, filters and pagination |
| `POST` | `/interns` | Admin | Create an intern and linked login account |
| `GET` | `/interns/:id` | Admin | Intern profile, task statistics and history |
| `PUT` | `/interns/:id` | Admin | Update intern and account details |
| `DELETE` | `/interns/:id` | Admin | Delete or archive an intern |
| `GET` | `/tasks` | Admin / Intern | List tasks (interns receive only their own) |
| `GET` | `/tasks/:id` | Admin / Intern | Task details and submission history |
| `POST` | `/tasks` | Admin | Create and assign a task |
| `PUT` | `/tasks/:id` | Admin | Update task details |
| `DELETE` | `/tasks/:id` | Admin | Delete a task and its submissions |
| `PATCH` | `/tasks/:id/status` | Intern | Move an assigned task to In Progress |
| `POST` | `/tasks/:id/submissions` | Intern | Submit work with description and links |
| `GET` | `/submissions` | Admin | List submissions with filters and summary counts |
| `PATCH` | `/submissions/:id/review` | Admin | Approve or request changes with feedback |
| `GET` | `/dashboard/stats` | Authenticated | Admin KPIs or intern-scoped summary |

## Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Run API and frontend together |
| `npm run dev:server` | Run the API with nodemon |
| `npm run dev:client` | Run the Vite dev server |
| `npm run build` | Build the production frontend |
| `npm start` | Start the API in production mode |
| `npm run seed` | Seed the database idempotently |
| `npm test` | Run the backend integration suite |

## Testing and Verification

```bash
npm test
npm run build
```

- **63 integration tests** pass across authentication, interns, tasks, submissions and dashboard analytics.
- The production frontend build completes without errors.
- The deployed API, admin login, intern login, role isolation, CORS, and the full create → assign → submit → request changes → resubmit → approve workflow were verified against the live Render and Atlas services.
- Nine screenshots from the deployed application are available in [`docs/screenshots/`](docs/screenshots/).
- Detailed results are recorded in [`docs/VERIFICATION.md`](docs/VERIFICATION.md).
- A recording guide and narration script are in [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md).

## Deployment

### Backend — Render

The repository contains [`render.yaml`](render.yaml):

- Root directory: `server`
- Build command: `npm install`
- Start command: `npm start`
- Health check: `/api/health`
- Secrets (`MONGODB_URI`, `JWT_SECRET`, `FRONTEND_URL`, admin seed values) are configured in the Render dashboard and never committed.

### Frontend — Vercel

The repository contains [`client/vercel.json`](client/vercel.json):

- Root directory: `client`
- Framework: Vite
- Output directory: `dist`
- SPA rewrite to `index.html` for client-side routes
- `VITE_API_URL` points to the Render API

### Database — MongoDB Atlas

Atlas provides the production replica set. Network access is restricted through Atlas, and the API requires a valid connection before it starts in production.

## Security

- Passwords are hashed with bcrypt and never returned in API responses.
- JWTs are signed, expire after one day, and validate issuer and audience.
- Role and resource checks are enforced in the service layer.
- Helmet security headers, a CORS allow-list and request rate limiting are enabled.
- Inputs are validated and sanitised; MongoDB operator injection is blocked.
- Production startup fails fast when required configuration is missing or weak.
- `.env` files and secrets are git-ignored; only `.env.example` files are committed.

## Screenshots

### Login

![Login](docs/screenshots/01-login.png)

### Admin workspace

![Admin dashboard](docs/screenshots/02-admin-dashboard.png)

![Intern management](docs/screenshots/03-intern-management.png)

![Intern profile](docs/screenshots/04-intern-profile.png)

![Task management](docs/screenshots/05-task-management.png)

![Submissions](docs/screenshots/06-submissions.png)

![Review submission](docs/screenshots/07-review-modal.png)

### Intern workspace

![Intern dashboard](docs/screenshots/08-intern-dashboard.png)

![Intern task detail](docs/screenshots/09-intern-task-detail.png)

## Known Limitations

- Access tokens are stored in `localStorage`; a higher-security deployment should use httpOnly cookies with CSRF protection.
- There is no password reset or administrator password-reset flow.
- Submissions accept links to external work rather than file uploads.
- Notifications are in-app only; no email delivery is configured.
- Rate limiting is in-memory and applies per API instance.
- The Render free tier may sleep after inactivity, so the first request can take several seconds.

## Development Environment and AI Tools

The application was developed in **Visual Studio Code (VS Code)** with assistance from **Claude** and **Gemini** during architecture planning, development, and production deployment.
