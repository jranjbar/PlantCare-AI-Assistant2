import { Router } from 'express';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { getSubscription, setTier, resetUsage, PLANS } from '../services/subscriptionService';
import { ApiError } from '../types';
import { SubscriptionTier } from '../types';

export const subscriptionRouter = Router();

subscriptionRouter.get('/admin/plans', requireAdminAuth, (req, res) => {
  res.json(Object.values(PLANS));
});

subscriptionRouter.get('/admin/subscription', requireAdminAuth, (req, res) => {
  const ownerId = String(req.query.ownerId || '');
  if (!ownerId) throw new ApiError(400, 'پارامتر ownerId الزامی است.');
  res.json(getSubscription(ownerId));
});

subscriptionRouter.post(
  '/admin/subscription/:ownerId/tier',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const tier = req.body.tier as SubscriptionTier;
    if (!PLANS[tier]) throw new ApiError(400, 'پلن نامعتبر است.');
    res.json(await setTier(req.params.ownerId, tier));
  })
);

subscriptionRouter.post(
  '/admin/subscription/:ownerId/reset-usage',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    res.json(await resetUsage(req.params.ownerId));
  })
);
