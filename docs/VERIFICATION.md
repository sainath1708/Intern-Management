# Verification log

Date: 12 November 2026
Environment: Windows, Node.js v24.14.0, npm 11.9.0, MongoDB Atlas (`Cluster0`) with the local in-memory fallback used earlier for baseline checks.

This log records only checks that were actually executed. Deployment checks are listed separately as not performed.

## Repository audit

- Branch: `master`
- Commits: 8 at the start of this phase; existing history preserved and pushed unchanged
- Remote: `origin` → <https://github.com/sainath1708/Intern-Management> (public, default branch `master`)
- Working tree before this phase: clean
- Tracked environment files: `.env.example` only; no `.env`, connection string, JWT secret or password is tracked
- GitHub CLI, Vercel CLI, Render CLI: not installed on this machine
- Atlas, Render and Vercel credentials: not available

## Automated checks

| Check | Command | Result |
| --- | --- | --- |
| Backend integration suite | `npm test` in `server/` | **63/63 passing** across 5 suites |
| Frontend production build | `npm run build` in `client/` | **Success** — 1,697 modules; JS 356.60 kB (108.56 kB gzip), CSS 34.00 kB (6.21 kB gzip) |

## Local runtime checks

- `GET /api/health` returned HTTP 200 with `database.connected = true`.
- Admin login (`admin@qubenix.ai`) returned HTTP 200.
- Intern login (`aarav.sharma@qubenix.ai`) returned HTTP 200.
- Seeded dashboard: 3 interns, 6 tasks, 2 completed, 2 pending, 2 in progress, 3 recent submissions.
- Vite client answered on `http://127.0.0.1:5173`.

## Live end-to-end API workflow

Executed against the running API on the same day; every step passed.

1. Admin login.
2. Health endpoint reports a connected database.
3. Wrong password rejected with 401.
4. Admin creates an intern (User + Intern profile).
5. The new intern signs in successfully.
6. Intern is blocked from the admin intern list (403).
7. Admin creates and assigns a High-priority task.
8. Intern moves the task to In Progress.
9. Intern submits work with a description and GitHub URL.
10. A duplicate submission while awaiting review is rejected (409).
11. Admin requests changes with feedback.
12. Intern sees the feedback on the task.
13. Intern resubmits; attempt 2 is recorded.
14. Admin approves the revised submission.
15. Task becomes Completed automatically.
16. Dashboard totals reflect the new task.
17. Test task cleaned up afterwards.

Test records were created in the temporary in-memory database, which is reset when the API restarts. Seeded demonstration data was left intact.

## Security review performed

- No `.env` files, MongoDB URIs, JWT secrets or production passwords are tracked.
- Login page demo credentials are now opt-in through `VITE_DEMO_*` environment variables and are absent from production builds.
- Production startup fails fast when `MONGODB_URI`, `JWT_SECRET` (32+ chars) or `FRONTEND_URL` is missing, or when the in-memory database is requested.
- Role checks are enforced in services as well as route middleware; intern queries are scoped by the authenticated user.
- CORS allows only configured origins and denies others without throwing.
- `TRUST_PROXY=true` and `TRUST_PROXY=1` both normalise to one trusted proxy hop.
- Passwords are bcrypt-hashed and excluded from serialized responses.
- API errors do not leak stack traces in production.

## Screenshots

Nine genuine captures from the running application are stored in `docs/screenshots/`:

1. Login
2. Admin dashboard
3. Intern management table
4. Intern profile
5. Task management
6. Submissions
7. Submission review modal
8. Intern dashboard
9. Intern task detail with submission form

## MongoDB Atlas verification

- Authentication succeeded against `Cluster0`; the API reported `connected: true` for `qubenix_intern_management`.
- Seed created the admin, 3 interns, 6 tasks and 3 submissions (2 approved, 1 awaiting review).
- Admin and intern logins succeeded against Atlas.
- Intern task scoping returned only the intern's 2 tasks, and the admin intern list returned 403 for the intern token.
- The complete workflow passed against Atlas, including transaction-backed intern creation, request-changes feedback, resubmission and approval.
- Test intern and task were removed afterwards; seeded demonstration data was left intact.
- After a full API restart, counts (3 interns, 6 tasks, 2 completed, 2 pending, 2 in progress, 3 submissions) and both logins persisted.
- Local Node SRV lookups required `DNS_SERVERS=8.8.8.8,1.1.1.1` on this machine; Render does not need this setting.

## Live deployment verification

- Frontend: <https://intern-management-nu.vercel.app> returned HTTP 200 and serves the built SPA.
- API: <https://intern-management-hsf2.onrender.com/api/health> returned HTTP 200 with `environment: production` and `database.connected: true` on `qubenix_intern_management`.
- The deployed JavaScript bundle points to `https://intern-management-hsf2.onrender.com/api`.
- Admin and intern login both returned HTTP 200 on the deployed API.
- CORS preflight from `https://intern-management-nu.vercel.app` returned 204 with the matching allow-origin header.
- The full 18-step workflow passed against the deployed API: login, create intern, role isolation, create/assign task, start, submit, duplicate guard, request changes, feedback, resubmit, approve, complete, dashboard update and cleanup.
- Nine screenshots were recaptured from the deployed application with headless Chrome.

## Not fully verified

- The approval and request-changes buttons were exercised against the live API rather than clicked through in the deployed browser UI, to avoid altering the seeded demonstration records.
- A recorded video demonstration is not included; the script and recording instructions are in `docs/DEMO_SCRIPT.md`.
