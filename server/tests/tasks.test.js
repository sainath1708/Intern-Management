import mongoose from 'mongoose';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Task } from '../src/models/Task.js';
import { Submission } from '../src/models/Submission.js';
import { ADMIN_PASSWORD, INTERN_PASSWORD, bearer, makeAdmin, makeIntern, makeTask } from './factories.js';

const app = createApp();
let admin;
let internA;
let internB;
let adminToken;
let internAToken;
let internBToken;

const futureDate = (days = 7) => new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

describe('Task management', () => {
  beforeEach(async () => {
    admin = await makeAdmin();
    internA = await makeIntern({ name: 'Aarav Sharma', email: 'aarav@test.qubenix.ai' });
    internB = await makeIntern({ name: 'Diya Patel', email: 'diya@test.qubenix.ai', department: 'Design' });

    const [adminLogin, aLogin, bLogin] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: admin.email, password: ADMIN_PASSWORD }),
      request(app).post('/api/auth/login').send({ email: internA.intern.email, password: INTERN_PASSWORD }),
      request(app).post('/api/auth/login').send({ email: internB.intern.email, password: INTERN_PASSWORD }),
    ]);

    adminToken = adminLogin.body.data.token;
    internAToken = aLogin.body.data.token;
    internBToken = bLogin.body.data.token;
  });

  it('lets an admin create a task assigned to an active intern', async () => {
    const response = await request(app).post('/api/tasks').set(bearer(adminToken)).send({
      title: 'Build the reports page',
      description: 'Create a reports page with filters and CSV export for the operations team.',
      assignedTo: internA.intern._id.toString(),
      deadline: futureDate(4),
      priority: 'High',
    });

    expect(response.status).toBe(201);
    expect(response.body.data.task.status).toBe('Pending');
    expect(response.body.data.task.priority).toBe('High');
    expect(response.body.data.task.assignedTo.name).toBe('Aarav Sharma');
    expect(response.body.data.task.createdBy).toBe(admin._id.toString());
  });

  it('rejects a deadline in the past', async () => {
    const response = await request(app).post('/api/tasks').set(bearer(adminToken)).send({
      title: 'Late task',
      description: 'This task tries to use a deadline that has already passed.',
      assignedTo: internA.intern._id.toString(),
      deadline: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      priority: 'Medium',
    });

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/past/i);
  });

  it('rejects assignment to an unknown or inactive intern', async () => {
    const payload = {
      title: 'Invalid assignment',
      description: 'Checking that tasks cannot be assigned to unknown interns.',
      deadline: futureDate(2),
      priority: 'Low',
    };

    const unknown = await request(app)
      .post('/api/tasks')
      .set(bearer(adminToken))
      .send({ ...payload, assignedTo: new mongoose.Types.ObjectId().toString() });

    const inactive = await makeIntern({ name: 'Inactive Person', email: 'inactive@test.qubenix.ai', status: 'inactive' });
    const inactiveResponse = await request(app)
      .post('/api/tasks')
      .set(bearer(adminToken))
      .send({ ...payload, assignedTo: inactive.intern._id.toString() });

    expect(unknown.status).toBe(400);
    expect(unknown.body.message).toMatch(/not be found/i);
    expect(inactiveResponse.status).toBe(400);
    expect(inactiveResponse.body.message).toMatch(/active interns/i);
  });

  it('rejects missing fields and invalid priorities', async () => {
    const missing = await request(app).post('/api/tasks').set(bearer(adminToken)).send({ title: 'x' });
    expect(missing.status).toBe(400);
    expect(missing.body.errors.length).toBeGreaterThan(2);

    const badPriority = await request(app).post('/api/tasks').set(bearer(adminToken)).send({
      title: 'Valid title here',
      description: 'A description long enough to pass validation checks.',
      assignedTo: internA.intern._id.toString(),
      deadline: futureDate(3),
      priority: 'Urgent',
    });
    expect(badPriority.status).toBe(400);
  });

  it('lists all tasks for an admin with pagination, filters and search', async () => {
    await makeTask({ admin, intern: internA.intern, title: 'Alpha task', priority: 'High' });
    await makeTask({ admin, intern: internA.intern, title: 'Beta task', status: 'Completed', priority: 'Low' });
    await makeTask({ admin, intern: internB.intern, title: 'Gamma task', priority: 'High' });

    const all = await request(app).get('/api/tasks').set(bearer(adminToken));
    expect(all.body.data.pagination.total).toBe(3);

    const high = await request(app).get('/api/tasks?priority=High').set(bearer(adminToken));
    expect(high.body.data.items).toHaveLength(2);

    const completed = await request(app).get('/api/tasks?status=Completed').set(bearer(adminToken));
    expect(completed.body.data.items).toHaveLength(1);

    const byIntern = await request(app)
      .get(`/api/tasks?internId=${internB.intern._id}`)
      .set(bearer(adminToken));
    expect(byIntern.body.data.items).toHaveLength(1);
    expect(byIntern.body.data.items[0].title).toBe('Gamma task');

    const search = await request(app).get('/api/tasks?search=gamma').set(bearer(adminToken));
    expect(search.body.data.items).toHaveLength(1);

    const paged = await request(app).get('/api/tasks?page=2&limit=2').set(bearer(adminToken));
    expect(paged.body.data.items).toHaveLength(1);
    expect(paged.body.data.pagination.totalPages).toBe(2);
  });

  it('scopes interns to their own tasks only', async () => {
    await makeTask({ admin, intern: internA.intern, title: 'Aarav task one' });
    await makeTask({ admin, intern: internA.intern, title: 'Aarav task two' });
    await makeTask({ admin, intern: internB.intern, title: 'Diya task' });

    const response = await request(app).get('/api/tasks').set(bearer(internAToken));
    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items.every((task) => task.assignedTo.name === 'Aarav Sharma')).toBe(true);

    // Query parameters cannot widen an intern's scope.
    const attempted = await request(app)
      .get(`/api/tasks?internId=${internB.intern._id}`)
      .set(bearer(internAToken));
    expect(attempted.body.data.items.every((task) => task.assignedTo.name === 'Aarav Sharma')).toBe(true);
  });

  it('prevents interns from creating, editing or deleting tasks', async () => {
    const task = await makeTask({ admin, intern: internA.intern });

    const create = await request(app).post('/api/tasks').set(bearer(internAToken)).send({
      title: 'Intern created task',
      description: 'Interns must never be able to create tasks.',
      assignedTo: internA.intern._id.toString(),
      deadline: futureDate(2),
      priority: 'Low',
    });
    const update = await request(app).put(`/api/tasks/${task._id}`).set(bearer(internAToken)).send({ title: 'Hacked title' });
    const remove = await request(app).delete(`/api/tasks/${task._id}`).set(bearer(internAToken));

    expect(create.status).toBe(403);
    expect(update.status).toBe(403);
    expect(remove.status).toBe(403);
  });

  it('allows an intern to move their own Pending task to In Progress', async () => {
    const task = await makeTask({ admin, intern: internA.intern });

    const response = await request(app)
      .patch(`/api/tasks/${task._id}/status`)
      .set(bearer(internAToken))
      .send({ status: 'In Progress' });

    expect(response.status).toBe(200);
    expect(response.body.data.task.status).toBe('In Progress');
  });

  it('prevents an intern from marking a task Completed directly', async () => {
    const task = await makeTask({ admin, intern: internA.intern });

    const response = await request(app)
      .patch(`/api/tasks/${task._id}/status`)
      .set(bearer(internAToken))
      .send({ status: 'Completed' });

    expect(response.status).toBe(403);
    expect(await Task.findById(task._id)).toMatchObject({ status: 'Pending' });
  });

  it('prevents an intern from changing another intern task', async () => {
    const task = await makeTask({ admin, intern: internB.intern });

    const response = await request(app)
      .patch(`/api/tasks/${task._id}/status`)
      .set(bearer(internAToken))
      .send({ status: 'In Progress' });

    expect(response.status).toBe(403);

    const detail = await request(app).get(`/api/tasks/${task._id}`).set(bearer(internAToken));
    expect(detail.status).toBe(403);
  });

  it('lets an admin update task fields and complete a task manually', async () => {
    const task = await makeTask({ admin, intern: internA.intern });

    const response = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set(bearer(adminToken))
      .send({ title: 'Updated title', priority: 'High', status: 'Completed' });

    expect(response.status).toBe(200);
    expect(response.body.data.task.title).toBe('Updated title');
    expect(response.body.data.task.status).toBe('Completed');

    const stored = await Task.findById(task._id);
    expect(stored.completedAt).toBeTruthy();
  });

  it('refuses to reassign a task that already has submission history', async () => {
    const task = await makeTask({ admin, intern: internA.intern });
    await Submission.create({
      task: task._id,
      intern: internA.intern._id,
      description: 'A meaningful description of the submitted work for this task.',
      githubUrl: 'https://github.com/qubenix/demo',
      attempt: 1,
    });

    const response = await request(app)
      .put(`/api/tasks/${task._id}`)
      .set(bearer(adminToken))
      .send({ assignedTo: internB.intern._id.toString() });

    expect(response.status).toBe(409);
  });

  it('deletes a task and its submissions together', async () => {
    const task = await makeTask({ admin, intern: internA.intern });
    await Submission.create({
      task: task._id,
      intern: internA.intern._id,
      description: 'A meaningful description of the submitted work for this task.',
      documentUrl: 'https://example.com/report',
      attempt: 1,
    });

    const response = await request(app).delete(`/api/tasks/${task._id}`).set(bearer(adminToken));
    expect(response.status).toBe(200);
    expect(response.body.data.deletedSubmissions).toBe(1);

    expect(await Task.findById(task._id)).toBeNull();
    expect(await Submission.countDocuments({ task: task._id })).toBe(0);
  });
});
