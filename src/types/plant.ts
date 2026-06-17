import { CareInfo, HealthStatus } from './ai';

export type PlantStage = 'seedling' | 'growing' | 'flowering' | 'fruiting' | 'dormant' | 'harvested';
export type PlantLocation = 'indoor' | 'outdoor' | 'greenhouse';

export interface PlantLog {
  id: string;
  date: string;
  notes: string;
  status: 'عالی' | 'کمی بی‌حال' | 'بیمار' | 'نیاز به توجه';
  image?: string;
  videoThumbnail?: string;
}

/** رکورد یک گیاه در سیستم CRM (هر گیاه متعلق به یک کاربر/ownerId است) */
export interface PlantRecord {
  id: string;
  ownerId: string;
  addedDate: string;
  updatedAt: string;
  nameFarsi: string;
  nameEnglish: string;
  scientificName: string;
  description: string;
  imageUrl?: string;
  careInfo: CareInfo;
  healthStatus: HealthStatus;
  logs: PlantLog[];

  // فیلدهای CRM
  stage: PlantStage;
  location: PlantLocation;
  tags: string[];
  lastWateredAt?: string;
  nextWateringDueAt?: string;
}

export interface CareNotification {
  id: string;
  ownerId: string;
  plantId?: string;
  plantName: string;
  type: 'آبیاری' | 'کوددهی' | 'غبارپاشی' | 'برداشت/هرس' | 'سایر';
  timeString: string;
  frequencyDays: number;
  completed: boolean;
  createdDate: string;
  lastDoneDate?: string;
  /** آخرین باری که با موفقیت از طریق تلگرام ارسال شد */
  lastSentAt?: string;
}
