import { getAIClient, GEMINI_MODEL } from './geminiClient';
import { memorySummarySchema } from './schemas';
import { buildMemorySummaryPrompt } from './prompts';
import { createLogger } from '../utils/logger';

const logger = createLogger('memorySummarizer');

export interface SummarizeResult {
  summary: string;
  facts: { key: string; value: string }[];
}

export async function summarizeMemory(
  previousSummary: string,
  recentMessagesText: string
): Promise<SummarizeResult> {
  const client = getAIClient();
  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildMemorySummaryPrompt(previousSummary, recentMessagesText),
      config: { responseMimeType: 'application/json', responseSchema: memorySummarySchema },
    });
    return JSON.parse((response.text || '{}').trim()) as SummarizeResult;
  } catch (error) {
    logger.error('خطا در فشرده‌سازی حافظه کاربر، حافظه قبلی حفظ می‌شود', error);
    return { summary: previousSummary, facts: [] };
  }
}
