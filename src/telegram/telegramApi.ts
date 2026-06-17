import { createLogger } from '../utils/logger';

const logger = createLogger('telegramApi');

export async function sendTelegramMessage(token: string, chatId: number | string, text: string, replyMarkup?: unknown) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown',
        ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
      }),
    });
  } catch (e) {
    logger.error('خطا در ارسال پیام تلگرام', e);
  }
}

export async function sendChatAction(token: string, chatId: number | string, action: string) {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendChatAction`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, action }),
    });
  } catch {
    /* بی‌اهمیت */
  }
}

export interface DownloadedTelegramFile {
  buffer: Buffer;
  mimeType: string;
}

const EXT_MIME: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  webm: 'video/webm',
};

export async function downloadTelegramFile(token: string, fileId: string): Promise<DownloadedTelegramFile | null> {
  try {
    const fileInfoRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`);
    const fileInfo: any = await fileInfoRes.json();
    if (!fileInfo.ok) return null;
    const filePath: string = fileInfo.result.file_path;
    const fileRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`);
    const arrayBuffer = await fileRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const ext = filePath.split('.').pop()?.toLowerCase() || 'jpg';
    const mimeType = EXT_MIME[ext] || 'application/octet-stream';
    return { buffer, mimeType };
  } catch (e) {
    logger.error('خطا در دریافت فایل از تلگرام', e);
    return null;
  }
}
