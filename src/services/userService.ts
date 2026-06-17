import { store, ensureUserSync } from '../database/db';
import { UserRecord } from '../types';

export async function getOrCreateUser(
  chatId: string,
  profile?: { firstName?: string; username?: string }
): Promise<UserRecord> {
  return store.mutate((db) => {
    const user = ensureUserSync(db, chatId, profile);
    user.profile.lastActiveAt = new Date().toISOString();
    if (profile?.firstName) user.profile.firstName = profile.firstName;
    if (profile?.username) user.profile.username = profile.username;
    return { ...user };
  });
}

export function listUsers(): UserRecord[] {
  const db = store.read();
  return Object.values(db.users).sort(
    (a, b) => new Date(b.profile.lastActiveAt).getTime() - new Date(a.profile.lastActiveAt).getTime()
  );
}

export function getUser(chatId: string): UserRecord | undefined {
  return store.read().users[chatId];
}

export async function setSessionState(chatId: string, state: string, data?: Record<string, unknown>) {
  await store.mutate((db) => {
    const user = ensureUserSync(db, chatId);
    user.session = { state, data };
  });
}

export function getSessionState(chatId: string) {
  const db = store.read();
  return db.users[chatId]?.session || { state: 'idle' };
}
