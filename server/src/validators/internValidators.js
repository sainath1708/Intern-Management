import { body, param, query } from 'express-validator';
import { DEPARTMENTS, INTERN_STATUSES, MAX_PAGE_SIZE } from '../utils/constants.js';
import { INDIAN_PHONE_REGEX } from '../utils/patterns.js';

const nameRules = (optional = false) => {
  let chain = body('name');
  if (optional) chain = chain.optional();
  return chain
    .trim()
    .notEmpty()
    .withMessage('Full name is required')
    .isLength({ min: 2, max: 80 })
    .withMessage('Name must be between 2 and 80 characters')
    .matches(/^[a-zA-Z][a-zA-Z\s.'-]*$/)
    .withMessage('Name may only contain letters, spaces, apostrophes, dots and hyphens');
};

const emailRules = (optional = false) => {
  let chain = body('email');
  if (optional) chain = chain.optional();
  return chain
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail();
};

const phoneRules = (optional = false) => {
  let chain = body('phone');
  if (optional) chain = chain.optional();
  return chain
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(INDIAN_PHONE_REGEX)
    .withMessage('Please provide a valid Indian mobile number (e.g. +91 98765 43210)');
};

const departmentRules = (optional = false) => {
  let chain = body('department');
  if (optional) chain = chain.optional();
  return chain
    .trim()
    .notEmpty()
    .withMessage('Department is required')
    .isIn(DEPARTMENTS)
    .withMessage(`Department must be one of: ${DEPARTMENTS.join(', ')}`);
};

const joiningDateRules = (optional = false) => {
  let chain = body('joiningDate');
  if (optional) chain = chain.optional();
  return chain
    .notEmpty()
    .withMessage('Joining date is required')
    .isISO8601()
    .withMessage('Joining date must be a valid date')
    .toDate();
};

const statusRules = (optional = true) => {
  let chain = body('status');
  if (optional) chain = chain.optional();
  return chain.isIn(INTERN_STATUSES).withMessage(`Status must be one of: ${INTERN_STATUSES.join(', ')}`);
};

export const createInternValidation = [
  nameRules(),
  emailRules(),
  body('password')
    .isString()
    .withMessage('Password is required')
    .isLength({ min: 8, max: 128 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[a-z]/)
    .withMessage('Password must include a lowercase letter')
    .matches(/[A-Z]/)
    .withMessage('Password must include an uppercase letter')
    .matches(/\d/)
    .withMessage('Password must include a number'),
  phoneRules(),
  departmentRules(),
  joiningDateRules(),
  statusRules(),
];

export const updateInternValidation = [
  param('id').isMongoId().withMessage('Invalid intern id'),
  nameRules(true),
  emailRules(true),
  phoneRules(true),
  departmentRules(true),
  joiningDateRules(true),
  statusRules(),
];

export const internIdValidation = [param('id').isMongoId().withMessage('Invalid intern id')];

export const listInternsValidation = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer').toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: MAX_PAGE_SIZE })
    .withMessage(`Limit must be between 1 and ${MAX_PAGE_SIZE}`)
    .toInt(),
  query('status').optional().isIn(INTERN_STATUSES).withMessage('Invalid status filter'),
  query('department').optional().isIn(DEPARTMENTS).withMessage('Invalid department filter'),
  query('search').optional().isString().trim().isLength({ max: 100 }).withMessage('Search term is too long'),
];
