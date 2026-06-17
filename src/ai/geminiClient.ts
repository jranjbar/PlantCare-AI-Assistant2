import { GoogleGenAI } from '@google/genai';
import { env } from '../utils/env';
import { ApiError } from '../types';

let client: GoogleGenAI | null = null;

/** کلاینت Gemini را به‌صورت lazy می‌سازد تا اگر کلید بعداً تنظیم شد هم کار کند */
export function getAIClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY || env.geminiApiKey;
  if (!apiKey) {
    throw new ApiError(
      503,
      'کلید اختصاصی هوش مصنوعی (GEMINI_API_KEY) در سرور یافت نشد. لطفاً در متغیرهای محیطی آن را تنظیم کنید.'
    );
  }
  if (!client) {
    client = new GoogleGenAI({
      apiKey,
      httpOptions: { headers: { 'User-Agent': 'rooyeshban-bot' } },
    });
  }
  return client;
}

export const GEMINI_MODEL = env.geminiModel;
