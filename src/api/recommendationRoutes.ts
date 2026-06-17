import { Router } from 'express';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import { listRecommendations, regenerateRecommendations, dismissRecommendation } from '../services/recommendationService';
import { ApiError } from '../types';

export const recommendationRouter = Router();

recommendationRouter.get('/admin/recommendations', requireAdminAuth, (req, res) => {
  const ownerId = String(req.query.ownerId || '');
  if (!ownerId) throw new ApiError(400, 'پارامتر ownerId الزامی است.');
  res.json(listRecommendations(ownerId));
});

recommendationRouter.post(
  '/admin/recommendations/regenerate',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const { ownerId } = req.body;
    if (!ownerId) throw new ApiError(400, 'ownerId الزامی است.');
    res.json(await regenerateRecommendations(ownerId));
  })
);

recommendationRouter.post(
  '/admin/recommendations/:id/dismiss',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    await dismissRecommendation(req.params.id);
    res.json({ success: true });
  })
);
