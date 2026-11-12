import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';

let memoryServer = null;

const resolveDatabaseUri = async () => {
  if (env.mongoUri) return env.mongoUri;

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  memoryServer = await MongoMemoryServer.create();
  const uri = memoryServer.getUri('qubenix_intern_management');
  console.warn('[db] MONGODB_URI is empty - started a temporary in-memory MongoDB for local demo use');
  console.warn('[db] data is NOT persisted across restarts; set MONGODB_URI to MongoDB Atlas for real persistence');
  return uri;
};

const start = async () => {
  const uri = await resolveDatabaseUri();
  await connectDB(uri);

  if (env.useInMemoryDb) {
    const { seedDatabase } = await import('./seed/seed.js');
    try {
      await seedDatabase();
    } catch (error) {
      console.warn(`[seed] automatic demo seed skipped: ${error.message}`);
    }
  }

  const app = createApp();
  const server = app.listen(env.port, () => {
    const boundPort = server.address()?.port ?? env.port;
    console.log(`[api] Qubenix Intern Management API listening on http://localhost:${boundPort}`);
    console.log(`[api] environment: ${env.nodeEnv} | allowed origins: ${env.frontendUrls.join(', ')}`);
  });

  const shutdown = async (signal) => {
    console.log(`\n[api] ${signal} received, shutting down gracefully`);
    server.close(async () => {
      await disconnectDB();
      if (memoryServer) await memoryServer.stop();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

start().catch((error) => {
  console.error('[api] failed to start:', error);
  process.exit(1);
});
