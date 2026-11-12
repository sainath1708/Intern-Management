import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

// Some local networks refuse SRV lookups from Node's resolver even though the
// system resolver works. An optional comma-separated DNS_SERVERS list keeps
// Atlas SRV connections working without changing the host configuration.
const dnsServers = (process.env.DNS_SERVERS || '')
  .split(',')
  .map((server) => server.trim())
  .filter(Boolean);
if (dnsServers.length > 0) dns.setServers(dnsServers);

const STATES = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
  99: 'uninitialized',
};

mongoose.set('strictQuery', true);

export const connectDB = async (uri = env.mongoUri) => {
  if (!uri) {
    throw new Error('A MongoDB connection string is required to start the API');
  }

  mongoose.connection.on('connected', () => {
    console.log(`[db] connected to ${mongoose.connection.name}`);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[db] connection lost');
  });
  mongoose.connection.on('error', (error) => {
    console.error(`[db] connection error: ${error.message}`);
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 15000,
    autoIndex: true,
  });

  return mongoose.connection;
};

export const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

export const getDbStatus = () => {
  const state = STATES[mongoose.connection.readyState] || 'unknown';
  return {
    status: state,
    connected: mongoose.connection.readyState === 1,
    name: mongoose.connection.name || null,
  };
};
