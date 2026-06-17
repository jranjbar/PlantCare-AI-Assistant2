import {
  PlantRecord,
  CareNotification,
  Recommendation,
  FarmerSubscription,
  PlanDefinition,
  UserMemory,
  TelegramSettings,
  SubscriptionTier,
} from '../types';

export class ApiClientError extends Error {}

async function request<T>(url: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${url}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiClientError(body.error || `خطای سرور (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  login: (username: string, password: string) =>
    request<{ token: string; admin: { id: string; username: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ admin: { adminId: string; username: string } }>('/auth/me'),
  logout: () => request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  overview: () =>
    request<{
      totalUsers: number;
      totalPlants: number;
      activeNotifications: number;
      dueNotificationsNow: number;
      tierCounts: Record<SubscriptionTier, number>;
      recentUsers: { chatId: string; firstName?: string; tier: SubscriptionTier }[];
    }>('/admin/overview'),

  listUsers: () =>
    request<
      { chatId: string; firstName?: string; username?: string; createdAt: string; lastActiveAt: string; tier: SubscriptionTier; plantsCount: number }[]
    >('/admin/users'),

  getUserDetail: (chatId: string) =>
    request<{
      profile: { chatId: string; firstName?: string; username?: string; createdAt: string; lastActiveAt: string };
      subscription: FarmerSubscription;
      plan: PlanDefinition;
      plants: PlantRecord[];
      notifications: CareNotification[];
      memory: UserMemory;
      recommendations: Recommendation[];
    }>(`/admin/users/${chatId}`),

  listPlans: () => request<PlanDefinition[]>('/admin/plans'),

  setUserTier: (chatId: string, tier: SubscriptionTier) =>
    request<FarmerSubscription>(`/admin/subscription/${chatId}/tier`, {
      method: 'POST',
      body: JSON.stringify({ tier }),
    }),
  resetUsage: (chatId: string) =>
    request<FarmerSubscription>(`/admin/subscription/${chatId}/reset-usage`, { method: 'POST' }),

  createPlant: (ownerId: string, data: Partial<PlantRecord> & { nameFarsi: string }) =>
    request<PlantRecord>('/admin/plants', { method: 'POST', body: JSON.stringify({ ownerId, ...data }) }),
  updatePlant: (id: string, patch: Partial<PlantRecord>) =>
    request<PlantRecord>(`/admin/plants/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  deletePlant: (id: string) => request<{ success: boolean }>(`/admin/plants/${id}`, { method: 'DELETE' }),
  waterPlant: (id: string) => request<PlantRecord>(`/admin/plants/${id}/water`, { method: 'POST' }),

  createNotification: (ownerId: string, data: Omit<CareNotification, 'id' | 'ownerId' | 'completed' | 'createdDate'>) =>
    request<CareNotification>('/admin/notifications', { method: 'POST', body: JSON.stringify({ ownerId, ...data }) }),
  updateNotification: (id: string, patch: Partial<CareNotification>) =>
    request<CareNotification>(`/admin/notifications/${id}`, { method: 'PUT', body: JSON.stringify(patch) }),
  deleteNotification: (id: string) => request<{ success: boolean }>(`/admin/notifications/${id}`, { method: 'DELETE' }),

  regenerateRecommendations: (ownerId: string) =>
    request<Recommendation[]>('/admin/recommendations/regenerate', { method: 'POST', body: JSON.stringify({ ownerId }) }),
  dismissRecommendation: (id: string) =>
    request<{ success: boolean }>(`/admin/recommendations/${id}/dismiss`, { method: 'POST' }),

  clearMemory: (chatId: string) => request<{ success: boolean }>(`/admin/users/${chatId}/memory`, { method: 'DELETE' }),

  getTelegramConfig: () => request<TelegramSettings & { tgTokenMasked: string }>('/admin/telegram-config'),
  saveTelegramConfig: (data: Partial<TelegramSettings>) =>
    request<TelegramSettings>('/admin/telegram-config', { method: 'POST', body: JSON.stringify(data) }),

  testIdentify: (image: string, mode?: string) =>
    request<any>('/identify', { method: 'POST', body: JSON.stringify({ image, mode }) }),
  testCropPlan: (plantName: string) =>
    request<any>('/crop-plan', { method: 'POST', body: JSON.stringify({ plantName }) }),
  testChat: (message: string, asUserId?: string) =>
    request<{ text: string }>('/chat', { method: 'POST', body: JSON.stringify({ message, asUserId }) }),
};
