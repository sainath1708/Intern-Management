import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

const ISSUER = 'qubenix-intern-management';
const AUDIENCE = 'qubenix-web-client';

export const signAccessToken = (user) =>
  jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
    },
    env.jwtSecret,
    {
      expiresIn: env.jwtExpiresIn,
      issuer: ISSUER,
      audience: AUDIENCE,
    },
  );

/**
 * Verifies signature, expiry, issuer and audience.
 * Throws jsonwebtoken errors which the auth middleware maps to 401 responses.
 */
export const verifyAccessToken = (token) => jwt.verify(token, env.jwtSecret, { issuer: ISSUER, audience: AUDIENCE });
