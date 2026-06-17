import path from 'path';

export const DATA_DIR = path.join(process.cwd(), 'data');
export const DB_PATH = path.join(DATA_DIR, 'db.json');
export const MEDIA_DIR = path.join(DATA_DIR, 'media');

export function userMediaDir(ownerId: string): string {
  return path.join(MEDIA_DIR, ownerId);
}
