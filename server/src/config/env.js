import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const currentDir = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(currentDir, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';
const isTest = nodeEnv === 'test';
const useInMemoryDb = String(process.env.USE_IN_MEMORY_DB || '').toLowerCase() === 'true';

const problems = [];

const requireInProduction = (key, value) => {
  if (isProduction && !value) problems.push(`${key} is required when NODE_ENV=production`);
  return value;
};

const mongoUri = process.env.MONGODB_URI?.trim() || '';
if (!mongoUri && !useInMemoryDb) {
  problems.push('MONGODB_URI is required (or set USE_IN_MEMORY_DB=true for a local demo database)');
}
if (useInMemoryDb && isProduction) {
  problems.push('USE_IN_MEMORY_DB is not allowed when NODE_ENV=production');
}

const jwtSecret =
  requireInProduction('JWT_SECRET', process.env.JWT_SECRET?.trim()) ||
  (isProduction ? '' : 'dev-only-jwt-secret-do-not-use-in-production-please-change-me');

if (jwtSecret && jwtSecret.length < 32) {
  problems.push('JWT_SECRET must be at least 32 characters long');
}

requireInProduction('FRONTEND_URL', process.env.FRONTEND_URL?.trim());

const parseTrustProxy = (value) => {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (normalized === 'true') return 1;
  if (normalized === 'false' || normalized === '0') return false;
  const parsed = Number.parseInt(normalized, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 1;
};

if (problems.length > 0) {
  const message = `Invalid environment configuration:\n  - ${problems.join('\n  - ')}`;
  console.error(`\n[config] ${message}\n`);
  if (isProduction) process.exit(1);
}

const frontendUrls = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
const port = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 5000;

export const env = Object.freeze({
  nodeEnv,
  isProduction,
  isTest,
  isDevelopment: !isProduction && !isTest,
  port,
  mongoUri,
  useInMemoryDb,
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  frontendUrls,
  admin: Object.freeze({
    name: process.env.ADMIN_NAME?.trim() || '',
    email: process.env.ADMIN_EMAIL?.trim().toLowerCase() || '',
    password: process.env.ADMIN_PASSWORD || '',
  }),
  seedInternPassword: process.env.SEED_INTERN_PASSWORD || '',
  trustProxy: parseTrustProxy(process.env.TRUST_PROXY),
  bcryptRounds: 12,
});
