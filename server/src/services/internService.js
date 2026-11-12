import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Intern } from '../models/Intern.js';
import { Task } from '../models/Task.js';
import { Submission } from '../models/Submission.js';
import { ApiError } from '../utils/ApiError.js';
import { internDTO, submissionDTO, taskDTO } from '../utils/serializers.js';
import { escapeRegex, paginationMeta, parsePagination } from '../utils/pagination.js';
import { withTransaction } from './transaction.js';
import { DEPARTMENTS, INTERN_STATUS, INTERN_STATUSES, ROLES } from '../utils/constants.js';

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid intern id');
};

const buildFilter = ({ search, department, status }) => {
  const filter = { deletedAt: null };

  if (status && INTERN_STATUSES.includes(status)) filter.status = status;
  if (department && DEPARTMENTS.includes(department)) filter.department = department;

  const term = String(search || '').trim();
  if (term) {
    const regex = new RegExp(escapeRegex(term), 'i');
    filter.$or = [{ name: regex }, { email: regex }];
  }

  return filter;
};

export const listInterns = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = buildFilter(query);

  const [interns, total] = await Promise.all([
    Intern.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Intern.countDocuments(filter),
  ]);

  return {
    items: interns.map((intern) => internDTO(intern)),
    pagination: paginationMeta({ page, limit, total }),
  };
};

export const getInternById = async (id) => {
  assertValidId(id);

  const intern = await Intern.findOne({ _id: id, deletedAt: null }).lean();
  if (!intern) throw ApiError.notFound('Intern not found');

  const [tasks, totalTasks, completedTasks, pendingTasks, inProgressTasks, submissions, submissionCount] =
    await Promise.all([
      Task.find({ assignedTo: intern._id }).sort({ createdAt: -1 }).limit(8).lean(),
      Task.countDocuments({ assignedTo: intern._id }),
      Task.countDocuments({ assignedTo: intern._id, status: 'Completed' }),
      Task.countDocuments({ assignedTo: intern._id, status: 'Pending' }),
      Task.countDocuments({ assignedTo: intern._id, status: 'In Progress' }),
      Submission.find({ intern: intern._id })
        .sort({ submittedAt: -1 })
        .limit(5)
        .populate('task', 'title status priority deadline')
        .lean(),
      Submission.countDocuments({ intern: intern._id }),
    ]);

  return {
    intern: internDTO(intern),
    stats: {
      totalTasks,
      completedTasks,
      pendingTasks,
      inProgressTasks,
      submissions: submissionCount,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    },
    tasks: tasks.map((task) => taskDTO(task)),
    recentSubmissions: submissions.map((submission) => submissionDTO(submission)),
  };
};

export const createIntern = async (payload) => {
  const email = payload.email.trim().toLowerCase();

  const existingUser = await User.findOne({ email });
  if (existingUser) throw ApiError.conflict('An account with this email address already exists');

  const passwordHash = await bcrypt.hash(payload.password, env.bcryptRounds);
  let createdUserId = null;

  try {
    const profile = await withTransaction(async (session) => {
      const [user] = await User.create(
        [
          {
            name: payload.name.trim(),
            email,
            passwordHash,
            role: ROLES.INTERN,
          },
        ],
        { session },
      );
      createdUserId = user._id;

      const [intern] = await Intern.create(
        [
          {
            user: user._id,
            name: payload.name.trim(),
            email,
            phone: payload.phone.trim(),
            department: payload.department,
            joiningDate: payload.joiningDate,
            status: payload.status || INTERN_STATUS.ACTIVE,
          },
        ],
        { session },
      );

      return intern;
    });

    return internDTO(profile);
  } catch (error) {
    if (createdUserId) await User.deleteOne({ _id: createdUserId });
    if (error?.code === 11000) throw ApiError.conflict('An account with this email address already exists');
    throw error;
  }
};

export const updateIntern = async (id, payload) => {
  assertValidId(id);

  const intern = await Intern.findOne({ _id: id, deletedAt: null });
  if (!intern) throw ApiError.notFound('Intern not found');

  const internUpdates = {};
  const userUpdates = {};

  if (payload.name !== undefined) {
    internUpdates.name = payload.name.trim();
    userUpdates.name = payload.name.trim();
  }
  if (payload.phone !== undefined) internUpdates.phone = payload.phone.trim();
  if (payload.department !== undefined) internUpdates.department = payload.department;
  if (payload.joiningDate !== undefined) internUpdates.joiningDate = payload.joiningDate;
  if (payload.status !== undefined) internUpdates.status = payload.status;

  if (payload.email !== undefined) {
    const nextEmail = payload.email.trim().toLowerCase();
    if (nextEmail !== intern.email) {
      const emailTaken = await User.findOne({ email: nextEmail, _id: { $ne: intern.user } });
      if (emailTaken) throw ApiError.conflict('An account with this email address already exists');
      internUpdates.email = nextEmail;
      userUpdates.email = nextEmail;
    }
  }

  if (Object.keys(internUpdates).length === 0) {
    return internDTO(intern);
  }

  await withTransaction(async (session) => {
    await Intern.updateOne({ _id: intern._id }, { $set: internUpdates }, { session, runValidators: true });
    if (Object.keys(userUpdates).length > 0) {
      await User.updateOne({ _id: intern.user }, { $set: userUpdates }, { session, runValidators: true });
    }
  });

  const updated = await Intern.findById(intern._id).lean();
  return internDTO(updated);
};

export const removeIntern = async (id) => {
  assertValidId(id);

  const intern = await Intern.findOne({ _id: id, deletedAt: null });
  if (!intern) throw ApiError.notFound('Intern not found');

  const [taskCount, submissionCount] = await Promise.all([
    Task.countDocuments({ assignedTo: intern._id }),
    Submission.countDocuments({ intern: intern._id }),
  ]);

  if (taskCount > 0 || submissionCount > 0) {
    await Intern.updateOne({ _id: intern._id }, { $set: { status: INTERN_STATUS.INACTIVE, deletedAt: new Date() } });
    await User.updateOne({ _id: intern.user }, { $set: { isActive: false } });

    return {
      mode: 'archived',
      taskCount,
      submissionCount,
      message:
        'Intern archived. The account can no longer sign in, while assigned tasks and submission history were retained for audit.',
    };
  }

  await withTransaction(async (session) => {
    await Submission.deleteMany({ intern: intern._id }, { session });
    await Intern.deleteOne({ _id: intern._id }, { session });
    await User.deleteOne({ _id: intern.user }, { session });
  });

  return {
    mode: 'deleted',
    taskCount: 0,
    submissionCount: 0,
    message: 'Intern and linked account deleted successfully',
  };
};
