import { PlantDoctorResult, Recommendation, FarmerSubscription, PlanDefinition } from '../types';

export function formatPlantDoctorResult(result: PlantDoctorResult): string {
  const statusEmoji = result.healthStatus.issuesFound ? '⚠️' : '✅';
  const lines = [
    `🌿 *${result.nameFarsi}* (${result.nameEnglish})`,
    `_${result.scientificName}_`,
    '',
    result.description,
    '',
    `${statusEmoji} *وضعیت سلامت:* ${result.healthStatus.healthScore}/100 — ${result.healthStatus.diagnoses}`,
  ];
  if (result.healthStatus.issuesFound && result.healthStatus.treatment) {
    lines.push('', `💊 *درمان پیشنهادی:*\n${result.healthStatus.treatment}`);
  }
  lines.push(
    '',
    `💧 آبیاری: ${result.careInfo.watering}`,
    `☀️ نور: ${result.careInfo.sunlight}`,
    `🌡 دما: ${result.careInfo.temperature}`
  );
  if (result.quickTips?.length) {
    lines.push('', '✨ *نکات سریع:*', ...result.quickTips.map((t) => `• ${t}`));
  }
  return lines.join('\n');
}

export function formatRecommendations(recs: Recommendation[]): string {
  if (!recs.length) {
    return 'فعلاً توصیه‌ی تازه‌ای ندارم؛ بعد از ثبت چند گیاه در «گیاهان من»، توصیه‌های شخصی‌سازی‌شده اینجا نمایش داده می‌شود. 🌱';
  }
  const categoryEmoji: Record<string, string> = {
    watering: '💧',
    fertilizing: '🌾',
    pest: '🐛',
    seasonal: '🍂',
    general: '🌿',
  };
  return [
    '🌟 *توصیه‌های هوشمند امروز برای گیاهان شما:*',
    '',
    ...recs.map((r) => `${categoryEmoji[r.category] || '🌿'} *${r.title}*\n${r.body}`),
  ].join('\n\n');
}

export function formatSubscriptionStatus(sub: FarmerSubscription, plan: PlanDefinition): string {
  return [
    `💎 *پلن فعلی شما: ${plan.titleFa}*`,
    '',
    `🩺 دکتر گیاه: ${sub.scansCount}/${plan.scansLimit} این ماه`,
    `🌱 طرح کشت: ${sub.plansCount}/${plan.plansLimit} این ماه`,
    `💬 پیام مشاوره: ${sub.chatsCount}/${plan.chatsLimit} این ماه`,
    `🪴 سقف تعداد گیاه در CRM: ${plan.maxPlants}`,
    `🎥 تحلیل ویدئو: ${plan.videoDoctor ? 'فعال' : 'غیرفعال (مخصوص پلن‌های بالاتر)'}`,
    '',
    plan.tier === 'free'
      ? 'برای دسترسی نامحدودتر و فعال‌سازی تحلیل ویدئو، به پلن «کشاورز ویژه» ارتقا دهید. 🌿'
      : 'از اشتراک ویژه‌ی خود لذت ببرید! 🌿',
  ].join('\n');
}
