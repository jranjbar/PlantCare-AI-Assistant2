import { getAIClient, GEMINI_MODEL } from './geminiClient';
import { buildChatSystemInstruction } from './prompts';
import { ApiError } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('chatAdvisor');

interface HistoryItem {
  role: 'user' | 'model';
  text: string;
}

export async function chatWithAdvisor(params: {
  message: string;
  history?: HistoryItem[];
  imageBase64?: { mimeType: string; data: string };
  memoryContext?: string;
}): Promise<string> {
  const client = getAIClient();

  const contents: any[] = [];
  for (const msg of params.history || []) {
    contents.push({ role: msg.role, parts: [{ text: msg.text }] });
  }

  const parts: any[] = [];
  if (params.imageBase64) {
    parts.push({ inlineData: { mimeType: params.imageBase64.mimeType, data: params.imageBase64.data } });
  }
  parts.push({ text: params.message || 'درمورد نگهداری از گیاهان من صحبت کن.' });
  contents.push({ role: 'user', parts });

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents,
      config: { systemInstruction: buildChatSystemInstruction(params.memoryContext || '') },
    });
    return response.text || 'متوجه پیام شما نشدم، لطفاً دوباره بنویسید.';
  } catch (error) {
    logger.error('خطا در ارتباط با مشاور هوش مصنوعی', error);
    throw new ApiError(500, 'خطا در ارتباط با مشاور هوش مصنوعی رخ داد.');
  }
}
