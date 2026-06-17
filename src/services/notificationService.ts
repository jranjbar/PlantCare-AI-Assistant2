import { store } from '../database/db';
import { generateId } from '../utils/asyncHandler';
import { isNotificationDue } from '../utils/dateUtils';
import { ApiError, CareNotification } from '../types';

export function listNotificationsForOwner(ownerId: string): CareNotification[] {
  return store.read().notifications.filter((n) => n.ownerId === ownerId);
}

export async function createNotification(
  ownerId: string,
  data: Omit<CareNotification, 'id' | 'ownerId' | 'completed' | 'createdDate'>
): Promise<CareNotification> {
  const notif: CareNotification = {
    id: generateId('notif'),
    ownerId,
    completed: false,
    createdDate: new Date().toISOString(),
    ...data,
  };
  await store.mutate((db) => {
    db.notifications.push(notif);
  });
  return notif;
}

export async function updateNotification(id: string, patch: Partial<CareNotification>): Promise<CareNotification> {
  return store.mutate((db) => {
    const index = db.notifications.findIndex((n) => n.id === id);
    if (index === -1) throw new ApiError(404, 'یادآور پیدا نشد.');
    db.notifications[index] = { ...db.notifications[index], ...patch };
    return db.notifications[index];
  });
}

export async function deleteNotification(id: string): Promise<void> {
  await store.mutate((db) => {
    db.notifications = db.notifications.filter((n) => n.id !== id);
  });
}

/** یافتن یادآورهایی که اکنون باید برای کاربرشان پیام تلگرام ارسال شود */
export function findDueNotifications(): CareNotification[] {
  const now = new Date();
  return store
    .read()
    .notifications.filter((n) => !n.completed && isNotificationDue(n.lastSentAt || n.lastDoneDate, n.frequencyDays, now));
}

export async function markSent(id: string): Promise<void> {
  await store.mutate((db) => {
    const notif = db.notifications.find((n) => n.id === id);
    if (notif) notif.lastSentAt = new Date().toISOString();
  });
}
