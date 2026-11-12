# Qubenix AI — Intern Management System

## Video demonstration script (3–5 minutes)

Record the real application only. Do not use mockups or edited screenshots for the workflow.

**Before recording**

1. Start the API and client from the project root:
   ```powershell
   npm run dev
   ```
2. Open `http://localhost:5173` and confirm the seeded demo data is present (3 interns, 6 tasks, 3 submissions).
3. Close unused browser tabs, hide bookmarks, and use a 1280–1440 px wide window.
4. Record at 1080p with OBS Studio, Loom or Windows Game Bar (`Win + G`). Use a microphone if available.
5. Sign out before recording so the video starts on the login page.

**Demo accounts (local demo database only)**

| Role | Email | Password |
| --- | --- | --- |
| Admin | `admin@qubenix.ai` | `Admin@12345` |
| Intern | `aarav.sharma@qubenix.ai` | `Intern@12345` |

---

## Narration and actions

### 0:00–0:20 — Introduction

**Show:** Login page.

**Say:**
> "This is the Qubenix AI Intern Management System, a full-stack technical assessment built with React, Vite and Tailwind on the frontend, and Node.js, Express and MongoDB with Mongoose on the backend. Administrators manage interns, tasks and reviews; interns work inside a scoped workspace. Authentication uses JWT with bcrypt-hashed passwords."

### 0:20–0:50 — Admin login and dashboard

**Do:** Click **Admin demo** → **Sign in**. Wait for the dashboard.

**Show:** Total interns, active interns, total tasks, completed, pending, in progress, recent submissions, task activity.

**Say:**
> "Signing in as the administrator redirects to the dashboard. Every number is a live database count: three interns, six tasks, two completed, two pending and two in progress. Recent submissions and the review queue are visible without leaving the page."

### 0:50–1:20 — Intern creation

**Do:** Open **Interns** → **Add intern**. Create a test intern, for example:

- Name: `Demo Candidate`
- Email: `demo.candidate@qubenix.ai`
- Department: `Engineering`
- Joining date: today
- Password: `Demo@12345`

Submit, then point at the new row.

**Say:**
> "Creating an intern also creates the linked login account in the same operation, with the password hashed before storage. The new intern can sign in immediately; there is no separate account setup step."

### 1:20–1:50 — Task assignment

**Do:** Open **Tasks** → **Create task**. Assign it to the new intern with a High priority and a near deadline. Save, then show it as Pending.

**Say:**
> "Tasks carry an owner, priority and deadline. The list highlights overdue and due-soon work, and the server blocks reassignment once a task already has submission history so the review trail stays coherent."

### 1:50–2:30 — Intern login and task submission

**Do:** Sign out. Click **Intern demo** → **Sign in** (or use the new intern's credentials). Open the assigned task → **Start working** → change status to In Progress → submit a description and a valid URL. Show the awaiting-review state.

**Say:**
> "The intern only sees their own tasks: the API filters by the authenticated user, not by a client-supplied ID. They move the task to In Progress and submit work with a description plus at least one link. The task stays In Progress while the attempt is waiting for review, and a second submission is blocked until that attempt is resolved."

### 2:30–3:10 — Admin submission review

**Do:** Sign out, sign back in as admin, open **Submissions**. Open the new attempt → **Request changes** with feedback such as: "Please add the API test output and link the pull request."

**Say:**
> "The admin reviews the description and links, then either approves or requests changes. Requesting changes requires written feedback and keeps the task In Progress. Approving would mark the task Completed and record the reviewer and timestamp."

### 3:10–3:40 — Feedback and resubmission

**Do:** Sign out, sign in as the intern, open the task, show the feedback and submission history. Resubmit with an updated description and link.

**Say:**
> "Feedback is attached to the attempt, and the intern sees the full submission history rather than a single mutable record. After revising the work they resubmit, creating a second attempt."

### 3:40–4:00 — Final approval and dashboard update

**Do:** Sign out, sign in as admin, open **Submissions** → **Approve submission**. Show the task marked Completed and return to the dashboard to show updated counts.

**Say:**
> "Approving the revised attempt completes the task and updates the dashboard metrics. Every step was driven by the real API against MongoDB, with role checks and validation enforced on the server, not only in the interface."

### 4:00–4:15 — Close

**Say:**
> "The project includes automated integration tests, deployment configuration for Render and Vercel, and documentation for setup, architecture and environment variables. Thank you for reviewing it."

---

## Recording checklist

- [ ] Browser starts on the login page with no signed-in session.
- [ ] Admin dashboard numbers are visible and legible at 1080p.
- [ ] The created intern's email and department are visible.
- [ ] The task shows priority and deadline after creation.
- [ ] The intern account only sees its own tasks.
- [ ] The submission shows the awaiting-review badge.
- [ ] Feedback text is readable, then appears on the intern side.
- [ ] Resubmission creates attempt 2 and preserves attempt 1.
- [ ] Approval marks the task Completed and the dashboard count changes.
- [ ] No passwords, tokens or connection strings are visible on screen.

## After recording

Delete the test intern and test task only if it is safe to do so. The application archives interns that already have task or submission history instead of deleting records, which is the expected behaviour for an auditable tool. Seeded demonstration data should be left intact.
