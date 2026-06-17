import { getAIClient, GEMINI_MODEL } from './geminiClient';
import { recommendationListSchema } from './schemas';
import { buildRecommendationPrompt } from './prompts';
import { PlantRecord, ApiError } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('recommendationEngine');

interface RawRecommendation {
  category: 'watering' | 'fertilizing' | 'pest' | 'seasonal' | 'general';
  title: string;
  body: string;
  relatedPlantName?: string;
}

export async function generateRecommendations(
  plants: PlantRecord[],
  memorySummary: string
): Promise<RawRecommendation[]> {
  const client = getAIClient();
  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildRecommendationPrompt(plants, memorySummary),
      config: { responseMimeType: 'application/json', responseSchema: recommendationListSchema },
    });
    const parsed = JSON.parse((response.text || '{}').trim());
    return (parsed.recommendations || []) as RawRecommendation[];
  } catch (error) {
    logger.error('خطا در تولید توصیه‌های هوشمند', error);
    throw new ApiError(500, 'بروز خطا در تولید توصیه‌های هوشمند.');
  }
}
