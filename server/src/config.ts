import path from 'node:path';

export interface Config {
  port: number;
  corsOrigins: string[];
  dataFile: string;
}

// server/ folder, so DATA_FILE does not depend on where the command is run from
const SERVER_ROOT = path.resolve(import.meta.dirname, '..');

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const port = Number(env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`PORT must be an integer between 0 and 65535 (got "${env.PORT}").`);
  }

  const corsOrigins = (env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  const dataFile = path.resolve(SERVER_ROOT, env.DATA_FILE ?? './data/complaints.json');

  return { port, corsOrigins, dataFile };
}
