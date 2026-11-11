const toIso = (value) => (value ? new Date(value).toISOString() : null);

export const internSummary = (intern) => {
  if (!intern) return null;
  // Populated document or plain object; ids may be ObjectId instances.
  const id = intern._id || intern.id;
  if (!id) return null;
  return {
    id: String(id),
    name: intern.name,
    email: intern.email,
    department: intern.department,
    status: intern.status,
  };
};

export const internDTO = (intern, extra = {}) => {
  if (!intern) return null;
  const source = typeof intern.toObject === 'function' ? intern.toObject() : intern;
  return {
    id: String(source._id || source.id),
    userId: source.user?._id ? String(source.user._id) : source.user ? String(source.user) : null,
    name: source.name,
    email: source.email,
    phone: source.phone,
    department: source.department,
    joiningDate: toIso(source.joiningDate),
    status: source.status,
    createdAt: toIso(source.createdAt),
    updatedAt: toIso(source.updatedAt),
    ...extra,
  };
};

export const taskDTO = (task, extra = {}) => {
  if (!task) return null;
  const source = typeof task.toObject === 'function' ? task.toObject() : task;
  const assigned = source.assignedTo;
  const isPopulatedIntern = assigned && typeof assigned === 'object' && assigned.name;

  return {
    id: String(source._id || source.id),
    title: source.title,
    description: source.description,
    assignedTo: isPopulatedIntern ? internSummary(assigned) : String(assigned),
    deadline: toIso(source.deadline),
    priority: source.priority,
    status: source.status,
    createdBy: source.createdBy?._id ? String(source.createdBy._id) : source.createdBy ? String(source.createdBy) : null,
    completedAt: toIso(source.completedAt),
    createdAt: toIso(source.createdAt),
    updatedAt: toIso(source.updatedAt),
    ...extra,
  };
};

export const submissionDTO = (submission, extra = {}) => {
  if (!submission) return null;
  const source = typeof submission.toObject === 'function' ? submission.toObject() : submission;
  const task = source.task;
  const intern = source.intern;

  const populatedTask = task && typeof task === 'object' && task.title;
  const populatedIntern = intern && typeof intern === 'object' && intern.name;

  return {
    id: String(source._id || source.id),
    task: populatedTask
      ? {
          id: String(task._id || task.id),
          title: task.title,
          status: task.status,
          priority: task.priority,
          deadline: toIso(task.deadline),
        }
      : String(task),
    intern: populatedIntern ? internSummary(intern) : String(intern),
    description: source.description,
    githubUrl: source.githubUrl || '',
    documentUrl: source.documentUrl || '',
    submittedAt: toIso(source.submittedAt),
    reviewStatus: source.reviewStatus,
    adminFeedback: source.adminFeedback || '',
    attempt: source.attempt,
    reviewedAt: toIso(source.reviewedAt),
    reviewedBy: source.reviewedBy?._id ? String(source.reviewedBy._id) : source.reviewedBy ? String(source.reviewedBy) : null,
    createdAt: toIso(source.createdAt),
    updatedAt: toIso(source.updatedAt),
    ...extra,
  };
};

export const userDTO = (user, intern = null) => {
  if (!user) return null;
  return {
    id: String(user._id || user.id),
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive !== false,
    createdAt: toIso(user.createdAt),
    intern: intern
      ? {
          id: String(intern._id || intern.id),
          department: intern.department,
          phone: intern.phone,
          status: intern.status,
          joiningDate: toIso(intern.joiningDate),
        }
      : null,
  };
};
