import { store } from '../database/db';
import { generateId } from '../utils/asyncHandler';
import { generateRecommendations } from '../ai/recommendationEngine';
import { listPlantsForOwner } from './plantService';
import { getMemory } from './memoryService';
import { Recommendation } from '../types';

export function listRecommendations(ownerId: string): Recommendation[] {
  return store.read().recommendations.filter((r) => r.ownerId === ownerId && !r.dismissed);
}

export async function dismissRecommendation(id: string): Promise<void> {
  await store.mutate((db) => {
    const rec = db.recommendations.find((r) => r.id === id);
    if (rec) rec.dismissed = true;
  });
}

/** بازتولید توصیه‌ها برای یک کاربر بر اساس گیاهان CRM و حافظه‌اش */
export async function regenerateRecommendations(ownerId: string): Promise<Recommendation[]> {
  const plants = await listPlantsForOwner(ownerId);
  const memory = getMemory(ownerId);
  const raw = await generateRecommendations(plants, memory.summary);

  const now = new Date().toISOString();
  const fresh: Recommendation[] = raw.map((r) => {
    const relatedPlant = r.relatedPlantName
      ? plants.find((p) => p.nameFarsi.includes(r.relatedPlantName!) || r.relatedPlantName!.includes(p.nameFarsi))
      : undefined;
    return {
      id: generateId('rec'),
      ownerId,
      category: r.category,
      title: r.title,
      body: r.body,
      relatedPlantId: relatedPlant?.id,
      createdAt: now,
      dismissed: false,
    };
  });

  await store.mutate((db) => {
    // توصیه‌های قبلیِ این کاربر که قبلاً دیسمیس نشده‌اند هم بازنشانی می‌شوند تا تکراری نشوند
    db.recommendations = db.recommendations.filter((r) => r.ownerId !== ownerId);
    db.recommendations.push(...fresh);
  });

  return fresh;
}
