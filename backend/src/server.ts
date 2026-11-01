import http from 'http';
import app from './app.js';
import { TempStorageManager } from './storage/tempManager.js';

const PORT = process.env.PORT || 5000;

async function bootstrap(): Promise<void> {
  await TempStorageManager.init();

  setInterval(() => {
    TempStorageManager.cleanExpiredFiles();
  }, 30 * 60 * 1000);

  const server = http.createServer(app);

  server.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` 🎵 MAXISTRONG BACKEND RUNNING ON PORT ${PORT}`);
    console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(` Dev Mock Mode: ${process.env.DEV_MOCK_MODE || 'true'}`);
    console.log(`==================================================`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}. Gracefully shutting down...`);
    server.close(() => {
      console.log('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
