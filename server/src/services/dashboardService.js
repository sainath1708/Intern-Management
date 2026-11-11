import { Intern } from '../models/Intern.js';
import { Task } from '../models/Task.js';
import { Submission } from '../models/Submission.js';
import { submissionDTO, taskDTO } from '../utils/serializers.js';
import { REVIEW_STATUS, TASK_STATUS } from '../utils/constants.js';

export const getAdminStats = async () => {
  const now = new Date();

  const [
    totalInterns,
    activeInterns,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    pendingReview,
    recentSubmissions,
    recentTasks,
  ] = await Promise.all([
    Intern.countDocuments({ deletedAt: null }),
    Intern.countDocuments({ deletedAt: null, status: 'active' }),
    Task.countDocuments({}),
    Task.countDocuments({ status: TASK_STATUS.COMPLETED }),
    Task.countDocuments({ status: TASK_STATUS.PENDING }),
    Task.countDocuments({ status: TASK_STATUS.IN_PROGRESS }),
    Task.countDocuments({ status: { $ne: TASK_STATUS.COMPLETED }, deadline: { $lt: now } }),
    Submission.countDocuments({ reviewStatus: REVIEW_STATUS.SUBMITTED }),
    Submission.find({})
      .sort({ submittedAt: -1 })
      .limit(6)
      .populate('task', 'title status priority deadline')
      .populate('intern', 'name email department')
      .lean(),
    Task.find({}).sort({ createdAt: -1 }).limit(5).populate('assignedTo', 'name email department').lean(),
  ]);

  return {
    totalInterns,
    activeInterns,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    overdueTasks,
    pendingReview,
    recentSubmissions: recentSubmissions.map((submission) => submissionDTO(submission)),
    recentTasks: recentTasks.map((task) => taskDTO(task)),
  };
};

export const getInternStats = async (internProfile) => {
  const [totalTasks, pendingTasks, inProgressTasks, completedTasks, submissions, feedbackRequired, upcoming] =
    await Promise.all([
      Task.countDocuments({ assignedTo: internProfile._id }),
      Task.countDocuments({ assignedTo: internProfile._id, status: TASK_STATUS.PENDING }),
      Task.countDocuments({ assignedTo: internProfile._id, status: TASK_STATUS.IN_PROGRESS }),
      Task.countDocuments({ assignedTo: internProfile._id, status: TASK_STATUS.COMPLETED }),
      Submission.find({ intern: internProfile._id })
        .sort({ submittedAt: -1 })
        .limit(5)
        .populate('task', 'title status priority deadline')
        .lean(),
      Submission.countDocuments({ intern: internProfile._id, reviewStatus: REVIEW_STATUS.NEEDS_CHANGES }),
      Task.find({ assignedTo: internProfile._id, status: { $ne: TASK_STATUS.COMPLETED } })
        .sort({ deadline: 1 })
        .limit(4)
        .populate('assignedTo', 'name email department')
        .lean(),
    ]);

  return {
    intern: {
      id: String(internProfile._id),
      name: internProfile.name,
      department: internProfile.department,
    },
    totalTasks,
    pendingTasks,
    inProgressTasks,
    completedTasks,
    needsChanges: feedbackRequired,
    completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
    recentSubmissions: submissions.map((submission) => submissionDTO(submission)),
    upcomingTasks: upcoming.map((task) => taskDTO(task)),
  };
};
