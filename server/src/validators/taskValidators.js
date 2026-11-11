import { body, param, query } from 'express-validator';
import { MAX_PAGE_SIZE, PRIORITIES, TASK_STATUSES } from '../utils/constants.js';

const taskIdRule = param('id').isMongoId().withMessage('Invalid task id');

const titleRules = (optional = false) => {
  let chain = body('title');
  if (optional) chain = chain.optional();
  return chain
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 3, max: 120 })
    .withMessage('Task title must be between 3 and 120 characters');
};

const descriptionRules = (optional = false) => {
  let chain = body('description');
  if (optional) chain = chain.optional();
  return chain
    .trim()
    .notEmpty()
    .withMessage('Task description is required')
    .isLength({ min: 10, max: 4000 })
    .withMessage('Task description must be between 10 and 4000 characters');
};

const priorityRules = (optional = false) => {
  let chain = body('priority');
  if (optional) chain = chain.optional();
  return chain.isIn(PRIORITIES).withMessage(`Priority must be one of: ${PRIORITIES.join(', ')}`);
};

const deadlineRules = (optional = false) => {
  let chain = body('deadline');
  if (optional) chain = chain.optional();
  return chain
    .notEmpty()
    .withMessage('Deadline is required')
    .isISO8601()
    .withMessage('Deadline must be a valid date');
};

const statusRules = (optional = false) => {
  let chain = body('status');
  if (optional) chain = chain.optional();
  return chain.isIn(TASK_STATUSES).withMessage(`Status must be one of: ${TASK_STATUSES.join(', ')}`);
};

export const createTaskValidation = [
  titleRules(),
  descriptionRules(),
  body('assignedTo').isMongoId().withMessage('Please select a valid intern'),
  deadlineRules().custom((value) => {
    if (new Date(value).getTime() <= Date.now()) {
      throw new Error('Deadline cannot be in the past');
    }
    return true;
  }),
  priorityRules(),
];

export const updateTaskValidation = [
  taskIdRule,
  titleRules(true),
  descriptionRules(true),
  body('assignedTo').optional().isMongoId().withMessage('Please select a valid intern'),
  deadlineRules(true),
  priorityRules(true),
  statusRules(true),
];

export const taskIdValidation = [taskIdRule];

export const updateTaskStatusValidation = [
  taskIdRule,
  body('status')
    .isIn(TASK_STATUSES)
    .withMessage(`Status must be one of: ${TASK_STATUSES.join(', ')}`),
];

export const listTasksValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_PAGE_SIZE })
    .withMessage(`Limit must be between 1 and ${MAX_PAGE_SIZE}`)
    .toInt(),
  query('status').optional().isIn(TASK_STATUSES).withMessage('Invalid status filter'),
  query('priority').optional().isIn(PRIORITIES).withMessage('Invalid priority filter'),
  query('internId').optional().isMongoId().withMessage('Invalid intern filter'),
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search term is too long'),
];
