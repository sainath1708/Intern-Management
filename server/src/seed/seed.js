import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Intern } from '../models/Intern.js';
import { Task } from '../models/Task.js';
import { Submission } from '../models/Submission.js';
import { PRIORITIES, REVIEW_STATUS, ROLES, TASK_STATUS } from '../utils/constants.js';

const daysFromNow = (days, hour = 18) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
};

const internSeeds = [
  {
    name: 'Aarav Sharma',
    email: 'aarav.sharma@qubenix.ai',
    phone: '+91 98765 43210',
    department: 'Engineering',
    joiningDaysAgo: 120,
  },
  {
    name: 'Diya Patel',
    email: 'diya.patel@qubenix.ai',
    phone: '+91 91234 56789',
    department: 'Design',
    joiningDaysAgo: 75,
  },
  {
    name: 'Rohan Iyer',
    email: 'rohan.iyer@qubenix.ai',
    phone: '+91 99887 76655',
    department: 'Data Science',
    joiningDaysAgo: 45,
  },
];

const taskSeeds = [
  {
    key: 'Build responsive intern dashboard',
    title: 'Build responsive intern dashboard',
    description:
      'Implement the intern-facing dashboard in React using the existing design system. It must show assigned task counts, upcoming deadlines and feedback highlights, and stay usable on mobile.',
    internEmail: 'aarav.sharma@qubenix.ai',
    priority: 'High',
    status: TASK_STATUS.IN_PROGRESS,
    deadlineInDays: 5,
  },
  {
    key: 'Design onboarding email templates',
    title: 'Design onboarding email templates',
    description:
      'Create three responsive email templates (welcome, first-week check-in, feedback request) that match the Qubenix AI brand guidelines and are ready for the marketing team to send.',
    internEmail: 'diya.patel@qubenix.ai',
    priority: 'Medium',
    status: TASK_STATUS.COMPLETED,
    deadlineInDays: -3,
  },
  {
    key: 'Clean and document the sales dataset',
    title: 'Clean and document the sales dataset',
    description:
      'Normalise the sample sales export, remove duplicate rows, document every transformation in a short data dictionary and publish the cleaned file for the analytics team.',
    internEmail: 'rohan.iyer@qubenix.ai',
    priority: 'Medium',
    status: TASK_STATUS.PENDING,
    deadlineInDays: 8,
  },
  {
    key: 'Write API integration tests',
    title: 'Write API integration tests',
    description:
      'Add Supertest coverage for the task and submission endpoints, including role restrictions and validation failures. Document how to run the suite in the pull request.',
    internEmail: 'aarav.sharma@qubenix.ai',
    priority: 'High',
    status: TASK_STATUS.PENDING,
    deadlineInDays: 2,
  },
  {
    key: 'Publish Qubenix brand style guide',
    title: 'Publish Qubenix brand style guide',
    description:
      'Consolidate logo usage, typography, colour tokens and component spacing rules into a single style guide page for the internal team.',
    internEmail: 'diya.patel@qubenix.ai',
    priority: 'Low',
    status: TASK_STATUS.COMPLETED,
    deadlineInDays: -8,
  },
  {
    key: 'Prototype churn prediction notebook',
    title: 'Prototype churn prediction notebook',
    description:
      'Build a prototype notebook that explores the churn dataset, trains a baseline model and summarises the most important features. The deadline has passed, so a reviewed submission is expected.',
    internEmail: 'rohan.iyer@qubenix.ai',
    priority: 'Low',
    status: TASK_STATUS.IN_PROGRESS,
    deadlineInDays: -1,
  },
];

const submissionSeeds = [
  {
    taskKey: 'Design onboarding email templates',
    reviewStatus: REVIEW_STATUS.APPROVED,
    adminFeedback: 'Excellent work - the templates follow our brand guide and render well on mobile. Approved.',
    description:
      'Designed three responsive onboarding email templates in Figma, exported the assets and wrote hand-off notes covering fonts, spacing and button states.',
    githubUrl: '',
    documentUrl: 'https://www.figma.com/file/qubenix-onboarding-templates',
    submittedDaysAgo: 5,
  },
  {
    taskKey: 'Publish Qubenix brand style guide',
    reviewStatus: REVIEW_STATUS.APPROVED,
    adminFeedback: 'Clear and complete. The spacing scale will help the whole team stay consistent.',
    description:
      'Published the consolidated brand style guide covering logo usage, typography, colour tokens and spacing rules on the internal documentation site.',
    githubUrl: '',
    documentUrl: 'https://www.notion.so/qubenix/brand-style-guide',
    submittedDaysAgo: 10,
  },
  {
    taskKey: 'Prototype churn prediction notebook',
    reviewStatus: REVIEW_STATUS.SUBMITTED,
    adminFeedback: '',
    description:
      'First pass at the churn exploration notebook. Feature analysis is complete and a baseline logistic regression model reaches 0.81 ROC AUC. Ready for review.',
    githubUrl: 'https://github.com/qubenix-sample/churn-prediction-notebook',
    documentUrl: '',
    submittedDaysAgo: 1,
  },
];

const validateSeedConfig = () => {
  const missing = [];
  if (!env.admin.name) missing.push('ADMIN_NAME');
  if (!env.admin.email) missing.push('ADMIN_EMAIL');
  if (!env.admin.password) missing.push('ADMIN_PASSWORD');
  if (!env.seedInternPassword) missing.push('SEED_INTERN_PASSWORD');
  if (missing.length > 0) {
    throw new Error(`Seed configuration is incomplete. Missing: ${missing.join(', ')}. Add them to server/.env`);
  }
  if (env.admin.password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long');
  }
};

const ensureAdmin = async (report) => {
  const existing = await User.findOne({ email: env.admin.email });

  if (existing) {
    report.admin = 'skipped (admin account already exists)';
    if (existing.role !== ROLES.ADMIN) {
      throw new Error(`ADMIN_EMAIL ${env.admin.email} belongs to a non-admin account`);
    }
    return existing;
  }

  const admin = new User({
    name: env.admin.name,
    email: env.admin.email,
    role: ROLES.ADMIN,
  });
  await admin.setPassword(env.admin.password);
  await admin.save();

  report.admin = 'created';
  return admin;
};

const ensureIntern = async (seed, password, report) => {
  const existingUser = await User.findOne({ email: seed.email });

  if (existingUser) {
    const profile = await Intern.findOne({ user: existingUser._id });
    if (!profile) {
      const profileDoc = await Intern.create({
        user: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        phone: seed.phone,
        department: seed.department,
        joiningDate: daysFromNow(-seed.joiningDaysAgo, 10),
        status: 'active',
      });
      report.interns.push(`${seed.name}: linked missing profile`);
      return profileDoc;
    }
    report.interns.push(`${seed.name}: skipped (already exists)`);
    return profile;
  }

  const user = new User({ name: seed.name, email: seed.email, role: ROLES.INTERN });
  await user.setPassword(password);
  await user.save();

  try {
    const intern = await Intern.create({
      user: user._id,
      name: seed.name,
      email: seed.email,
      phone: seed.phone,
      department: seed.department,
      joiningDate: daysFromNow(-seed.joiningDaysAgo, 10),
      status: 'active',
    });
    report.interns.push(`${seed.name}: created`);
    return intern;
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }
};

const ensureTasks = async ({ admin, internsByEmail, report }) => {
  const tasksByKey = new Map();

  for (const seed of taskSeeds) {
    let task = await Task.findOne({ title: seed.title });

    if (!task) {
      const intern = internsByEmail.get(seed.internEmail);
      task = await Task.create({
        title: seed.title,
        description: seed.description,
        assignedTo: intern._id,
        deadline: daysFromNow(seed.deadlineInDays),
        priority: seed.priority,
        status: seed.status,
        createdBy: admin._id,
        completedAt: seed.status === TASK_STATUS.COMPLETED ? daysFromNow(-2, 12) : null,
      });
      report.tasks.push(`${seed.title}: created`);
    } else {
      report.tasks.push(`${seed.title}: skipped (already exists)`);
    }

    tasksByKey.set(seed.key, task);
  }

  return tasksByKey;
};

const ensureSubmissions = async ({ admin, tasksByKey, report }) => {
  for (const seed of submissionSeeds) {
    const task = tasksByKey.get(seed.taskKey);
    if (!task) continue;

    const existingCount = await Submission.countDocuments({ task: task._id });
    if (existingCount > 0) {
      report.submissions.push(`${seed.taskKey}: skipped (submission already exists)`);
      continue;
    }

    await Submission.create({
      task: task._id,
      intern: task.assignedTo,
      description: seed.description,
      githubUrl: seed.githubUrl,
      documentUrl: seed.documentUrl,
      submittedAt: daysFromNow(-seed.submittedDaysAgo, 11),
      reviewStatus: seed.reviewStatus,
      adminFeedback: seed.adminFeedback,
      reviewedBy: seed.reviewStatus === REVIEW_STATUS.SUBMITTED ? null : admin._id,
      reviewedAt: seed.reviewStatus === REVIEW_STATUS.SUBMITTED ? null : daysFromNow(-seed.submittedDaysAgo + 1, 15),
      attempt: 1,
    });

    report.submissions.push(`${seed.taskKey}: created (${seed.reviewStatus})`);
  }
};

export const seedDatabase = async ({ log = console.log } = {}) => {
  validateSeedConfig();

  const report = { admin: 'skipped', interns: [], tasks: [], submissions: [] };

  const admin = await ensureAdmin(report);

  const internsByEmail = new Map();
  for (const seed of internSeeds) {
    const intern = await ensureIntern(seed, env.seedInternPassword, report);
    internsByEmail.set(seed.email, intern);
  }

  const tasksByKey = await ensureTasks({ admin, internsByEmail, report });
  await ensureSubmissions({ admin, tasksByKey, report });

  log('\n[seed] Demo data summary');
  log(`  admin: ${report.admin}`);
  log('  interns:');
  report.interns.forEach((line) => log(`    - ${line}`));
  log('  tasks:');
  report.tasks.forEach((line) => log(`    - ${line}`));
  log('  submissions:');
  report.submissions.forEach((line) => log(`    - ${line}`));
  log('\n[seed] Done. Existing records were not modified.');

  return report;
};

const isDirectRun = () => {
  if (!process.argv[1]) return false;
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(process.argv[1]).toLowerCase() === path.resolve(currentFile).toLowerCase();
};

if (isDirectRun()) {
  (async () => {
    try {
      if (!env.mongoUri) {
        throw new Error('MONGODB_URI is required to run the seed script. Point it at MongoDB Atlas.');
      }
      await connectDB(env.mongoUri);
      const report = await seedDatabase();
      const created = [...report.interns, ...report.tasks, ...report.submissions].filter((line) =>
        line.includes(': created'),
      ).length;
      console.log(`[seed] ${created} new record group(s) created.`);
    } catch (error) {
      console.error(`[seed] failed: ${error.message}`);
      process.exitCode = 1;
    } finally {
      await disconnectDB();
      if (mongoose.connection.readyState !== 0) process.exit(1);
    }
  })();
}

export { daysFromNow, internSeeds, taskSeeds, submissionSeeds };
