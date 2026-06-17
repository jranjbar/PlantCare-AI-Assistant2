import { Type } from '@google/genai';

export const plantDoctorSchema = {
  type: Type.OBJECT,
  properties: {
    nameFarsi: { type: Type.STRING },
    nameEnglish: { type: Type.STRING },
    scientificName: { type: Type.STRING },
    description: { type: Type.STRING },
    confidence: { type: Type.INTEGER },
    careInfo: {
      type: Type.OBJECT,
      properties: {
        watering: { type: Type.STRING },
        sunlight: { type: Type.STRING },
        temperature: { type: Type.STRING },
        soil: { type: Type.STRING },
        toxicity: { type: Type.STRING },
      },
      required: ['watering', 'sunlight', 'temperature', 'soil', 'toxicity'],
    },
    healthStatus: {
      type: Type.OBJECT,
      properties: {
        healthScore: { type: Type.INTEGER },
        issuesFound: { type: Type.BOOLEAN },
        symptoms: { type: Type.ARRAY, items: { type: Type.STRING } },
        diagnoses: { type: Type.STRING },
        treatment: { type: Type.STRING },
      },
      required: ['healthScore', 'issuesFound', 'diagnoses', 'treatment'],
    },
    quickTips: { type: Type.ARRAY, items: { type: Type.STRING } },
    cultivationAdvice: { type: Type.STRING },
  },
  required: [
    'nameFarsi',
    'nameEnglish',
    'scientificName',
    'description',
    'confidence',
    'careInfo',
    'healthStatus',
    'quickTips',
    'cultivationAdvice',
  ],
};

export const cropPlanSchema = {
  type: Type.OBJECT,
  properties: {
    cropTitle: { type: Type.STRING },
    estimatedDurationWeeks: { type: Type.INTEGER },
    generalAdvice: { type: Type.STRING },
    stages: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          stageId: { type: Type.INTEGER },
          title: { type: Type.STRING },
          durationWeeks: { type: Type.INTEGER },
          temperatureIdeal: { type: Type.STRING },
          tasks: { type: Type.ARRAY, items: { type: Type.STRING } },
          warningSigns: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: ['stageId', 'title', 'durationWeeks', 'temperatureIdeal', 'tasks', 'warningSigns'],
      },
    },
    pestControlTips: { type: Type.ARRAY, items: { type: Type.STRING } },
    fertilizerTimeline: { type: Type.ARRAY, items: { type: Type.STRING } },
  },
  required: ['cropTitle', 'estimatedDurationWeeks', 'generalAdvice', 'stages', 'pestControlTips', 'fertilizerTimeline'],
};

export const recommendationListSchema = {
  type: Type.OBJECT,
  properties: {
    recommendations: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          category: {
            type: Type.STRING,
            enum: ['watering', 'fertilizing', 'pest', 'seasonal', 'general'],
          },
          title: { type: Type.STRING },
          body: { type: Type.STRING },
          relatedPlantName: { type: Type.STRING },
        },
        required: ['category', 'title', 'body'],
      },
    },
  },
  required: ['recommendations'],
};

export const memorySummarySchema = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    facts: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          value: { type: Type.STRING },
        },
        required: ['key', 'value'],
      },
    },
  },
  required: ['summary', 'facts'],
};
