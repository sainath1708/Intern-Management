import { body, param, query } from 'express-validator';
import { MAX_PAGE_SIZE, REVIEW_STATUS } from '../utils/constants.js';

const urlRule = (field, label) =>
  body(field)
    .optional({ checkFalsy: true })
    .trim()
    .isURL({ protocols: ['http', 'https'], require_protocol: true })
    .withMessage(`${label} must be a valid HTTP or HTTPS URL`)
    .isLength({ max: 500 })
    .withMessage(`${label} is too long`);

export const createSubmissionValidation = [
  param('id').isMongoId().withMessage('Invalid task id'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Work description is required')
    .isLength({ min: 10, max: 4000 })
    .withMessage('Work description must be between 10 and 4000 characters'),
  urlRule('githubUrl', 'GitHub URL'),
  urlRule('documentUrl', 'Document URL'),
  body().custom((_value, { req }) => {
    if (!req.body.githubUrl?.trim() && !req.body.documentUrl?.trim()) {
      throw new Error('Provide at least one work link: a GitHub URL or a document URL');
    }
    return true;
  }),
];

export const reviewSubmissionValidation = [
  param('id').isMongoId().withMessage('Invalid submission id'),
  body('reviewStatus')
    .isIn([REVIEW_STATUS.APPROVED, REVIEW_STATUS.NEEDS_CHANGES])
    .withMessage('Review status must be either Approved or Needs Changes'),
  body('adminFeedback')
    .optional({ nullable: true })
    .isString()
    .withMessage('Feedback must be text')
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Feedback cannot exceed 2000 characters'),
  body('adminFeedback').custom((value, { req }) => {
    if (req.body.reviewStatus === REVIEW_STATUS.NEEDS_CHANGES && String(value || '').trim().length < 10) {
      throw new Error('Please explain what needs to change (minimum 10 characters)');
    }
    return true;
  }),
];

export const listSubmissionsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_PAGE_SIZE })
    .withMessage(`Limit must be between 1 and ${MAX_PAGE_SIZE}`)
    .toInt(),
  query('reviewStatus').optional().isIn(Object.values(REVIEW_STATUS)).withMessage('Invalid review status filter'),
  query('internId').optional().isMongoId().withMessage('Invalid intern filter'),
  query('taskId').optional().isMongoId().withMessage('Invalid task filter'),
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search term is too long'),
];
