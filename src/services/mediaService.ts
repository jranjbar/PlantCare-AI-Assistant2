import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { userMediaDir } from '../database/paths';
import { generateId } from '../utils/asyncHandler';
import { createLogger } from '../utils/logger';

const execFileAsync = promisify(execFile);
const logger = createLogger('mediaService');

const EXT_BY_MIME: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
  'video/webm': 'webm',
};

export interface SavedMedia {
  /** مسیر قابل دسترس از طریق وب، مثلاً /media/<ownerId>/<file>.mp4 */
  url: string;
  absolutePath: string;
  thumbnailUrl?: string;
}

export async function saveMediaFile(ownerId: string, buffer: Buffer, mimeType: string): Promise<SavedMedia> {
  const dir = userMediaDir(ownerId);
  fs.mkdirSync(dir, { recursive: true });

  const ext = EXT_BY_MIME[mimeType] || (mimeType.startsWith('video/') ? 'mp4' : 'jpg');
  const filename = `${generateId('media')}.${ext}`;
  const absolutePath = path.join(dir, filename);
  fs.writeFileSync(absolutePath, buffer);

  const url = `/media/${ownerId}/${filename}`;
  const result: SavedMedia = { url, absolutePath };

  if (mimeType.startsWith('video/')) {
    const thumb = await tryExtractThumbnail(absolutePath, dir, ownerId);
    if (thumb) result.thumbnailUrl = thumb;
  }

  return result;
}

async function tryExtractThumbnail(videoPath: string, dir: string, ownerId: string): Promise<string | null> {
  const thumbName = `${generateId('thumb')}.jpg`;
  const thumbPath = path.join(dir, thumbName);
  try {
    await execFileAsync('ffmpeg', ['-y', '-ss', '00:00:00.5', '-i', videoPath, '-frames:v', '1', thumbPath]);
    if (fs.existsSync(thumbPath)) {
      return `/media/${ownerId}/${thumbName}`;
    }
    return null;
  } catch (error) {
    logger.warn('استخراج تصویر بندانگشتی از ویدئو ناموفق بود (ffmpeg موجود نیست یا خطا داشت)');
    return null;
  }
}
