import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { analyzePlantMedia } from '../ai/plantDoctor';
import { decodeBase64Media } from '../utils/mediaUtils';
import { ApiError } from '../types';

export const identifyRouter = Router();

identifyRouter.post(
  '/identify',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const { image, mode } = req.body;
    if (!image) throw new ApiError(400, 'لطفاً تصویر یا ویدئوی گیاه خود را بارگذاری کنید.');
    const { mimeType, base64Data } = decodeBase64Media(image);
    const result = await analyzePlantMedia({ base64Data, mimeType, mode });
    res.json(result);
  })
);
