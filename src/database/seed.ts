import { store } from './db';
import { env } from '../utils/env';
import { hashPassword } from '../auth/passwordUtils';
import { generateId } from '../utils/asyncHandler';
import { createLogger } from '../utils/logger';

const logger = createLogger('seed');

export async function seedDatabase() {
  await store.mutate((db) => {
    // مقداردهی تنظیمات تلگرام از متغیرهای محیطی، اگر هنوز ثبت نشده‌اند
    if (!db.telegramSettings.tgToken && env.telegramToken) {
      db.telegramSettings.tgToken = env.telegramToken;
    }
    if (!db.telegramSettings.webhookUrl && env.webhookBase) {
      db.telegramSettings.webhookUrl = `${env.webhookBase}/api/telegram`;
    }
    if (!db.telegramSettings.webhookSecret) {
      db.telegramSettings.webhookSecret = env.telegramWebhookSecret;
    }
  });

  const hasAdmin = await store.mutate((db) => db.admins.length > 0);
  if (!hasAdmin) {
    const passwordHash = await hashPassword(env.defaultAdminPassword);
    await store.mutate((db) => {
      db.admins.push({
        id: generateId('admin'),
        username: env.defaultAdminUsername,
        passwordHash,
        createdAt: new Date().toISOString(),
      });
    });
    logger.info(
      `حساب ادمین پیش‌فرض با نام کاربری «${env.defaultAdminUsername}» ساخته شد. لطفاً پس از اولین ورود رمز را تغییر دهید.`
    );
  }
}
