import { store, ensureUserSync } from '../database/db';
import { startOfCurrentMonthIso, isSamePeriod } from '../utils/dateUtils';
import { ApiError, FarmerSubscription, PlanDefinition, SubscriptionTier } from '../types';

export const PLANS: Record<SubscriptionTier, PlanDefinition> = {
  free: {
    tier: 'free',
    titleFa: 'رایگان',
    priceTomanMonthly: 0,
    scansLimit: 3,
    plansLimit: 1,
    chatsLimit: 5,
    maxPlants: 3,
    videoDoctor: false,
  },
  pro: {
    tier: 'pro',
    titleFa: 'کشاورز ویژه',
    priceTomanMonthly: 149000,
    scansLimit: 50,
    plansLimit: 10,
    chatsLimit: 200,
    maxPlants: 30,
    videoDoctor: true,
  },
  business: {
    tier: 'business',
    titleFa: 'تجاری / مزرعه',
    priceTomanMonthly: 490000,
    scansLimit: 500,
    plansLimit: 100,
    chatsLimit: 2000,
    maxPlants: 500,
    videoDoctor: true,
  },
};

type Feature = 'scans' | 'plans' | 'chats';

function resetIfNewPeriod(sub: FarmerSubscription) {
  if (!isSamePeriod(sub.periodStart)) {
    sub.periodStart = startOfCurrentMonthIso();
    sub.scansCount = 0;
    sub.plansCount = 0;
    sub.chatsCount = 0;
  }
}

/** بررسی محدودیت پلن و در صورت مجاز بودن، مصرف را افزایش می‌دهد؛ در غیر این صورت خطا می‌دهد */
export async function checkAndConsume(ownerId: string, feature: Feature): Promise<FarmerSubscription> {
  return store.mutate((db) => {
    const user = ensureUserSync(db, ownerId);
    const sub = user.subscription;
    resetIfNewPeriod(sub);
    const plan = PLANS[sub.tier];

    const countKey = `${feature}Count` as const;
    const limitKey = `${feature}Limit` as const;
    const current = sub[countKey];
    const limit = plan[limitKey];

    if (current >= limit) {
      throw new ApiError(
        403,
        `محدودیت پلن «${plan.titleFa}» شما به پایان رسیده. برای دسترسی نامحدودتر، حساب خود را ارتقا دهید. 🌱`
      );
    }
    sub[countKey] = current + 1;
    return sub;
  });
}

export function getSubscription(ownerId: string): FarmerSubscription {
  const db = store.read();
  const user = db.users[ownerId];
  if (!user) {
    return { tier: 'free', scansCount: 0, plansCount: 0, chatsCount: 0, periodStart: startOfCurrentMonthIso() };
  }
  resetIfNewPeriod(user.subscription);
  return user.subscription;
}

export async function setTier(ownerId: string, tier: SubscriptionTier): Promise<FarmerSubscription> {
  return store.mutate((db) => {
    const user = ensureUserSync(db, ownerId);
    user.subscription.tier = tier;
    user.subscription.upgradedAt = new Date().toISOString();
    return user.subscription;
  });
}

export async function resetUsage(ownerId: string): Promise<FarmerSubscription> {
  return store.mutate((db) => {
    const user = ensureUserSync(db, ownerId);
    user.subscription.scansCount = 0;
    user.subscription.plansCount = 0;
    user.subscription.chatsCount = 0;
    user.subscription.periodStart = startOfCurrentMonthIso();
    return user.subscription;
  });
}

export function canAddPlant(ownerId: string, currentPlantCount: number): boolean {
  const sub = getSubscription(ownerId);
  return currentPlantCount < PLANS[sub.tier].maxPlants;
}

export function canUseVideoDoctor(ownerId: string): boolean {
  const sub = getSubscription(ownerId);
  return PLANS[sub.tier].videoDoctor;
}
