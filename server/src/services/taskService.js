import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { Intern } from '../models/Intern.js';
import { Submission } from '../models/Submission.js';
import { ApiError } from '../utils/ApiError.js';
import { submissionDTO, taskDTO } from '../utils/serializers.js';
import { escapeRegex, paginationMeta, parsePagination } from '../utils/pagination.js';
import { withTransaction } from './transaction.js';
import { ROLES, TASK_STATUS } from '../utils/constants.js';

const assertValidTaskId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid task id');
};

const withPopulatedIntern = (query) =>
  query.populate('assignedTo', 'name email department status').populate('createdBy', 'name email');

const latestSubmissionMap = async (taskIds) => {
  if (taskIds.length === 0) return new Map();

  const submissions = await Submission.find({ task: { $in: taskIds } })
    .sort({ submittedAt: -1 })
    .select('task reviewStatus submittedAt attempt')
    .lean();

  const map = new Map();
  for (const submission of submissions) {
    const key = String(submission.task);
    if (!map.has(key)) {
      map.set(key, {
        id: String(submission._id),
        reviewStatus: submission.reviewStatus,
        submittedAt: submission.submittedAt,
        attempt: submission.attempt,
      });
    }
  }
  return map;
};

const findAssignableIntern = async (internId) => {
  if (!mongoose.isValidObjectId(internId)) throw ApiError.badRequest('Assigned intern is invalid');

  const intern = await Intern.findOne({ _id: internId, deletedAt: null });
  if (!intern) throw ApiError.badRequest('Assigned intern could not be found');
  if (intern.status !== 'active') throw ApiError.badRequest('Tasks can only be assigned to active interns');
  return intern;
};

export const listTasks = async ({ user, internProfile, query = {} }) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (user.role === ROLES.INTERN) {
    filter.assignedTo = internProfile._id;
  } else if (query.internId) {
    if (!mongoose.isValidObjectId(query.internId)) throw ApiError.badRequest('Invalid intern filter');
    filter.assignedTo = query.internId;
  }

  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;

  const term = String(query.search || '').trim();
  if (term) {
    const regex = new RegExp(escapeRegex(term), 'i');
    filter.$or = [{ title: regex }, { description: regex }];
  }

  const [tasks, total] = await Promise.all([
    withPopulatedIntern(Task.find(filter)).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Task.countDocuments(filter),
  ]);

  const latestByTask = await latestSubmissionMap(tasks.map((task) => task._id));

  return {
    items: tasks.map((task) => taskDTO(task, { latestSubmission: latestByTask.get(String(task._id)) || null })),
    pagination: paginationMeta({ page, limit, total }),
  };
};

export const getTaskById = async ({ user, internProfile, taskId }) => {
  assertValidTaskId(taskId);

  const task = await withPopulatedIntern(Task.findById(taskId)).lean();
  if (!task) throw ApiError.notFound('Task not found');

  if (user.role === ROLES.INTERN && String(task.assignedTo?._id) !== String(internProfile._id)) {
    throw ApiError.forbidden('This task is not assigned to you');
  }

  const submissions = await Submission.find({ task: task._id })
    .sort({ submittedAt: -1 })
    .populate('reviewedBy', 'name')
    .lean();

  return {
    task: taskDTO(task),
    submissions: submissions.map((submission) =>
      submissionDTO(submission, { reviewedByName: submission.reviewedBy?.name || null }),
    ),
  };
};

export const createTask = async ({ payload, adminId }) => {
  await findAssignableIntern(payload.assignedTo);

  if (new Date(payload.deadline).getTime() <= Date.now()) {
    throw ApiError.badRequest('Deadline cannot be in the past');
  }

  const task = await Task.create({
    title: payload.title.trim(),
    description: payload.description.trim(),
    assignedTo: payload.assignedTo,
    deadline: payload.deadline,
    priority: payload.priority,
    status: TASK_STATUS.PENDING,
    createdBy: adminId,
  });

  const populated = await withPopulatedIntern(Task.findById(task._id)).lean();
  return taskDTO(populated);
};

export const updateTask = async ({ taskId, payload }) => {
  assertValidTaskId(taskId);

  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');

  if (payload.assignedTo !== undefined && String(payload.assignedTo) !== String(task.assignedTo)) {
    const submissionCount = await Submission.countDocuments({ task: task._id });
    if (submissionCount > 0) {
      throw ApiError.conflict('This task has submission history and cannot be reassigned to another intern');
    }
    await findAssignableIntern(payload.assignedTo);
    task.assignedTo = payload.assignedTo;
  }

  if (payload.title !== undefined) task.title = payload.title.trim();
  if (payload.description !== undefined) task.description = payload.description.trim();
  if (payload.priority !== undefined) task.priority = payload.priority;
  if (payload.deadline !== undefined) task.deadline = payload.deadline;

  if (payload.status !== undefined && payload.status !== task.status) {
    task.status = payload.status;
    task.completedAt = payload.status === TASK_STATUS.COMPLETED ? new Date() : null;
  }

  await task.save();

  const updated = await withPopulatedIntern(Task.findById(task._id)).lean();
  return taskDTO(updated);
};

export const deleteTask = async (taskId) => {
  assertValidTaskId(taskId);

  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');

  const submissionCount = await Submission.countDocuments({ task: task._id });

  await withTransaction(async (session) => {
    await Submission.deleteMany({ task: task._id }, { session });
    await Task.deleteOne({ _id: task._id }, { session });
  });

  return {
    deletedTaskId: String(task._id),
    deletedSubmissions: submissionCount,
    message:
      submissionCount > 0
        ? `Task deleted along with ${submissionCount} submission record(s)`
        : 'Task deleted successfully',
  };
};

export const updateTaskStatusAsIntern = async ({ taskId, internProfile, status }) => {
  assertValidTaskId(taskId);

  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');

  if (String(task.assignedTo) !== String(internProfile._id)) {
    throw ApiError.forbidden('This task is not assigned to you');
  }

  if (status === TASK_STATUS.COMPLETED) {
    throw ApiError.forbidden('Interns cannot mark a task as completed. Submit your work for admin review.');
  }

  if (task.status === TASK_STATUS.COMPLETED) {
    throw ApiError.badRequest('Completed tasks cannot be reopened');
  }

  if (status !== TASK_STATUS.IN_PROGRESS) {
    throw ApiError.badRequest('Interns can only move a task to In Progress');
  }

  if (task.status !== TASK_STATUS.IN_PROGRESS) {
    task.status = TASK_STATUS.IN_PROGRESS;
    await task.save();
  }

  const updated = await withPopulatedIntern(Task.findById(task._id)).lean();
  return taskDTO(updated);
};
