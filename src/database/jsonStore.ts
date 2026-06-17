import fs from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger('jsonStore');

/**
 * فروشگاه ساده‌ی فایل‌محور JSON.
 * چون Node تک‌نخی است اما عملیات فایل async است، یک صف ساده برای جلوگیری
 * از تداخل نوشتن‌های هم‌زمان (race condition) پیاده شده است.
 */
export class JsonFileStore<T> {
  private filePath: string;
  private writeQueue: Promise<void> = Promise.resolve();
  private cache: T | null = null;

  constructor(filePath: string, private readonly defaultValue: () => T) {
    this.filePath = filePath;
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  read(): T {
    if (this.cache) return this.cache;
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        this.cache = JSON.parse(raw) as T;
        return this.cache;
      }
    } catch (e) {
      logger.error(`خطا در خوانش فایل ${this.filePath}، بازگشت به مقدار پیش‌فرض`, e);
    }
    this.cache = this.defaultValue();
    return this.cache;
  }

  /** نوشتن اتمیک: ابتدا روی فایل موقت، سپس rename */
  private writeSync(data: T) {
    const tmpPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpPath, this.filePath);
    this.cache = data;
  }

  /** تغییر اتمیک: mutator روی نسخه فعلی اعمال می‌شود و نتیجه نوشته می‌شود */
  async mutate<R>(mutator: (data: T) => R): Promise<R> {
    let result!: R;
    this.writeQueue = this.writeQueue.then(() => {
      const data = this.read();
      result = mutator(data);
      this.writeSync(data);
    });
    await this.writeQueue;
    return result;
  }
}
