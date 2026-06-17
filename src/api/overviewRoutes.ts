import { Router } from 'express';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { store } from '../database/db';
import { findDueNotifications } from '../services/notificationService';

export const overviewRouter = Router();

overviewRouter.get('/admin/overview', requireAdminAuth, (req, res) => {
  const db = store.read();
  const users = Object.values(db.users);
  const tierCounts = { free: 0, pro: 0, business: 0 };
  for (const u of users) tierCounts[u.subscription.tier]++;

  res.json({
    totalUsers: users.length,
    totalPlants: db.plants.length,
    activeNotifications: db.notifications.filter((n) => !n.completed).length,
    dueNotificationsNow: findDueNotifications().length,
    tierCounts,
    recentUsers: users
      .sort((a, b) => new Date(b.profile.lastActiveAt).getTime() - new Date(a.profile.lastActiveAt).getTime())
      .slice(0, 5)
      .map((u) => ({ chatId: u.profile.chatId, firstName: u.profile.firstName, tier: u.subscription.tier })),
  });
});
