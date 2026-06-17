import { Router } from 'express';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { listUsers, getUser } from '../services/userService';
import { listPlantsForOwner } from '../services/plantService';
import { listNotificationsForOwner } from '../services/notificationService';
import { getSubscription, PLANS } from '../services/subscriptionService';
import { getMemory } from '../services/memoryService';
import { listRecommendations } from '../services/recommendationService';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../types';

export const usersRouter = Router();

usersRouter.get(
  '/admin/users',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const users = await Promise.all(
      listUsers().map(async (u) => ({
        chatId: u.profile.chatId,
        firstName: u.profile.firstName,
        username: u.profile.username,
        createdAt: u.profile.createdAt,
        lastActiveAt: u.profile.lastActiveAt,
        tier: u.subscription.tier,
        plantsCount: (await listPlantsForOwner(u.profile.chatId)).length,
      }))
    );
    res.json(users);
  })
);

usersRouter.get(
  '/admin/users/:chatId',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const { chatId } = req.params;
    const user = getUser(chatId);
    if (!user) throw new ApiError(404, 'کاربر پیدا نشد.');
    res.json({
      profile: user.profile,
      subscription: getSubscription(chatId),
      plan: PLANS[user.subscription.tier],
      plants: await listPlantsForOwner(chatId),
      notifications: listNotificationsForOwner(chatId),
      memory: getMemory(chatId),
      recommendations: listRecommendations(chatId),
    });
  })
);
