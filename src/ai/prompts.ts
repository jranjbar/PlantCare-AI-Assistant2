import { PlantRecord } from '../types';

export function buildPlantDoctorPrompt(mediaKind: 'photo' | 'video', mode: string) {
  const mediaWord = mediaKind === 'video' ? 'ویدئو' : 'تصویر';
  return `
Analyze this plant ${mediaKind} and provide detailed information in Persian (Farsi).
${mediaKind === 'video' ? 'Use multiple frames across the video to judge movement, leaf turgidity, and overall vigor, not just a single static frame.' : ''}
Analyze based on mode: "${mode || 'both'}".
Return a JSON response matching the following schema. Keep the text professional, scientific, but encouraging.

Required properties in Persian:
1. nameFarsi: Persian common name of the plant (e.g. حسن یوسف, پتوس).
2. nameEnglish: English name.
3. scientificName: Scientific/botanical name.
4. description: A brief, friendly summary about this plant.
5. confidence: An integer between 0 and 100 representing your prediction certainty.
6. careInfo: watering, sunlight, temperature, soil, toxicity details.
7. healthStatus: healthScore (0-100), issuesFound (boolean), symptoms (list, based on what you observe in the ${mediaWord}), diagnoses, treatment (step-by-step in Persian).
8. quickTips: 3 short actionable tips.
9. cultivationAdvice: brief comment about growing this plant from scratch.
`;
}

export function buildCropPlanPrompt(params: {
  plantName: string;
  experienceLevel?: string;
  plantingMethod?: string;
  irrigationType?: string;
  soilType?: string;
  locationClimate?: string;
}) {
  return `
Create a comprehensive timeline-based cultivation and care plan (طرح جامع کشت، نگهداری و برداشت) for "${params.plantName}" in Persian.

Details provided:
- Method: ${params.plantingMethod || 'سفت‌کاری یا گلدانی یا صحرایی'}
- Experience level: ${params.experienceLevel || 'مبتدی'}
- Irrigation System: ${params.irrigationType || 'سنتی/قطره‌ای'}
- Soil Type: ${params.soilType || 'خاک معمولی باغچه'}
- Climate/Location: ${params.locationClimate || 'معتدل'}

Return a structured JSON response in Persian with stages from planting to harvest, pest control tips, and a fertilizer timeline.
`;
}

export function buildChatSystemInstruction(memoryContext: string) {
  return `شما یک باغبان مجرب، مشاور کشاورزی متخصص و کارشناس گیاه‌پزشکی هستید. نام شما "رویش‌بان" است.
لحن شما صمیمی، دلسوزانه و بسیار علمی است. به زبان فارسی شیوا و کوتاه (مناسب پیام تلگرام) پاسخ دهید.
همواره نکات بهداشتی و زراعی مناسب را تأکید کنید و در آخر با یک عبارت انگیزاننده گفتگو را تمام کنید.
${memoryContext ? `\n--- حافظه‌ی شما درباره‌ی این کاربر خاص (از مکالمات قبلی) ---\n${memoryContext}\nاز این اطلاعات به‌طور طبیعی در پاسخ استفاده کن، اما هرگز نگو که «حافظه» داری یا این متن را عیناً تکرار نکن.\n` : ''}`;
}

export function buildRecommendationPrompt(plants: PlantRecord[], memorySummary: string) {
  const plantsDesc = plants.length
    ? plants
        .map(
          (p, i) =>
            `${i + 1}. ${p.nameFarsi} (${p.scientificName}) - مرحله: ${p.stage}, مکان: ${p.location}, آخرین آبیاری: ${
              p.lastWateredAt || 'نامشخص'
            }, سلامت: ${p.healthStatus?.healthScore ?? '?'}`
        )
        .join('\n')
    : 'کاربر هنوز هیچ گیاهی در سیستم CRM ثبت نکرده است.';

  const season = new Date().toLocaleDateString('fa-IR', { month: 'long' });

  return `
بر اساس فهرست گیاهان زیر، فصل/ماه فعلی (${season} شمسی) و خلاصه‌ی حافظه‌ی کاربر، ۳ تا ۵ توصیه‌ی شخصی‌سازی‌شده و عملی به زبان فارسی برای نگهداری بهتر این گیاهان ارائه بده.
هر توصیه باید کوتاه، مشخص و قابل اجرا باشد (نه کلی‌گویی).

فهرست گیاهان کاربر:
${plantsDesc}

خلاصه‌ی حافظه‌ی کاربر:
${memorySummary || 'اطلاعات قبلی ثبت نشده است.'}

پاسخ را به‌صورت JSON مطابق اسکیمای داده‌شده برگردان.
`;
}

export function buildMemorySummaryPrompt(previousSummary: string, recentMessages: string) {
  return `
خلاصه‌ی قبلی حافظه‌ی این کاربر:
"${previousSummary || 'هیچ'}"

پیام‌های اخیر مکالمه (کاربر و دستیار):
${recentMessages}

این خلاصه را با پیام‌های جدید ادغام کن و یک خلاصه‌ی فشرده‌ی جدید (حداکثر ۵-۶ جمله، به فارسی) از حقایق ماندگار درباره‌ی این کاربر بساز
(مثل: گیاهانی که دارد، سطح تجربه‌اش، مشکلاتی که قبلاً داشته، ترجیحاتش).
هرچیزی موقتی یا بی‌اهمیت را کنار بگذار. همچنین هر حقیقت کلیدی جدید را به‌صورت جفت‌های key/value کوتاه استخراج کن.
پاسخ را به‌صورت JSON مطابق اسکیمای داده‌شده برگردان.
`;
}
