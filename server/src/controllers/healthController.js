import { getDbStatus } from '../config/db.js';
import { sendSuccess } from '../utils/response.js';

export const getHealth = (_req, res) => {
  const database = getDbStatus();
  const statusCode = database.connected ? 200 : 503;

  return sendSuccess(
    res,
    {
      status: database.connected ? 'ok' : 'degraded',
      environment: process.env.NODE_ENV || 'development',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      database,
    },
    database.connected ? 'API and database are healthy' : 'API is running but the database is unavailable',
    statusCode,
  );
};
