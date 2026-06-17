import { Router } from 'express';
import { telegramWebhookController } from '../telegram/webhookController';
import { requireTelegramSecret } from '../middleware/authMiddleware';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { store } from '../database/db';
import { getMemory, clearMemory } from '../services/memoryService';

export const telegramWebhookRouter = Router();

// این مسیر توسط خودِ تلگرام صدا زده می‌شود، نه ادمین؛ با هدر سکرت محافظت می‌شود
telegramWebhookRouter.post('/telegram', (req, res, next) => {
  const db = store.read();
  return requireTelegramSecret(db.telegramSettings.webhookSecret)(req, res, next);
}, telegramWebhookController);

export const memoryRouter = Router();

memoryRouter.get('/admin/users/:chatId/memory', requireAdminAuth, (req, res) => {
  res.json(getMemory(req.params.chatId));
});

memoryRouter.delete(
  '/admin/users/:chatId/memory',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    await clearMemory(req.params.chatId);
    res.json({ success: true });
  })
);
