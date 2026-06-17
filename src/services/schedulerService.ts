import cron from 'node-cron';
import { store } from '../database/db';
import { findDueNotifications, markSent } from './notificationService';
import { sendTelegramMessage } from '../telegram/telegramApi';
import { regenerateRecommendations } from './recommendationService';
import { listPlantsForOwner } from './plantService';
import { env } from '../utils/env';
import { createLogger } from '../utils/logger';

const logger = createLogger('scheduler');

const notificationTypeEmoji: Record<string, string> = {
  آبیاری: '💧',
  کوددهی: '🌾',
  غبارپاشی: '🌫',
  'برداشت/هرس': '✂️',
  سایر: '🔔',
};

async function runNotificationSweep() {
  const db = store.read();
  const token = db.telegramSettings.tgToken;
  if (!token) return;

  const due = findDueNotifications();
  for (const notif of due) {
    const emoji = notificationTypeEmoji[notif.type] || '🔔';
    await sendTelegramMessage(
      token,
      notif.ownerId,
      `${emoji} *یادآور*: وقت «${notif.type}» برای گیاه «${notif.plantName}» رسیده است!`
    );
    await markSent(notif.id);
  }
  if (due.length > 0) logger.info(`${due.length} یادآور ارسال شد.`);
}

const RECOMMENDATION_REFRESH_HOURS = 24;

async function runRecommendationRefresh() {
  const db = store.read();
  for (const ownerId of Object.keys(db.users)) {
    const plants = await listPlantsForOwner(ownerId);
    if (plants.length === 0) continue;

    const existing = db.recommendations.filter((r) => r.ownerId === ownerId);
    const freshest = existing.reduce<number>((max, r) => Math.max(max, new Date(r.createdAt).getTime()), 0);
    const hoursSince = (Date.now() - freshest) / (1000 * 60 * 60);
    if (freshest && hoursSince < RECOMMENDATION_REFRESH_HOURS) continue;

    try {
      await regenerateRecommendations(ownerId);
    } catch (error) {
      logger.warn(`بازتولید توصیه برای کاربر ${ownerId} ناموفق بود`);
    }
  }
}

let started = false;

/** راه‌انداز زمان‌بند پس‌زمینه؛ یک‌بار در شروع سرور صدا زده می‌شود */
export function startScheduler() {
  if (started) return;
  started = true;

  const everyNMinutes = `*/${env.schedulerIntervalMinutes} * * * *`;
  cron.schedule(everyNMinutes, () => {
    runNotificationSweep().catch((e) => logger.error('خطا در بررسی یادآورها', e));
  });

  // بازتولید توصیه‌ها هر ساعت بررسی می‌شود (و خودش تصمیم می‌گیرد کدام کاربر نیاز به تازه‌سازی دارد)
  cron.schedule('0 * * * *', () => {
    runRecommendationRefresh().catch((e) => logger.error('خطا در بازتولید توصیه‌ها', e));
  });

  logger.info(`زمان‌بند یادآورها هر ${env.schedulerIntervalMinutes} دقیقه اجرا می‌شود.`);
}
