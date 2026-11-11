import { login as loginService, getSessionUser } from '../services/authService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const login = asyncHandler(async (req, res) => {
  const result = await loginService({ email: req.body.email, password: req.body.password });
  return sendSuccess(res, result, 'Logged in successfully');
});

export const me = asyncHandler(async (req, res) => {
  const result = await getSessionUser(req.user);
  return sendSuccess(res, result, 'Session loaded successfully');
});
