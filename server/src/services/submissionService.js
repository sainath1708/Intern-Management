import mongoose from 'mongoose';
import { Task } from '../models/Task.js';
import { Submission } from '../models/Submission.js';
import { Intern } from '../models/Intern.js';
import { ApiError } from '../utils/ApiError.js';
import { submissionDTO } from '../utils/serializers.js';
import { escapeRegex, paginationMeta, parsePagination } from '../utils/pagination.js';
import { withTransaction } from './transaction.js';
import { REVIEW_STATUS, TASK_STATUS } from '../utils/constants.js';

const assertValidId = (id) => {
  if (!mongoose.isValidObjectId(id)) throw ApiError.badRequest('Invalid submission id');
};

const submissionPopulate = (query) =>
  query
    .populate('task', 'title status priority deadline')
    .populate('intern', 'name email department')
    .populate('reviewedBy', 'name');

export const createSubmission = async ({ taskId, internProfile, payload }) => {
  if (!mongoose.isValidObjectId(taskId)) throw ApiError.badRequest('Invalid task id');

  const task = await Task.findById(taskId);
  if (!task) throw ApiError.notFound('Task not found');

  if (String(task.assignedTo) !== String(internProfile._id)) {
    throw ApiError.forbidden('This task is not assigned to you');
  }

  if (task.status === TASK_STATUS.COMPLETED) {
    throw ApiError.badRequest('This task is already completed. New submissions are not allowed.');
  }

  const latest = await Submission.findOne({ task: task._id }).sort({ submittedAt: -1 }).lean();
  if (latest && latest.reviewStatus === REVIEW_STATUS.SUBMITTED) {
    throw ApiError.conflict('Your previous submission is awaiting review. You can submit again once feedback is provided.');
  }

  const attempt = (await Submission.countDocuments({ task: task._id })) + 1;

  const submission = await Submission.create({
    task: task._id,
    intern: internProfile._id,
    description: payload.description.trim(),
    githubUrl: payload.githubUrl?.trim() || '',
    documentUrl: payload.documentUrl?.trim() || '',
    reviewStatus: REVIEW_STATUS.SUBMITTED,
    attempt,
  });

  // A submitted piece of work always keeps the task in progress.
  if (task.status !== TASK_STATUS.IN_PROGRESS) {
    task.status = TASK_STATUS.IN_PROGRESS;
    await task.save();
  }

  const populated = await submissionPopulate(Submission.findById(submission._id)).lean();
  return submissionDTO(populated);
};

export const listSubmissions = async (query = {}) => {
  const { page, limit, skip } = parsePagination(query);
  const filter = {};

  if (query.reviewStatus) filter.reviewStatus = query.reviewStatus;
  if (query.taskId) {
    if (!mongoose.isValidObjectId(query.taskId)) throw ApiError.badRequest('Invalid task filter');
    filter.task = query.taskId;
  }
  if (query.internId) {
    if (!mongoose.isValidObjectId(query.internId)) throw ApiError.badRequest('Invalid intern filter');
    filter.intern = query.internId;
  }

  const term = String(query.search || '').trim();
  if (term) {
    const regex = new RegExp(escapeRegex(term), 'i');
    const [internIds, taskIds] = await Promise.all([
      Intern.find({ name: regex }).select('_id').lean(),
      Task.find({ title: regex }).select('_id').lean(),
    ]);
    filter.$or = [
      { description: regex },
      { intern: { $in: internIds.map((item) => item._id) } },
      { task: { $in: taskIds.map((item) => item._id) } },
    ];
  }

  const [submissions, total, statusGroups] = await Promise.all([
    submissionPopulate(Submission.find(filter)).sort({ submittedAt: -1 }).skip(skip).limit(limit).lean(),
    Submission.countDocuments(filter),
    Submission.aggregate([{ $group: { _id: '$reviewStatus', count: { $sum: 1 } } }]),
  ]);

  const summary = { Submitted: 0, Approved: 0, 'Needs Changes': 0 };
  statusGroups.forEach((group) => {
    if (group._id in summary) summary[group._id] = group.count;
  });

  return {
    items: submissions.map((submission) => submissionDTO(submission)),
    pagination: paginationMeta({ page, limit, total }),
    summary,
  };
};

export const reviewSubmission = async ({ submissionId, adminId, reviewStatus, adminFeedback }) => {
  assertValidId(submissionId);

  const submission = await Submission.findById(submissionId);
  if (!submission) throw ApiError.notFound('Submission not found');

  if (submission.reviewStatus === REVIEW_STATUS.APPROVED) {
    throw ApiError.conflict('This submission has already been approved and cannot be reviewed again.');
  }

  const feedback = String(adminFeedback || '').trim();

  if (reviewStatus === REVIEW_STATUS.NEEDS_CHANGES && feedback.length < 10) {
    throw ApiError.badRequest('Feedback of at least 10 characters is required when requesting changes', [
      { field: 'adminFeedback', message: 'Please explain what needs to change (minimum 10 characters)' },
    ]);
  }

  const task = await Task.findById(submission.task);
  if (!task) throw ApiError.notFound('The task linked to this submission no longer exists');

  await withTransaction(async (session) => {
    submission.reviewStatus = reviewStatus;
    submission.adminFeedback = feedback;
    submission.reviewedBy = adminId;
    submission.reviewedAt = new Date();
    await submission.save({ session });

    if (reviewStatus === REVIEW_STATUS.APPROVED) {
      task.status = TASK_STATUS.COMPLETED;
      task.completedAt = new Date();
    } else {
      task.status = TASK_STATUS.IN_PROGRESS;
      task.completedAt = null;
    }
    await task.save({ session });
  });

  const populated = await submissionPopulate(Submission.findById(submission._id)).lean();

  return {
    submission: submissionDTO(populated),
    task: {
      id: String(task._id),
      title: task.title,
      status: task.status,
    },
  };
};
