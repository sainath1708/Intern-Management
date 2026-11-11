import {
  createIntern,
  getInternById,
  listInterns,
  removeIntern,
  updateIntern,
} from '../services/internService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendCreated, sendSuccess } from '../utils/response.js';

export const getInterns = asyncHandler(async (req, res) => {
  const result = await listInterns(req.query);
  return sendSuccess(res, result, 'Interns loaded successfully');
});

export const getIntern = asyncHandler(async (req, res) => {
  const result = await getInternById(req.params.id);
  return sendSuccess(res, result, 'Intern loaded successfully');
});

export const postIntern = asyncHandler(async (req, res) => {
  const intern = await createIntern(req.body);
  return sendCreated(res, { intern }, 'Intern created successfully');
});

export const putIntern = asyncHandler(async (req, res) => {
  const intern = await updateIntern(req.params.id, req.body);
  return sendSuccess(res, { intern }, 'Intern updated successfully');
});

export const deleteIntern = asyncHandler(async (req, res) => {
  const result = await removeIntern(req.params.id);
  return sendSuccess(res, result, result.message);
});
