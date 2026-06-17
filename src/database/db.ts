import { DatabaseShape } from '../types';
import { JsonFileStore } from './jsonStore';
import { DB_PATH } from './paths';
import { startOfCurrentMonthIso } from '../utils/dateUtils';

function defaultDatabase(): DatabaseShape {
  return {
    schemaVersion: 2,
    users: {},
    plants: [],
    notifications: [],
    recommendations: [],
    memories: {},
    admins: [],
    telegramSettings: {
      tgToken: '',
      webhookUrl: '',
      webhookSecret: '',
      customWelcomeMsg:
        'سلام به ربات تشخیص گیاه رویش‌بان خوش آمدید 🌿. عکس یا ویدئوی گیاه را بفرستید تا فوراً آن را معرفی و عارضه‌یابی کنم.',
    },
  };
}

export const store = new JsonFileStore<DatabaseShape>(DB_PATH, defaultDatabase);

/** اطمینان از وجود رکورد کاربر برای یک chatId؛ در صورت نبود می‌سازد */
export function ensureUserSync(
  db: DatabaseShape,
  chatId: string,
  profile?: { firstName?: string; username?: string }
) {
  if (!db.users[chatId]) {
    const now = new Date().toISOString();
    db.users[chatId] = {
      profile: {
        chatId,
        firstName: profile?.firstName,
        username: profile?.username,
        createdAt: now,
        lastActiveAt: now,
      },
      subscription: {
        tier: 'free',
        scansCount: 0,
        plansCount: 0,
        chatsCount: 0,
        periodStart: startOfCurrentMonthIso(),
      },
      session: { state: 'idle' },
    };
  }
  return db.users[chatId];
}
