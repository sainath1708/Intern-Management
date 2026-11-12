import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { Intern } from '../models/Intern.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { verifyAccessToken } from '../utils/token.js';
import { ROLES } from '../utils/constants.js';

export const authenticate = asyncHandler(async (req, _res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    throw ApiError.unauthorized('Authentication token is missing');
  }

  let payload;
  try {
    payload = verifyAccessToken(token);
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Your session has expired. Please log in again.');
    }
    throw ApiError.unauthorized('Invalid authentication token');
  }

  const user = await User.findById(payload.sub);
  if (!user) throw ApiError.unauthorized('The account linked to this session no longer exists');
  if (!user.isActive) throw ApiError.forbidden('This account has been deactivated. Contact a Qubenix AI administrator.');

  req.user = user;

  if (user.role === ROLES.INTERN) {
    const intern = await Intern.findOne({ user: user._id, deletedAt: null });
    if (!intern) throw ApiError.forbidden('No active intern profile is linked to this account');
    if (intern.status !== 'active') throw ApiError.forbidden('Your intern profile is inactive. Contact a Qubenix AI administrator.');
    req.intern = intern;
  }

  next();
});

export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(ApiError.forbidden('You do not have permission to access this resource'));
    }
    return next();
  };
