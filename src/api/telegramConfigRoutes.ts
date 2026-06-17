import { Router } from 'express';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { store } from '../database/db';

export const telegramConfigRouter = Router();

telegramConfigRouter.get('/admin/telegram-config', requireAdminAuth, (req, res) => {
  const db = store.read();
  // توکن کامل را برای جلوگیری از افشا فقط تا حدی نشان بده
  const masked = db.telegramSettings.tgToken
    ? `${db.telegramSettings.tgToken.slice(0, 6)}...${db.telegramSettings.tgToken.slice(-4)}`
    : '';
  res.json({ ...db.telegramSettings, tgTokenMasked: masked, tgToken: undefined });
});

telegramConfigRouter.post(
  '/admin/telegram-config',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const { tgToken, webhookUrl, webhookSecret, customWelcomeMsg } = req.body;
    const updated = await store.mutate((db) => {
      if (tgToken) db.telegramSettings.tgToken = tgToken;
      if (webhookUrl) db.telegramSettings.webhookUrl = webhookUrl;
      if (webhookSecret) db.telegramSettings.webhookSecret = webhookSecret;
      if (customWelcomeMsg) db.telegramSettings.customWelcomeMsg = customWelcomeMsg;
      return db.telegramSettings;
    });
    res.json(updated);
  })
);
