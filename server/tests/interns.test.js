import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Intern } from '../src/models/Intern.js';
import { User } from '../src/models/User.js';
import {
  ADMIN_PASSWORD,
  INTERN_PASSWORD,
  bearer,
  makeAdmin,
  makeIntern,
  makeTask,
} from './factories.js';

const app = createApp();
let adminToken;

const validInternPayload = {
  name: 'Neha Verma',
  email: 'neha.verma@qubenix.ai',
  password: 'Neha@12345',
  phone: '+91 98111 22333',
  department: 'Design',
  joiningDate: '2026-02-01',
  status: 'active',
};

describe('Intern management', () => {
  beforeEach(async () => {
    const admin = await makeAdmin();
    await makeIntern({ name: 'Aarav Sharma', email: 'aarav@test.qubenix.ai' });
    await makeIntern({ name: 'Diya Patel', email: 'diya@test.qubenix.ai', department: 'Design' });

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: admin.email, password: ADMIN_PASSWORD });
    adminToken = login.body.data.token;
  });

  it('lists interns with pagination metadata', async () => {
    const response = await request(app).get('/api/interns?page=1&limit=2').set(bearer(adminToken));
    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.pagination).toMatchObject({ page: 1, limit: 2, total: 2, totalPages: 1 });
  });

  it('searches interns by name and email', async () => {
    const byName = await request(app).get('/api/interns?search=aarav').set(bearer(adminToken));
    const byEmail = await request(app).get('/api/interns?search=diya%40test').set(bearer(adminToken));

    expect(byName.body.data.items).toHaveLength(1);
    expect(byName.body.data.items[0].name).toBe('Aarav Sharma');
    expect(byEmail.body.data.items).toHaveLength(1);
    expect(byEmail.body.data.items[0].email).toBe('diya@test.qubenix.ai');
  });

  it('filters interns by department and status', async () => {
    const byDepartment = await request(app).get('/api/interns?department=Design').set(bearer(adminToken));
    const byStatus = await request(app).get('/api/interns?status=inactive').set(bearer(adminToken));

    expect(byDepartment.body.data.items).toHaveLength(1);
    expect(byDepartment.body.data.items[0].name).toBe('Diya Patel');
    expect(byStatus.body.data.items).toHaveLength(0);
  });

  it('creates the login account and intern profile together', async () => {
    const response = await request(app).post('/api/interns').set(bearer(adminToken)).send(validInternPayload);

    expect(response.status).toBe(201);
    expect(response.body.data.intern.email).toBe('neha.verma@qubenix.ai');

    const intern = await Intern.findById(response.body.data.intern.id);
    const user = await User.findById(intern.user);
    expect(user.role).toBe('intern');
    expect(user.passwordHash).toBeUndefined(); // passwordHash is select:false
    expect(user.isActive).toBe(true);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'neha.verma@qubenix.ai', password: 'Neha@12345' });
    expect(login.status).toBe(200);
  });

  it('stores bcrypt hashes, never plain passwords', async () => {
    const response = await request(app).post('/api/interns').set(bearer(adminToken)).send(validInternPayload);
    const intern = await Intern.findById(response.body.data.intern.id);
    const user = await User.findById(intern.user).select('+passwordHash');

    expect(user.passwordHash).toMatch(/^\$2[aby]\$/);
    expect(user.passwordHash).not.toBe(validInternPayload.password);
  });

  it('rejects duplicate email addresses with 409', async () => {
    await request(app).post('/api/interns').set(bearer(adminToken)).send(validInternPayload);
    const duplicate = await request(app)
      .post('/api/interns')
      .set(bearer(adminToken))
      .send({ ...validInternPayload, name: 'Different Name', phone: '+91 98111 22334' });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.success).toBe(false);
  });

  it('rejects missing and invalid fields', async () => {
    const missing = await request(app).post('/api/interns').set(bearer(adminToken)).send({ name: 'Only Name' });
    expect(missing.status).toBe(400);
    expect(missing.body.errors.length).toBeGreaterThan(0);

    const weakPassword = await request(app)
      .post('/api/interns')
      .set(bearer(adminToken))
      .send({ ...validInternPayload, password: 'weak' });
    expect(weakPassword.status).toBe(400);

    const badPhone = await request(app)
      .post('/api/interns')
      .set(bearer(adminToken))
      .send({ ...validInternPayload, phone: '1234567890' });
    expect(badPhone.status).toBe(400);

    const badDepartment = await request(app)
      .post('/api/interns')
      .set(bearer(adminToken))
      .send({ ...validInternPayload, department: 'Astrophysics' });
    expect(badDepartment.status).toBe(400);
  });

  it('fetches a single intern with task statistics', async () => {
    const intern = await Intern.findOne({ email: 'aarav@test.qubenix.ai' });
    const admin = await User.findOne({ role: 'admin' });
    await makeTask({ admin, intern, title: 'First task' });
    await makeTask({ admin, intern, title: 'Second task', status: 'Completed' });

    const response = await request(app).get(`/api/interns/${intern._id}`).set(bearer(adminToken));
    expect(response.status).toBe(200);
    expect(response.body.data.intern.email).toBe('aarav@test.qubenix.ai');
    expect(response.body.data.stats.totalTasks).toBe(2);
    expect(response.body.data.stats.completedTasks).toBe(1);
    expect(response.body.data.tasks).toHaveLength(2);
  });

  it('returns 404 for an unknown intern and 400 for a malformed id', async () => {
    const notFound = await request(app).get('/api/interns/64b7f0c2f1a2b3c4d5e6f7a8').set(bearer(adminToken));
    const malformed = await request(app).get('/api/interns/not-an-id').set(bearer(adminToken));

    expect(notFound.status).toBe(404);
    expect(malformed.status).toBe(400);
  });

  it('updates intern details and keeps the linked user in sync', async () => {
    const intern = await Intern.findOne({ email: 'aarav@test.qubenix.ai' });
    const response = await request(app)
      .put(`/api/interns/${intern._id}`)
      .set(bearer(adminToken))
      .send({ name: 'Aarav S. Sharma', email: 'aarav.updated@qubenix.ai', status: 'inactive' });

    expect(response.status).toBe(200);
    expect(response.body.data.intern.name).toBe('Aarav S. Sharma');
    expect(response.body.data.intern.status).toBe('inactive');

    const user = await User.findById(intern.user);
    expect(user.email).toBe('aarav.updated@qubenix.ai');
    expect(user.name).toBe('Aarav S. Sharma');
  });

  it('rejects updating an intern to an email already in use', async () => {
    const intern = await Intern.findOne({ email: 'aarav@test.qubenix.ai' });
    const response = await request(app)
      .put(`/api/interns/${intern._id}`)
      .set(bearer(adminToken))
      .send({ email: 'diya@test.qubenix.ai' });

    expect(response.status).toBe(409);
  });

  it('deletes an intern without history and removes the login account', async () => {
    const intern = await Intern.findOne({ email: 'aarav@test.qubenix.ai' });
    const userId = intern.user;

    const response = await request(app).delete(`/api/interns/${intern._id}`).set(bearer(adminToken));
    expect(response.status).toBe(200);
    expect(response.body.data.mode).toBe('deleted');

    expect(await Intern.findById(intern._id)).toBeNull();
    expect(await User.findById(userId)).toBeNull();

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aarav@test.qubenix.ai', password: INTERN_PASSWORD });
    expect(login.status).toBe(401);
  });

  it('archives an intern with task history instead of destroying records', async () => {
    const intern = await Intern.findOne({ email: 'aarav@test.qubenix.ai' });
    const admin = await User.findOne({ role: 'admin' });
    await makeTask({ admin, intern, title: 'Historical task' });

    const response = await request(app).delete(`/api/interns/${intern._id}`).set(bearer(adminToken));
    expect(response.status).toBe(200);
    expect(response.body.data.mode).toBe('archived');
    expect(response.body.data.taskCount).toBe(1);

    const archived = await Intern.findById(intern._id);
    expect(archived.status).toBe('inactive');
    expect(archived.deletedAt).toBeTruthy();

    const user = await User.findById(intern.user);
    expect(user.isActive).toBe(false);

    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aarav@test.qubenix.ai', password: INTERN_PASSWORD });
    expect(login.status).toBe(403);

    const list = await request(app).get('/api/interns').set(bearer(adminToken));
    expect(list.body.data.items.map((item) => item.email)).not.toContain('aarav@test.qubenix.ai');
  });

  it('prevents interns from using intern management endpoints', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aarav@test.qubenix.ai', password: INTERN_PASSWORD });

    const list = await request(app).get('/api/interns').set(bearer(login.body.data.token));
    const create = await request(app)
      .post('/api/interns')
      .set(bearer(login.body.data.token))
      .send(validInternPayload);

    expect(list.status).toBe(403);
    expect(create.status).toBe(403);
  });
});
