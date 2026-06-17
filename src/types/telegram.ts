import { PlantRecord, CareNotification } from './plant';
import { Recommendation } from './ai';
import { UserMemory, UserRecord, AdminUser } from './user';

export interface TelegramSettings {
  tgToken: string;
  webhookUrl: string;
  webhookSecret: string;
  customWelcomeMsg: string;
}

/** ساختار کامل فایل دیتابیس JSON (چند-کاربره) */
export interface DatabaseShape {
  schemaVersion: number;
  users: Record<string, UserRecord>; // key = chatId
  plants: PlantRecord[];
  notifications: CareNotification[];
  recommendations: Recommendation[];
  memories: Record<string, UserMemory>; // key = chatId
  admins: AdminUser[];
  telegramSettings: TelegramSettings;
}
