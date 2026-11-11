import {
  createTask,
  deleteTask,
  getTaskById,
  listTasks,
  updateTask,
  updateTaskStatusAsIntern,
} from '../services/taskService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const getTasks = asyncHandler(async (req, res) => {
  const result = await listTasks({ user: req.user, internProfile: req.intern, query: req.query });
  return sendSuccess(res, result, 'Tasks loaded successfully');
});

export const getTask = asyncHandler(async (req, res) => {
  const result = await getTaskById({ user: req.user, internProfile: req.intern, taskId: req.params.id });
  return sendSuccess(res, result, 'Task loaded successfully');
});

export const postTask = asyncHandler(async (req, res) => {
  const task = await createTask({ payload: req.body, adminId: req.user._id });
  return sendCreated(res, { task }, 'Task created successfully');
});

export const putTask = asyncHandler(async (req, res) => {
  const task = await updateTask({ taskId: req.params.id, payload: req.body });
  return sendSuccess(res, { task }, 'Task updated successfully');
});

export const deleteTaskHandler = asyncHandler(async (req, res) => {
  const result = await deleteTask(req.params.id);
  return sendSuccess(res, result, result.message);
});

export const patchTaskStatus = asyncHandler(async (req, res) => {
  const task = await updateTaskStatusAsIntern({
    taskId: req.params.id,
    internProfile: req.intern,
    status: req.body.status,
  });
  return sendSuccess(res, { task }, `Task moved to ${task.status}`);
});
