import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    fileParallelism: false,
    pool: 'forks',
    testTimeout: 30000,
    hookTimeout: 180000,
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-only-jwt-secret-with-more-than-32-characters',
      JWT_EXPIRES_IN: '1d',
      MONGODB_URI: 'mongodb://127.0.0.1:27017/qubenix-test-placeholder',
      USE_IN_MEMORY_DB: 'false',
      FRONTEND_URL: 'http://localhost:5173',
      ADMIN_NAME: 'Qubenix Test Admin',
      ADMIN_EMAIL: 'admin@test.qubenix.ai',
      ADMIN_PASSWORD: 'Admin@12345',
      SEED_INTERN_PASSWORD: 'Intern@12345',
    },
  },
});
