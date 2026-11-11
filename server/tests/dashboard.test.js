import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Submission } from '../src/models/Submission.js';
import { ADMIN_PASSWORD, INTERN_PASSWORD, bearer, makeAdmin, makeIntern, makeTask } from './factories.js';

const app = createApp();
let admin;
let internA;
let internB;
let adminToken;
let internAToken;

describe('Dashboard statistics', () => {
  beforeEach(async () => {
    admin = await makeAdmin();
    internA = await makeIntern({ name: 'Aarav Sharma', email: 'aarav@test.qubenix.ai' });
    internB = await makeIntern({ name: 'Diya Patel', email: 'diya@test.qubenix.ai', department: 'Design', status: 'inactive' });

    const pending = await makeTask({ admin, intern: internA.intern, title: 'Pending task', status: 'Pending' });
    const inProgress = await makeTask({
      admin,
      intern: internA.intern,
      title: 'In progress task',
      status: 'In Progress',
    });
    await makeTask({ admin, intern: internA.intern, title: 'Completed task', status: 'Completed' });
    await makeTask({
      admin,
      intern: internA.intern,
      title: 'Overdue task',
      status: 'Pending',
      deadline: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    });
    await makeTask({ admin, intern: internB.intern, title: 'Another completed task', status: 'Completed' });

    await Submission.create({
      task: pending._id,
      intern: internA.intern._id,
      description: 'Submitted work for the pending task, ready for admin review.',
      githubUrl: 'https://github.com/qubenix/demo-one',
      attempt: 1,
    });
    await Submission.create({
      task: inProgress._id,
      intern: internA.intern._id,
      description: 'Previously submitted work that has already been reviewed and approved.',
      documentUrl: 'https://example.com/approved-report',
      attempt: 1,
      reviewStatus: 'Approved',
      adminFeedback: 'Approved after review.',
      reviewedBy: admin._id,
      reviewedAt: new Date(),
    });

    const [adminLogin, internLogin] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: admin.email, password: ADMIN_PASSWORD }),
      request(app).post('/api/auth/login').send({ email: internA.intern.email, password: INTERN_PASSWORD }),
    ]);
    adminToken = adminLogin.body.data.token;
    internAToken = internLogin.body.data.token;
  });

  it('returns accurate counts for every admin metric', async () => {
    const response = await request(app).get('/api/dashboard/stats').set(bearer(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.data.stats).toMatchObject({
      totalInterns: 2,
      activeInterns: 1,
      totalTasks: 5,
      completedTasks: 2,
      pendingTasks: 2,
      inProgressTasks: 1,
      overdueTasks: 1,
      pendingReview: 1,
    });
  });

  it('returns recent submissions with populated task and intern data', async () => {
    const response = await request(app).get('/api/dashboard/stats').set(bearer(adminToken));
    const { recentSubmissions } = response.body.data.stats;

    expect(recentSubmissions).toHaveLength(2);
    expect(recentSubmissions[0].intern.name).toBe('Aarav Sharma');
    expect(recentSubmissions[0].task.title).toBeDefined();
  });

  it('returns recent task activity', async () => {
    const response = await request(app).get('/api/dashboard/stats').set(bearer(adminToken));
    expect(response.body.data.stats.recentTasks.length).toBeGreaterThan(0);
    expect(response.body.data.stats.recentTasks[0].assignedTo.name).toBeDefined();
  });

  it('scopes intern dashboard data to the signed-in intern', async () => {
    const response = await request(app).get('/api/dashboard/stats').set(bearer(internAToken));

    expect(response.status).toBe(200);
    expect(response.body.data.stats).toMatchObject({
      totalTasks: 4,
      pendingTasks: 2,
      inProgressTasks: 1,
      completedTasks: 1,
      needsChanges: 0,
    });
    expect(response.body.data.stats.intern.name).toBe('Aarav Sharma');
  });

  it('requires authentication', async () => {
    const response = await request(app).get('/api/dashboard/stats');
    expect(response.status).toBe(401);
  });
});
