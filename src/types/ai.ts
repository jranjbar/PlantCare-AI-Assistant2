// تایپ‌های مربوط به خروجی مدل‌های هوش مصنوعی (Gemini)

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

/** خروجی موتور «دکتر هوشمند گیاه» برای تصویر یا ویدئو */
export interface PlantDoctorResult {
  nameFarsi: string;
  nameEnglish: string;
  scientificName: string;
  description: string;
  confidence: number;
  careInfo: CareInfo;
  healthStatus: HealthStatus;
  quickTips: string[];
  cultivationAdvice: string;
  /** فقط زمانی پر می‌شود که ورودی ویدئو بوده است */
  mediaKind?: 'photo' | 'video';
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  image?: string;
  timestamp: string;
}

/** یک پیشنهاد تولید شده توسط موتور توصیه‌گر */
export interface Recommendation {
  id: string;
  ownerId: string;
  category: 'watering' | 'fertilizing' | 'pest' | 'seasonal' | 'general';
  title: string;
  body: string;
  relatedPlantId?: string;
  createdAt: string;
  dismissed: boolean;
}
