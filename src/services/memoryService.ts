import { store } from '../database/db';
import { summarizeMemory } from '../ai/memorySummarizer';
import { UserMemory } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('memoryService');

/** بعد از این تعداد پیام خام، حافظه به‌صورت خودکار فشرده (summarize) می‌شود */
const COMPRESSION_THRESHOLD = 10;

function emptyMemory(ownerId: string): UserMemory {
  return { ownerId, summary: '', recentMessages: [], facts: [], updatedAt: new Date().toISOString() };
}

export function getMemory(ownerId: string): UserMemory {
  const db = store.read();
  return db.memories[ownerId] || emptyMemory(ownerId);
}

/** متنی که در system instruction به مدل تزریق می‌شود */
export function getMemoryContextString(ownerId: string): string {
  const mem = getMemory(ownerId);
  const factsText = mem.facts.length ? mem.facts.map((f) => `- ${f.key}: ${f.value}`).join('\n') : '';
  if (!mem.summary && !factsText) return '';
  return [mem.summary, factsText].filter(Boolean).join('\n');
}

/** ثبت یک پیام جدید در حافظه خام؛ در صورت رسیدن به آستانه، فشرده‌سازی هوشمند انجام می‌شود */
export async function recordMessage(ownerId: string, role: 'user' | 'model', text: string): Promise<void> {
  let needsCompression = false;
  await store.mutate((db) => {
    const mem = db.memories[ownerId] || emptyMemory(ownerId);
    mem.recentMessages.push({ role, text, at: new Date().toISOString() });
    mem.updatedAt = new Date().toISOString();
    db.memories[ownerId] = mem;
    needsCompression = mem.recentMessages.length >= COMPRESSION_THRESHOLD;
  });

  if (needsCompression) {
    await compressMemory(ownerId);
  }
}

export async function addFact(ownerId: string, key: string, value: string): Promise<void> {
  await store.mutate((db) => {
    const mem = db.memories[ownerId] || emptyMemory(ownerId);
    const existing = mem.facts.find((f) => f.key === key);
    if (existing) {
      existing.value = value;
    } else {
      mem.facts.push({ key, value, createdAt: new Date().toISOString() });
    }
    mem.updatedAt = new Date().toISOString();
    db.memories[ownerId] = mem;
  });
}

/** فشرده‌سازی پیام‌های خام به خلاصه با کمک مدل هوش مصنوعی */
export async function compressMemory(ownerId: string): Promise<void> {
  const mem = getMemory(ownerId);
  if (mem.recentMessages.length === 0) return;

  const recentText = mem.recentMessages.map((m) => `${m.role === 'user' ? 'کاربر' : 'دستیار'}: ${m.text}`).join('\n');

  try {
    const result = await summarizeMemory(mem.summary, recentText);
    await store.mutate((db) => {
      const current = db.memories[ownerId] || emptyMemory(ownerId);
      current.summary = result.summary;
      current.recentMessages = [];
      for (const fact of result.facts) {
        const existing = current.facts.find((f) => f.key === fact.key);
        if (existing) existing.value = fact.value;
        else current.facts.push({ key: fact.key, value: fact.value, createdAt: new Date().toISOString() });
      }
      current.updatedAt = new Date().toISOString();
      db.memories[ownerId] = current;
    });
  } catch (error) {
    logger.warn(`فشرده‌سازی حافظه برای کاربر ${ownerId} ناموفق بود؛ پیام‌های خام نگه داشته می‌شوند`);
  }
}

export async function clearMemory(ownerId: string): Promise<void> {
  await store.mutate((db) => {
    db.memories[ownerId] = emptyMemory(ownerId);
  });
}
