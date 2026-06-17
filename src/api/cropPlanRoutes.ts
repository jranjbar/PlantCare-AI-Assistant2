import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { generateCropPlan } from '../ai/cropPlanner';
import { ApiError } from '../types';

export const cropPlanRouter = Router();

cropPlanRouter.post(
  '/crop-plan',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const { plantName } = req.body;
    if (!plantName) throw new ApiError(400, 'نام گیاه یا محصول زراعی الزامی است.');
    const result = await generateCropPlan(req.body);
    res.json(result);
  })
);
