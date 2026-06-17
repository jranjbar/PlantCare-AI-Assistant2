import dotenv from 'dotenv';
dotenv.config();

function getTelegramToken(): string {
  return (
    process.env.TELEGRAM_TOKEN ||
    process.env.TG_TOKEN ||
    process.env.BOT_TOKEN ||
    process.env.TELEGRAM_BOT_TOKEN ||
    ''
  );
}

function getWebhookBase(): string {
  return process.env.RENDER_EXTERNAL_URL || process.env.PUBLIC_BASE_URL || '';
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  port: parseInt(process.env.PORT || '3000', 10),
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  telegramToken: getTelegramToken(),
  webhookBase: getWebhookBase(),
  /** سکرت برای اعتبارسنجی درخواست‌های ورودی وب‌هوک تلگرام (هدر X-Telegram-Bot-Api-Secret-Token) */
  telegramWebhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || 'rooyeshban-default-secret',
  adminJwtSecret: process.env.ADMIN_JWT_SECRET || 'dev-only-insecure-secret-change-me',
  defaultAdminUsername: process.env.ADMIN_USERNAME || 'admin',
  defaultAdminPassword: process.env.ADMIN_PASSWORD || 'change-this-password',
  schedulerIntervalMinutes: parseInt(process.env.SCHEDULER_INTERVAL_MINUTES || '15', 10),
};

export function warnOnInsecureDefaults(logger: { warn: (m: string) => void }) {
  if (env.adminJwtSecret === 'dev-only-insecure-secret-change-me') {
    logger.warn(
      'ADMIN_JWT_SECRET تنظیم نشده است؛ از مقدار پیش‌فرض ناامن استفاده می‌شود. در محیط Production حتماً آن را تنظیم کنید.'
    );
  }
  if (env.defaultAdminPassword === 'change-this-password') {
    logger.warn(
      'ADMIN_PASSWORD تنظیم نشده است؛ رمز پیش‌فرض ناامن برای ادمین استفاده می‌شود. حتماً آن را تغییر دهید.'
    );
  }
  if (!env.geminiApiKey) {
    logger.warn('GEMINI_API_KEY تنظیم نشده است؛ قابلیت‌های هوش مصنوعی کار نخواهند کرد.');
  }
  if (!env.telegramToken) {
    logger.warn('توکن تلگرام تنظیم نشده است؛ ربات تلگرام پاسخگو نخواهد بود.');
  }
}
