import { sendTelegramMessage } from './telegramApi';
import { MAIN_MENU_KEYBOARD } from './keyboards';
import { getOrCreateUser, setSessionState, getSessionState } from '../services/userService';
import { listPlantsForOwner } from '../services/plantService';
import { listNotificationsForOwner } from '../services/notificationService';
import { checkAndConsume, getSubscription, PLANS } from '../services/subscriptionService';
import { listRecommendations, regenerateRecommendations } from '../services/recommendationService';
import { getMemoryContextString, recordMessage } from '../services/memoryService';
import { generateCropPlanPlainText } from '../ai/cropPlanner';
import { chatWithAdvisor } from '../ai/chatAdvisor';
import { formatRecommendations, formatSubscriptionStatus } from './formatters';
import { TelegramSettings } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('telegramHandlers');

interface TelegramMessage {
  chat: { id: number };
  from?: { first_name?: string; username?: string };
  text?: string;
}

export async function handleStartOrMenu(token: string, ownerId: string, message: TelegramMessage, settings: TelegramSettings) {
  await setSessionState(ownerId, 'idle');
  const welcome = settings.customWelcomeMsg;
  await sendTelegramMessage(
    token,
    message.chat.id,
    `${welcome}\n\nاز منوی پایین یکی از قابلیت‌ها را انتخاب کنید، یا مستقیماً عکس/ویدئوی گیاه یا سؤال خود را بفرستید.`,
    MAIN_MENU_KEYBOARD
  );
}

export async function handlePlantDoctorMenu(token: string, ownerId: string, chatId: number) {
  await setSessionState(ownerId, 'idle');
  await sendTelegramMessage(
    token,
    chatId,
    '📷 لطفاً عکس یا ویدئوی کوتاه گیاه خود را بفرستید تا شناسایی و عارضه‌یابی کنم.'
  );
}

export async function handleCropPlanMenu(token: string, ownerId: string, chatId: number) {
  await setSessionState(ownerId, 'awaiting_crop_name');
  await sendTelegramMessage(
    token,
    chatId,
    '🌱 نام گیاه یا محصولی که می‌خواهید برایش طرح کشت تا برداشت بسازم را بنویسید (مثلاً: گوجه‌فرنگی، زعفران).'
  );
}

export async function handleAdvisorMenu(token: string, ownerId: string, chatId: number) {
  await setSessionState(ownerId, 'idle');
  await sendTelegramMessage(token, chatId, '💬 سؤال خود را درباره نگهداری، بیماری یا پرورش گیاهان بنویسید.');
}

export async function handleMyPlantsMenu(token: string, ownerId: string, chatId: number) {
  const plants = await listPlantsForOwner(ownerId);
  const notifs = listNotificationsForOwner(ownerId).filter((n) => !n.completed);
  let reply = '';
  if (plants.length === 0 && notifs.length === 0) {
    reply = 'هنوز هیچ گیاهی یا یادآوری ثبت نشده. کافی است عکس یا ویدئوی یک گیاه را بفرستید تا به‌صورت خودکار در «گیاهان من» ثبت شود.';
  } else {
    if (plants.length > 0) {
      reply +=
        '🌿 *گیاهان شما:*\n' +
        plants
          .map((p, i) => `${i + 1}. ${p.nameFarsi} — مرحله: ${p.stage} — سلامت: ${p.healthStatus.healthScore}/100`)
          .join('\n') +
        '\n\n';
    }
    if (notifs.length > 0) {
      reply += '⏰ *یادآورهای فعال:*\n' + notifs.map((n, i) => `${i + 1}. ${n.plantName} — ${n.type}`).join('\n');
    }
  }
  await sendTelegramMessage(token, chatId, reply, MAIN_MENU_KEYBOARD);
}

export async function handleRecommendationsMenu(token: string, ownerId: string, chatId: number) {
  let recs = listRecommendations(ownerId);
  if (recs.length === 0) {
    const plants = await listPlantsForOwner(ownerId);
    if (plants.length > 0) {
      recs = await regenerateRecommendations(ownerId);
    }
  }
  await sendTelegramMessage(token, chatId, formatRecommendations(recs), MAIN_MENU_KEYBOARD);
}

export async function handleSubscriptionMenu(token: string, ownerId: string, chatId: number) {
  const sub = getSubscription(ownerId);
  await sendTelegramMessage(token, chatId, formatSubscriptionStatus(sub, PLANS[sub.tier]), MAIN_MENU_KEYBOARD);
}

export async function handleCropPlanNameReply(token: string, ownerId: string, chatId: number, plantName: string) {
  await setSessionState(ownerId, 'idle');
  try {
    await checkAndConsume(ownerId, 'plans');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'محدودیت پلن شما به پایان رسیده.';
    await sendTelegramMessage(token, chatId, msg, MAIN_MENU_KEYBOARD);
    return;
  }

  await sendTelegramMessage(token, chatId, '⏳ در حال طراحی برنامه کشت تا برداشت، چند لحظه صبر کنید...');
  try {
    const text = await generateCropPlanPlainText(plantName);
    await sendTelegramMessage(token, chatId, text, MAIN_MENU_KEYBOARD);
  } catch (error) {
    logger.error('خطا در تولید طرح کشت از تلگرام', error);
    await sendTelegramMessage(token, chatId, 'متاسفانه نتوانستم طرح کشت بسازم. دوباره تلاش کنید.', MAIN_MENU_KEYBOARD);
  }
}

export async function handleFreeTextChat(token: string, ownerId: string, chatId: number, text: string) {
  try {
    await checkAndConsume(ownerId, 'chats');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'محدودیت پلن شما به پایان رسیده.';
    await sendTelegramMessage(token, chatId, msg, MAIN_MENU_KEYBOARD);
    return;
  }

  try {
    const memoryContext = getMemoryContextString(ownerId);
    const reply = await chatWithAdvisor({ message: text, memoryContext });
    await recordMessage(ownerId, 'user', text);
    await recordMessage(ownerId, 'model', reply);
    await sendTelegramMessage(token, chatId, reply, MAIN_MENU_KEYBOARD);
  } catch (error) {
    logger.error('خطا در چت تلگرام', error);
    const msg = error instanceof Error ? error.message : 'متوجه پیام شما نشدم، لطفاً دوباره بنویسید.';
    await sendTelegramMessage(token, chatId, msg, MAIN_MENU_KEYBOARD);
  }
}

export async function ensureTelegramUser(message: TelegramMessage) {
  const chatId = String(message.chat.id);
  return getOrCreateUser(chatId, { firstName: message.from?.first_name, username: message.from?.username });
}

export { getSessionState };
