import { store } from '../database/db';
import { generateId } from '../utils/asyncHandler';
import { ApiError, PlantDoctorResult, PlantRecord, PlantLog, PlantStage, PlantLocation } from '../types';

export async function listPlantsForOwner(ownerId: string): Promise<PlantRecord[]> {
  return store.mutate((db) => db.plants.filter((p) => p.ownerId === ownerId));
}

export function getPlant(plantId: string): PlantRecord | undefined {
  return store.read().plants.find((p) => p.id === plantId);
}

/** ساخت یک رکورد CRM جدید از خروجی دکتر هوشمند گیاه (یا داده‌ی دستی) */
export async function createPlantFromDoctorResult(
  ownerId: string,
  result: PlantDoctorResult,
  extra?: { imageUrl?: string; stage?: PlantStage; location?: PlantLocation; tags?: string[] }
): Promise<PlantRecord> {
  const now = new Date().toISOString();
  const plant: PlantRecord = {
    id: generateId('plant'),
    ownerId,
    addedDate: now,
    updatedAt: now,
    nameFarsi: result.nameFarsi,
    nameEnglish: result.nameEnglish,
    scientificName: result.scientificName,
    description: result.description,
    imageUrl: extra?.imageUrl,
    careInfo: result.careInfo,
    healthStatus: result.healthStatus,
    logs: [],
    stage: extra?.stage || 'growing',
    location: extra?.location || 'indoor',
    tags: extra?.tags || [],
    lastWateredAt: undefined,
    nextWateringDueAt: undefined,
  };
  await store.mutate((db) => {
    db.plants.push(plant);
  });
  return plant;
}

export async function createPlant(
  ownerId: string,
  data: Partial<PlantRecord> & Pick<PlantRecord, 'nameFarsi'>
): Promise<PlantRecord> {
  const now = new Date().toISOString();
  const plant: PlantRecord = {
    id: generateId('plant'),
    ownerId,
    addedDate: now,
    updatedAt: now,
    nameFarsi: data.nameFarsi,
    nameEnglish: data.nameEnglish || '',
    scientificName: data.scientificName || '',
    description: data.description || '',
    imageUrl: data.imageUrl,
    careInfo: data.careInfo || { watering: '', sunlight: '', temperature: '', soil: '', toxicity: '' },
    healthStatus:
      data.healthStatus || { healthScore: 100, issuesFound: false, symptoms: [], diagnoses: 'سالم', treatment: '' },
    logs: [],
    stage: data.stage || 'seedling',
    location: data.location || 'indoor',
    tags: data.tags || [],
  };
  await store.mutate((db) => {
    db.plants.push(plant);
  });
  return plant;
}

export async function updatePlant(plantId: string, patch: Partial<PlantRecord>): Promise<PlantRecord> {
  return store.mutate((db) => {
    const index = db.plants.findIndex((p) => p.id === plantId);
    if (index === -1) throw new ApiError(404, 'گیاه پیدا نشد.');
    db.plants[index] = { ...db.plants[index], ...patch, updatedAt: new Date().toISOString() };
    return db.plants[index];
  });
}

export async function deletePlant(plantId: string): Promise<void> {
  await store.mutate((db) => {
    db.plants = db.plants.filter((p) => p.id !== plantId);
  });
}

export async function addPlantLog(plantId: string, log: Omit<PlantLog, 'id'>): Promise<PlantRecord> {
  return store.mutate((db) => {
    const plant = db.plants.find((p) => p.id === plantId);
    if (!plant) throw new ApiError(404, 'گیاه پیدا نشد.');
    plant.logs.push({ id: generateId('log'), ...log });
    plant.updatedAt = new Date().toISOString();
    return plant;
  });
}

export async function markWatered(plantId: string): Promise<PlantRecord> {
  return store.mutate((db) => {
    const plant = db.plants.find((p) => p.id === plantId);
    if (!plant) throw new ApiError(404, 'گیاه پیدا نشد.');
    plant.lastWateredAt = new Date().toISOString();
    plant.updatedAt = plant.lastWateredAt;
    return plant;
  });
}
