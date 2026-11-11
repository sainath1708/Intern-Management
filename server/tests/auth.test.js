import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { ADMIN_PASSWORD, INTERN_PASSWORD, bearer, makeAdmin, makeIntern } from './factories.js';

const app = createApp();
const SECRET = process.env.JWT_SECRET;
const ISSUER = 'qubenix-intern-management';
const AUDIENCE = 'qubenix-web-client';

describe('Authentication', () => {
  beforeEach(async () => {
    await makeAdmin();
    await makeIntern();
  });

  it('returns server and database health', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.database.connected).toBe(true);
  });

  it('logs in a valid admin and returns a JWT', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.qubenix.ai', password: ADMIN_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('admin');
    expect(typeof response.body.data.token).toBe('string');
    expect(response.body.data.token.split('.')).toHaveLength(3);
  });

  it('logs in a valid intern and includes the linked intern profile', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'intern@test.qubenix.ai', password: INTERN_PASSWORD });

    expect(response.status).toBe(200);
    expect(response.body.data.user.role).toBe('intern');
    expect(response.body.data.user.intern.id).toBeDefined();
    expect(response.body.data.user.intern.department).toBe('Engineering');
  });

  it('is case insensitive for email addresses', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ADMIN@TEST.QUBENIX.AI', password: ADMIN_PASSWORD });
    expect(response.status).toBe(200);
  });

  it('rejects invalid credentials without revealing which field is wrong', async () => {
    const wrongPassword = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.qubenix.ai', password: 'WrongPass@1' });
    const unknownEmail = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@test.qubenix.ai', password: ADMIN_PASSWORD });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe('Invalid email or password');
    expect(unknownEmail.body.message).toBe('Invalid email or password');
  });

  it('rejects malformed login payloads with validation errors', async () => {
    const response = await request(app).post('/api/auth/login').send({ email: 'not-an-email', password: '' });
    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
    expect(Array.isArray(response.body.errors)).toBe(true);
  });

  it('never exposes password hashes in login or session responses', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.qubenix.ai', password: ADMIN_PASSWORD });

    const token = loginResponse.body.data.token;
    const meResponse = await request(app).get('/api/auth/me').set(bearer(token));

    const serialized = JSON.stringify(loginResponse.body) + JSON.stringify(meResponse.body);
    expect(serialized).not.toContain('passwordHash');
    expect(serialized).not.toContain('$2a$');
    expect(serialized).not.toContain('$2b$');
  });

  it('returns the current session for a valid token', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'intern@test.qubenix.ai', password: INTERN_PASSWORD });

    const response = await request(app).get('/api/auth/me').set(bearer(login.body.data.token));
    expect(response.status).toBe(200);
    expect(response.body.data.user.email).toBe('intern@test.qubenix.ai');
  });

  it('rejects missing tokens', async () => {
    const response = await request(app).get('/api/auth/me');
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/missing/i);
  });

  it('rejects invalid tokens', async () => {
    const response = await request(app).get('/api/auth/me').set(bearer('not.a.real.token'));
    expect(response.status).toBe(401);
  });

  it('rejects expired tokens', async () => {
    const admin = await makeAdmin({ email: 'expired@test.qubenix.ai' });
    const expired = jwt.sign({ sub: admin._id.toString(), role: 'admin' }, SECRET, {
      expiresIn: '-10s',
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const response = await request(app).get('/api/auth/me').set(bearer(expired));
    expect(response.status).toBe(401);
    expect(response.body.message).toMatch(/expired/i);
  });

  it('rejects tokens signed with a different secret', async () => {
    const admin = await makeAdmin({ email: 'foreign@test.qubenix.ai' });
    const forged = jwt.sign({ sub: admin._id.toString(), role: 'admin' }, 'a-different-secret-value-that-is-long-enough', {
      expiresIn: '1h',
      issuer: ISSUER,
      audience: AUDIENCE,
    });

    const response = await request(app).get('/api/auth/me').set(bearer(forged));
    expect(response.status).toBe(401);
  });

  it('blocks interns from administrative endpoints', async () => {
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'intern@test.qubenix.ai', password: INTERN_PASSWORD });

    const response = await request(app).get('/api/interns').set(bearer(login.body.data.token));
    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('blocks a deactivated account', async () => {
    await makeIntern({ email: 'inactive@test.qubenix.ai', userActive: false, name: 'Inactive Intern' });
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'inactive@test.qubenix.ai', password: INTERN_PASSWORD });

    expect(response.status).toBe(403);
    expect(response.body.success).toBe(false);
  });

  it('rate limits repeated failed login attempts', async () => {
    let lastStatus = 0;
    for (let i = 0; i < 15; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@test.qubenix.ai', password: `WrongPass@${i}` });
      lastStatus = response.status;
      if (lastStatus === 429) break;
    }
    expect(lastStatus).toBe(429);
  });
});
