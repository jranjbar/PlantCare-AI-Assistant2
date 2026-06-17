import { Router } from 'express';
import { env } from '../utils/env';

export const healthRouter = Router();

healthRouter.get('/health', (req, res) => {
  res.json({ status: 'ok', hasApiKey: !!env.geminiApiKey, telegramConfigured: !!env.telegramToken });
});
