export interface DecodedMedia {
  mimeType: string;
  base64Data: string;
  buffer: Buffer;
}

const DATA_URL_RE = /^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/;

/** هم data-url و هم base64 خام را می‌پذیرد */
export function decodeBase64Media(input: string, fallbackMime = 'image/jpeg'): DecodedMedia {
  const matches = input.match(DATA_URL_RE);
  const mimeType = matches ? matches[1] : fallbackMime;
  const base64Data = matches ? matches[2] : input;
  return { mimeType, base64Data, buffer: Buffer.from(base64Data, 'base64') };
}

export function bufferToDataUrl(buffer: Buffer, mimeType: string): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

export function isVideoMime(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}

/** حداکثر اندازه‌ای که برای ارسال inline به Gemini منطقی است (۲۰ مگابایت) */
export const MAX_INLINE_MEDIA_BYTES = 20 * 1024 * 1024;
