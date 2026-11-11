import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { Submission } from '../src/models/Submission.js';
import { Task } from '../src/models/Task.js';
import { ADMIN_PASSWORD, INTERN_PASSWORD, bearer, makeAdmin, makeIntern, makeTask } from './factories.js';

const app = createApp();
let admin;
let internA;
let internB;
let task;
let adminToken;
let internAToken;

const submit = (payload = {}) =>
  request(app)
    .post(`/api/tasks/${task._id}/submissions`)
    .set(bearer(internAToken))
    .send({
      description: 'Implemented the assigned feature and documented the approach for review.',
      githubUrl: 'https://github.com/qubenix/intern-work',
      ...payload,
    });

describe('Submission and review workflow', () => {
  beforeEach(async () => {
    admin = await makeAdmin();
    internA = await makeIntern({ name: 'Aarav Sharma', email: 'aarav@test.qubenix.ai' });
    internB = await makeIntern({ name: 'Diya Patel', email: 'diya@test.qubenix.ai', department: 'Design' });
    task = await makeTask({ admin, intern: internA.intern, title: 'Build the reports page', status: 'In Progress' });

    const [adminLogin, internLogin] = await Promise.all([
      request(app).post('/api/auth/login').send({ email: admin.email, password: ADMIN_PASSWORD }),
      request(app).post('/api/auth/login').send({ email: internA.intern.email, password: INTERN_PASSWORD }),
    ]);
    adminToken = adminLogin.body.data.token;
    internAToken = internLogin.body.data.token;
  });

  it('accepts a valid submission and links it to the task and intern', async () => {
    const response = await submit();

    expect(response.status).toBe(201);
    expect(response.body.data.submission.reviewStatus).toBe('Submitted');
    expect(response.body.data.submission.attempt).toBe(1);
    expect(response.body.data.submission.githubUrl).toBe('https://github.com/qubenix/intern-work');
    expect(response.body.data.submission.intern.name).toBe('Aarav Sharma');

    const stored = await Submission.findById(response.body.data.submission.id);
    expect(stored.task.toString()).toBe(task._id.toString());
    expect(stored.intern.toString()).toBe(internA.intern._id.toString());
  });

  it('keeps the task In Progress when work is submitted', async () => {
    await submit();
    const refreshed = await Task.findById(task._id);
    expect(refreshed.status).toBe('In Progress');
  });

  it('requires at least one work link', async () => {
    const response = await submit({ githubUrl: '', documentUrl: '' });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/at least one work link/i);
  });

  it('rejects invalid work links', async () => {
    const response = await submit({ githubUrl: 'not-a-url' });
    expect(response.status).toBe(400);
    expect(response.body.errors[0].field).toBe('githubUrl');
  });

  it('rejects a short work description', async () => {
    const response = await submit({ description: 'Done' });
    expect(response.status).toBe(400);
  });

  it('blocks submissions from an intern the task is not assigned to', async () => {
    const otherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: internB.intern.email, password: INTERN_PASSWORD });

    const response = await request(app)
      .post(`/api/tasks/${task._id}/submissions`)
      .set(bearer(otherLogin.body.data.token))
      .send({
        description: 'Trying to submit work for a task that belongs to someone else.',
        githubUrl: 'https://github.com/qubenix/other',
      });

    expect(response.status).toBe(403);
    expect(await Submission.countDocuments({})).toBe(0);
  });

  it('prevents duplicate submissions while one is awaiting review', async () => {
    await submit();
    const second = await submit({ documentUrl: 'https://example.com/report' });
    expect(second.status).toBe(409);
  });

  it('lists submissions for admins with populated task and intern data', async () => {
    await submit();
    const response = await request(app).get('/api/submissions').set(bearer(adminToken));

    expect(response.status).toBe(200);
    expect(response.body.data.items).toHaveLength(1);
    expect(response.body.data.items[0].task.title).toBe('Build the reports page');
    expect(response.body.data.items[0].intern.name).toBe('Aarav Sharma');
    expect(response.body.data.summary.Submitted).toBe(1);
  });

  it('filters submissions by review status and searches intern names', async () => {
    await submit();
    await submit({ description: 'A second attempt that will not be created due to pending review.' }).catch(() => {});

    const submitted = await request(app).get('/api/submissions?reviewStatus=Submitted').set(bearer(adminToken));
    const approved = await request(app).get('/api/submissions?reviewStatus=Approved').set(bearer(adminToken));
    const search = await request(app).get('/api/submissions?search=aarav').set(bearer(adminToken));

    expect(submitted.body.data.items).toHaveLength(1);
    expect(approved.body.data.items).toHaveLength(0);
    expect(search.body.data.items).toHaveLength(1);
  });

  it('blocks interns from the admin submission endpoints', async () => {
    const response = await request(app).get('/api/submissions').set(bearer(internAToken));
    expect(response.status).toBe(403);
  });

  it('requires meaningful feedback when requesting changes', async () => {
    const created = await submit();
    const submissionId = created.body.data.submission.id;

    const missing = await request(app)
      .patch(`/api/submissions/${submissionId}/review`)
      .set(bearer(adminToken))
      .send({ reviewStatus: 'Needs Changes', adminFeedback: 'no' });

    expect(missing.status).toBe(400);
    expect(missing.body.message).toMatch(/minimum 10 characters/i);
  });

  it('requests changes, keeps the task in progress and exposes feedback to the intern', async () => {
    const created = await submit();
    const submissionId = created.body.data.submission.id;

    const review = await request(app)
      .patch(`/api/submissions/${submissionId}/review`)
      .set(bearer(adminToken))
      .send({
        reviewStatus: 'Needs Changes',
        adminFeedback: 'Please add error handling and document how to run the tests.',
      });

    expect(review.status).toBe(200);
    expect(review.body.data.submission.reviewStatus).toBe('Needs Changes');
    expect(review.body.data.task.status).toBe('In Progress');

    const detail = await request(app).get(`/api/tasks/${task._id}`).set(bearer(internAToken));
    expect(detail.body.data.submissions[0].adminFeedback).toMatch(/error handling/i);
    expect(detail.body.data.task.status).toBe('In Progress');
  });

  it('allows a resubmission after changes are requested and preserves history', async () => {
    const first = await submit();
    await request(app)
      .patch(`/api/submissions/${first.body.data.submission.id}/review`)
      .set(bearer(adminToken))
      .send({ reviewStatus: 'Needs Changes', adminFeedback: 'Please improve the documentation and test coverage.' });

    const second = await submit({
      description: 'Added error handling, documentation and integration tests as requested.',
      githubUrl: 'https://github.com/qubenix/intern-work/pull/2',
    });
    expect(second.status).toBe(201);
    expect(second.body.data.submission.attempt).toBe(2);

    const detail = await request(app).get(`/api/tasks/${task._id}`).set(bearer(internAToken));
    expect(detail.body.data.submissions).toHaveLength(2);
    expect(detail.body.data.submissions.map((item) => item.attempt).sort()).toEqual([1, 2]);
  });

  it('approves a submission and completes the task', async () => {
    const created = await submit();
    const review = await request(app)
      .patch(`/api/submissions/${created.body.data.submission.id}/review`)
      .set(bearer(adminToken))
      .send({ reviewStatus: 'Approved', adminFeedback: 'Great work, approved.' });

    expect(review.status).toBe(200);
    expect(review.body.data.submission.reviewStatus).toBe('Approved');
    expect(review.body.data.task.status).toBe('Completed');

    const stored = await Task.findById(task._id);
    expect(stored.status).toBe('Completed');
    expect(stored.completedAt).toBeTruthy();
  });

  it('blocks new submissions once the task is completed', async () => {
    const created = await submit();
    await request(app)
      .patch(`/api/submissions/${created.body.data.submission.id}/review`)
      .set(bearer(adminToken))
      .send({ reviewStatus: 'Approved' });

    const response = await submit({ documentUrl: 'https://example.com/another-report' });
    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/already completed/i);
  });

  it('refuses to review an already approved submission', async () => {
    const created = await submit();
    await request(app)
      .patch(`/api/submissions/${created.body.data.submission.id}/review`)
      .set(bearer(adminToken))
      .send({ reviewStatus: 'Approved' });

    const second = await request(app)
      .patch(`/api/submissions/${created.body.data.submission.id}/review`)
      .set(bearer(adminToken))
      .send({ reviewStatus: 'Needs Changes', adminFeedback: 'Changing my mind about this submission.' });

    expect(second.status).toBe(409);
  });
});
