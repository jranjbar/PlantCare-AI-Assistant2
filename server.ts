import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { env, warnOnInsecureDefaults } from './src/utils/env';
import { createLogger } from './src/utils/logger';
import { apiRouter } from './src/api/router';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler';
import { requestLogger } from './src/middleware/requestLogger';
import { seedDatabase } from './src/database/seed';
import { startScheduler } from './src/services/schedulerService';
import { MEDIA_DIR } from './src/database/paths';

const logger = createLogger('server');
const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ limit: '20mb', extended: true }));
app.use(cookieParser());
app.use(requestLogger);

// فایل‌های رسانه (عکس/ویدئوی گیاهان) از این مسیر سرو می‌شوند
app.use('/media', express.static(MEDIA_DIR));

app.use('/api', apiRouter);
app.use('/api', notFoundHandler);
app.use(errorHandler);

async function startServer() {
  await seedDatabase();
  warnOnInsecureDefaults(logger);
  startScheduler();

  if (!env.isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = __dirname;
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(env.port, '0.0.0.0', () => {
    logger.info(`PlantCare AI Assistant روی http://localhost:${env.port} در حال اجراست (env: ${env.nodeEnv})`);
  });
}

startServer();
