import { User } from '../models/User.js';
import { Intern } from '../models/Intern.js';
import { ApiError } from '../utils/ApiError.js';
import { signAccessToken } from '../utils/token.js';
import { userDTO } from '../utils/serializers.js';
import { ROLES } from '../utils/constants.js';

export const login = async ({ email, password }) => {
  const normalizedEmail = String(email).trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail }).select('+passwordHash');

  if (!user) throw ApiError.unauthorized('Invalid email or password');

  const passwordMatches = await user.verifyPassword(password);
  if (!passwordMatches) throw ApiError.unauthorized('Invalid email or password');

  if (!user.isActive) {
    throw ApiError.forbidden('This account has been deactivated. Contact a Qubenix AI administrator.');
  }

  let intern = null;
  if (user.role === ROLES.INTERN) {
    intern = await Intern.findOne({ user: user._id, deletedAt: null });
    if (!intern) throw ApiError.forbidden('No active intern profile is linked to this account');
    if (intern.status !== 'active') throw ApiError.forbidden('Your intern profile is inactive. Contact a Qubenix AI administrator.');
  }

  const token = signAccessToken(user);

  return {
    token,
    user: userDTO(user, intern),
  };
};

export const getSessionUser = async (user) => {
  const intern = user.role === ROLES.INTERN ? await Intern.findOne({ user: user._id, deletedAt: null }) : null;
  return { user: userDTO(user, intern) };
};
