import bcrypt from 'bcryptjs';
import request from 'supertest';
import { User } from '../src/models/User.js';
import { Intern } from '../src/models/Intern.js';
import { Task } from '../src/models/Task.js';

export const ADMIN_PASSWORD = 'Admin@12345';
export const INTERN_PASSWORD = 'Intern@12345';

export const makeAdmin = async ({ email = 'admin@test.qubenix.ai', password = ADMIN_PASSWORD } = {}) =>
  User.create({
    name: 'Test Admin',
    email,
    role: 'admin',
    passwordHash: await bcrypt.hash(password, 4),
  });

export const makeIntern = async ({
  name = 'Test Intern',
  email = 'intern@test.qubenix.ai',
  phone = '+91 98765 43210',
  department = 'Engineering',
  status = 'active',
  password = INTERN_PASSWORD,
  userActive = true,
} = {}) => {
  const user = await User.create({
    name,
    email,
    role: 'intern',
    isActive: userActive,
    passwordHash: await bcrypt.hash(password, 4),
  });

  const intern = await Intern.create({
    user: user._id,
    name,
    email,
    phone,
    department,
    joiningDate: new Date('2026-01-15'),
    status,
  });

  return { user, intern, password };
};

export const makeTask = async ({
  admin,
  intern,
  title = 'Sample task',
  description = 'This is a sufficiently detailed sample task description for testing.',
  status = 'Pending',
  priority = 'Medium',
  deadline = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
  createdBy,
} = {}) =>
  Task.create({
    title,
    description,
    assignedTo: intern._id,
    deadline,
    priority,
    status,
    createdBy: createdBy || admin._id,
  });

export const login = (app, email, password) => request(app).post('/api/auth/login').send({ email, password });

export const bearer = (token) => ({ Authorization: `Bearer ${token}` });

export const loginAs = async (app, email, password) => {
  const response = await login(app, email, password);
  return response.body?.data?.token;
};
