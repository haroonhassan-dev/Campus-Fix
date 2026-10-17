import http from 'node:http';
import { createApp } from './app.ts';
import { loadConfig } from './config.ts';
import { createStore } from './store.ts';

const config = loadConfig();
const store = await createStore(config.dataFile);
const server = http.createServer(createApp(store, config.corsOrigins));

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[campusfix-api] Port ${config.port} is already in use. Stop the other process or set PORT.`);
  } else {
    console.error('[campusfix-api] Server error:', err);
  }
  process.exit(1);
});

server.listen(config.port, () => {
  console.log(`[campusfix-api] Listening on http://localhost:${config.port}/api`);
  console.log(`[campusfix-api] Data file: ${config.dataFile}`);
  console.log(`[campusfix-api] CORS origins: ${config.corsOrigins.join(', ') || '(none)'}`);
});

// Finish in-flight requests (and their file writes) before exiting
for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    console.log(`[campusfix-api] ${signal} received, shutting down.`);
    server.close(() => process.exit(0));
  });
}
