import { Request, Response } from 'express';
import { store } from '../database/db';
import {
  ensureTelegramUser,
  getSessionState,
  handleAdvisorMenu,
  handleCropPlanMenu,
  handleCropPlanNameReply,
  handleFreeTextChat,
  handleMyPlantsMenu,
  handlePlantDoctorMenu,
  handleRecommendationsMenu,
  handleStartOrMenu,
  handleSubscriptionMenu,
} from './handlers';
import { handlePhotoOrVideo } from './mediaHandler';
import { createLogger } from '../utils/logger';

const logger = createLogger('telegramWebhook');

export async function telegramWebhookController(req: Request, res: Response) {
  // فوراً به تلگرام پاسخ بده تا دوباره ارسال (retry) نکند
  res.sendStatus(200);

  try {
    const update = req.body;
    const message = update.message;
    if (!message) return;

    const db = store.read();
    const token = db.telegramSettings.tgToken;
    if (!token) {
      logger.error('توکن ربات تلگرام تنظیم نشده است.');
      return;
    }

    const user = await ensureTelegramUser(message);
    const ownerId = user.profile.chatId;
    const chatId = message.chat.id;
    const session = getSessionState(ownerId);

    if (message.text === '/start' || message.text === '/menu' || message.text === 'منو' || message.text === '↩️ بازگشت به منو') {
      return handleStartOrMenu(token, ownerId, message, db.telegramSettings);
    }

    if (message.text === '🩺 دکتر هوشمند گیاه (عکس/ویدئو)') {
      return handlePlantDoctorMenu(token, ownerId, chatId);
    }
    if (message.text === '🌱 طرح کشت تا برداشت') {
      return handleCropPlanMenu(token, ownerId, chatId);
    }
    if (message.text === '💬 مشاوره با کارشناس') {
      return handleAdvisorMenu(token, ownerId, chatId);
    }
    if (message.text === '📋 گیاهان و یادآورهای من') {
      return handleMyPlantsMenu(token, ownerId, chatId);
    }
    if (message.text === '🌟 توصیه‌های هوشمند امروز') {
      return handleRecommendationsMenu(token, ownerId, chatId);
    }
    if (message.text === '💎 وضعیت اشتراک من') {
      return handleSubscriptionMenu(token, ownerId, chatId);
    }

    if (session.state === 'awaiting_crop_name' && message.text) {
      return handleCropPlanNameReply(token, ownerId, chatId, message.text);
    }

    if (message.photo || message.video) {
      return handlePhotoOrVideo(token, ownerId, message);
    }

    if (message.text) {
      return handleFreeTextChat(token, ownerId, chatId, message.text);
    }
  } catch (error) {
    logger.error('خطای پردازش‌نشده در وب‌هوک تلگرام', error);
  }
}
