export type SubscriptionTier = 'free' | 'pro' | 'business';

export interface PlanLimits {
  scansLimit: number; // شناسایی/عارضه‌یابی عکس یا ویدئو در ماه
  plansLimit: number; // طرح کشت تا برداشت در ماه
  chatsLimit: number; // پیام چت با کارشناس در ماه
  maxPlants: number; // حداکثر تعداد گیاه در CRM
  videoDoctor: boolean; // دسترسی به تحلیل ویدئو
}

export interface FarmerSubscription {
  tier: SubscriptionTier;
  scansCount: number;
  plansCount: number;
  chatsCount: number;
  periodStart: string; // ISO – ابتدای دوره شمارش ماهانه فعلی
  upgradedAt?: string;
}

export interface PlanDefinition extends PlanLimits {
  tier: SubscriptionTier;
  titleFa: string;
  priceTomanMonthly: number;
}

/** یک واقعیت ثابت درباره‌ی کاربر که حافظه هوشمند آن را نگه می‌دارد */
export interface MemoryFact {
  key: string;
  value: string;
  createdAt: string;
}

/** حافظه اختصاصی هر کاربر؛ پایه‌ی قابلیت AI Memory */
export interface UserMemory {
  ownerId: string;
  /** خلاصه‌ی فشرده‌شده از مکالمات قبلی (تولید شده توسط مدل) */
  summary: string;
  /** پیام‌های خام اخیر که هنوز در summary ادغام نشده‌اند */
  recentMessages: { role: 'user' | 'model'; text: string; at: string }[];
  facts: MemoryFact[];
  updatedAt: string;
}

export interface TelegramUserProfile {
  chatId: string;
  firstName?: string;
  username?: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface UserRecord {
  profile: TelegramUserProfile;
  subscription: FarmerSubscription;
  session: { state: string; data?: Record<string, unknown> };
}

export interface AdminUser {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}
