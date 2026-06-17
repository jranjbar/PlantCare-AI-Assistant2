import { getAIClient, GEMINI_MODEL } from './geminiClient';
import { cropPlanSchema } from './schemas';
import { buildCropPlanPrompt } from './prompts';
import { CropPlanResult, ApiError } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('cropPlanner');

export async function generateCropPlan(params: {
  plantName: string;
  experienceLevel?: string;
  plantingMethod?: string;
  irrigationType?: string;
  soilType?: string;
  locationClimate?: string;
}): Promise<CropPlanResult> {
  const client = getAIClient();
  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildCropPlanPrompt(params),
      config: { responseMimeType: 'application/json', responseSchema: cropPlanSchema },
    });
    return JSON.parse((response.text || '{}').trim()) as CropPlanResult;
  } catch (error) {
    logger.error('خطا در تولید طرح کشت', error);
    throw new ApiError(500, 'بروز خطا در تولید طرح کشت تا برداشت. لطفاً دوباره تلاش کنید.');
  }
}

/** نسخه متن ساده مناسب پیام تلگرام (بدون JSON) */
export async function generateCropPlanPlainText(plantName: string): Promise<string> {
  const client = getAIClient();
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: `یک طرح جامع کشت تا برداشت برای "${plantName}" به زبان فارسی بنویس. شامل مراحل از کاشت تا برداشت، مدت‌زمان تقریبی هر مرحله، نکات آبیاری، کوددهی و هشدارهای آفت باشد. متن را کوتاه، مرحله‌به‌مرحله و مناسب پیام تلگرام (بدون JSON) بنویس.`,
  });
  return response.text || 'متاسفانه نتوانستم طرح کشت بسازم.';
}
