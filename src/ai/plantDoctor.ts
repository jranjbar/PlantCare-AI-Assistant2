import { getAIClient, GEMINI_MODEL } from './geminiClient';
import { plantDoctorSchema } from './schemas';
import { buildPlantDoctorPrompt } from './prompts';
import { PlantDoctorResult } from '../types';
import { ApiError } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('plantDoctor');

/**
 * تحلیل یک عکس یا ویدئوی گیاه و بازگرداندن تشخیص ساخت‌یافته.
 * هسته‌ی اصلی قابلیت «دکتر هوشمند گیاه» که هم عکس و هم ویدئو را پشتیبانی می‌کند.
 */
export async function analyzePlantMedia(params: {
  base64Data: string;
  mimeType: string;
  mode?: string;
}): Promise<PlantDoctorResult> {
  const mediaKind: 'photo' | 'video' = params.mimeType.startsWith('video/') ? 'video' : 'photo';
  const client = getAIClient();

  try {
    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: {
        parts: [
          { inlineData: { mimeType: params.mimeType, data: params.base64Data } },
          { text: buildPlantDoctorPrompt(mediaKind, params.mode || 'both') },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: plantDoctorSchema,
      },
    });

    const resultText = response.text || '{}';
    const result = JSON.parse(resultText.trim()) as PlantDoctorResult;
    result.mediaKind = mediaKind;
    return result;
  } catch (error) {
    logger.error('خطا در تحلیل رسانه گیاه توسط هوش مصنوعی', error);
    throw new ApiError(500, 'متاسفانه در تحلیل هوشمند رسانه شما خطایی رخ داد. لطفاً دوباره تلاش کنید.');
  }
}

/** نسخه‌ی متن ساده (بدون JSON) برای پاسخ سریع در چت تلگرام روی عکس */
export async function quickAnalyzeForChat(base64Data: string, mimeType: string): Promise<string> {
  const client = getAIClient();
  const mediaKind = mimeType.startsWith('video/') ? 'ویدئو' : 'تصویر';
  const response = await client.models.generateContent({
    model: GEMINI_MODEL,
    contents: {
      parts: [
        { inlineData: { mimeType, data: base64Data } },
        {
          text: `این ${mediaKind} یک گیاه را تحلیل کن و به زبان فارسی پاسخ بده. نام گیاه، وضعیت سلامتی، علائم احتمالی بیماری و یک دستورالعمل کوتاه مراقبتی را در چند پاراگراف کوتاه و خوانا برای پیام تلگرام بنویس (بدون فرمت JSON، فقط متن ساده).`,
        },
      ],
    },
  });
  return response.text || 'متاسفانه نتوانستم رسانه را تحلیل کنم.';
}
