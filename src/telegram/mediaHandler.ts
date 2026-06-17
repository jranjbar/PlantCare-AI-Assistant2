import { downloadTelegramFile, sendChatAction, sendTelegramMessage } from './telegramApi';
import { analyzePlantMedia } from '../ai/plantDoctor';
import { saveMediaFile } from '../services/mediaService';
import { createPlantFromDoctorResult, addPlantLog } from '../services/plantService';
import { checkAndConsume, canUseVideoDoctor } from '../services/subscriptionService';
import { addFact, recordMessage } from '../services/memoryService';
import { formatPlantDoctorResult } from './formatters';
import { MAIN_MENU_KEYBOARD } from './keyboards';
import { MAX_INLINE_MEDIA_BYTES } from '../utils/mediaUtils';
import { createLogger } from '../utils/logger';

const logger = createLogger('telegramMediaHandler');

interface TelegramMessage {
  chat: { id: number };
  photo?: { file_id: string; file_size?: number }[];
  video?: { file_id: string; file_size?: number; duration?: number };
}

export async function handlePhotoOrVideo(token: string, ownerId: string, message: TelegramMessage): Promise<void> {
  const chatId = message.chat.id;
  const isVideo = !!message.video;

  if (isVideo && !canUseVideoDoctor(ownerId)) {
    await sendTelegramMessage(
      token,
      chatId,
      '🎥 تحلیل ویدئو فقط در پلن‌های «کشاورز ویژه» و بالاتر فعال است. می‌توانید عکس بفرستید یا حساب خود را ارتقا دهید.',
      MAIN_MENU_KEYBOARD
    );
    return;
  }

  try {
    await checkAndConsume(ownerId, 'scans');
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'محدودیت پلن شما به پایان رسیده.';
    await sendTelegramMessage(token, chatId, msg, MAIN_MENU_KEYBOARD);
    return;
  }

  const fileId = isVideo ? message.video!.file_id : message.photo![message.photo!.length - 1].file_id;
  const fileSize = isVideo ? message.video!.file_size : message.photo![message.photo!.length - 1].file_size;

  if (fileSize && fileSize > MAX_INLINE_MEDIA_BYTES) {
    await sendTelegramMessage(
      token,
      chatId,
      'حجم فایل ارسالی بیش از حد مجاز (۲۰ مگابایت) است. لطفاً فایل کوچک‌تری بفرستید.',
      MAIN_MENU_KEYBOARD
    );
    return;
  }

  await sendChatAction(token, chatId, isVideo ? 'upload_video' : 'upload_photo');
  await sendTelegramMessage(
    token,
    chatId,
    isVideo
      ? '🔍 در حال تحلیل ویدئوی گیاه شما هستم (چند فریم بررسی می‌شود)، چند لحظه صبر کنید...'
      : '🔍 در حال تحلیل تصویر گیاه شما هستم، چند لحظه صبر کنید...'
  );

  const downloaded = await downloadTelegramFile(token, fileId);
  if (!downloaded) {
    await sendTelegramMessage(token, chatId, 'متاسفانه در دریافت فایل مشکلی پیش آمد. دوباره تلاش کنید.');
    return;
  }

  try {
    const result = await analyzePlantMedia({
      base64Data: downloaded.buffer.toString('base64'),
      mimeType: downloaded.mimeType,
      mode: 'both',
    });

    const saved = await saveMediaFile(ownerId, downloaded.buffer, downloaded.mimeType);
    const plant = await createPlantFromDoctorResult(ownerId, result, {
      imageUrl: isVideo ? saved.thumbnailUrl : saved.url,
    });
    await addPlantLog(plant.id, {
      date: new Date().toISOString(),
      notes: `ثبت خودکار از طریق ربات تلگرام (${isVideo ? 'ویدئو' : 'عکس'})`,
      status: result.healthStatus.issuesFound ? 'نیاز به توجه' : 'عالی',
      image: isVideo ? saved.thumbnailUrl : saved.url,
      videoThumbnail: isVideo ? saved.thumbnailUrl : undefined,
    });

    await addFact(ownerId, `plant:${plant.id}`, `${result.nameFarsi} (${result.scientificName})`);
    await recordMessage(ownerId, 'user', `[ارسال ${isVideo ? 'ویدئو' : 'عکس'} گیاه: ${result.nameFarsi}]`);
    await recordMessage(ownerId, 'model', `تشخیص: ${result.nameFarsi}, سلامت: ${result.healthStatus.healthScore}`);

    await sendTelegramMessage(token, chatId, formatPlantDoctorResult(result), MAIN_MENU_KEYBOARD);
  } catch (error) {
    logger.error('خطا در پردازش رسانه گیاه', error);
    const msg = error instanceof Error ? error.message : 'متاسفانه نتوانستم رسانه را تحلیل کنم.';
    await sendTelegramMessage(token, chatId, msg, MAIN_MENU_KEYBOARD);
  }
}
