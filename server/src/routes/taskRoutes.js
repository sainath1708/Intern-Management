import { Router } from 'express';
import {
  deleteTaskHandler,
  getTask,
  getTasks,
  patchTaskStatus,
  postTask,
  putTask,
} from '../controllers/taskController.js';
import {
  createTaskValidation,
  listTasksValidation,
  taskIdValidation,
  updateTaskStatusValidation,
  updateTaskValidation,
} from '../validators/taskValidators.js';
import { createSubmissionValidation } from '../validators/submissionValidators.js';
import { validate } from '../middleware/validate.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { submissionLimiter } from '../middleware/rateLimiters.js';
import { postSubmission } from '../controllers/submissionController.js';
import { ROLES } from '../utils/constants.js';

const router = Router();

router.use(authenticate);

// Both roles can read, but the service scopes interns to their own tasks.
router.get('/', listTasksValidation, validate, getTasks);
router.get('/:id', taskIdValidation, validate, getTask);

router.post('/', authorize(ROLES.ADMIN), createTaskValidation, validate, postTask);
router.put('/:id', authorize(ROLES.ADMIN), updateTaskValidation, validate, putTask);
router.delete('/:id', authorize(ROLES.ADMIN), taskIdValidation, validate, deleteTaskHandler);

// Only the assigned intern can move the task forward (Pending -> In Progress).
router.patch('/:id/status', authorize(ROLES.INTERN), updateTaskStatusValidation, validate, patchTaskStatus);

// Interns submit work against their own tasks.
router.post(
  '/:id/submissions',
  authorize(ROLES.INTERN),
  submissionLimiter,
  createSubmissionValidation,
  validate,
  postSubmission,
);

export default router;
