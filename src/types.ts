export interface CareInfo {
  watering: string;
  sunlight: string;
  temperature: string;
  soil: string;
  toxicity: string;
}

export interface HealthStatus {
  healthScore: number;
  issuesFound: boolean;
  symptoms: string[];
  diagnoses: string;
  treatment: string;
}

export interface PlantResult {
  nameFarsi: string;
  nameEnglish: string;
  scientificName: string;
  description: string;
  confidence: number;
  careInfo: CareInfo;
  healthStatus: HealthStatus;
  quickTips: string[];
  cultivationAdvice: string;
}

export interface CultivationStage {
  stageId: number;
  title: string;
  durationWeeks: number;
  temperatureIdeal: string;
  tasks: string[];
  warningSigns: string[];
}

export interface CropPlanResult {
  cropTitle: string;
  estimatedDurationWeeks: number;
  generalAdvice: string;
  stages: CultivationStage[];
  pestControlTips: string[];
  fertilizerTimeline: string[];
}

export interface PlantLog {
  id: string;
  date: string;
  notes: string;
  status: "عالی" | "کمی بی‌حال" | "بیمار" | "نیاز به توجه";
  image?: string;
}

export interface SavedPlant {
  id: string;
  addedDate: string;
  nameFarsi: string;
  nameEnglish: string;
  scientificName: string;
  description: string;
  imageUrl?: string;
  careInfo: CareInfo;
  healthStatus: HealthStatus;
  logs: PlantLog[];
}

export interface CareNotification {
  id: string;
  plantId?: string;
  plantName: string;
  type: "آبیاری" | "کوددهی" | "غبارپاشی" | "برداشت/هرس" | "سایر";
  timeString: string;
  frequencyDays: number;
  completed: boolean;
  createdDate: string;
  lastDoneDate?: string;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  image?: string;
  timestamp: string;
}

export interface FarmerSubscription {
  tier: "free" | "premium";
  scansCount: number;
  plansCount: number;
  chatsCount: number;
  scansLimit: number;
  plansLimit: number;
  chatsLimit: number;
}

