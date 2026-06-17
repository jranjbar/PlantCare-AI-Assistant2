import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { chatWithAdvisor } from '../ai/chatAdvisor';
import { getMemoryContextString } from '../services/memoryService';
import { decodeBase64Media } from '../utils/mediaUtils';

export const chatRouter = Router();

chatRouter.post(
  '/chat',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const { message, history, currentPlantImage, asUserId } = req.body;
    const imageBase64 = currentPlantImage ? decodeBase64Media(currentPlantImage) : undefined;
    const memoryContext = asUserId ? getMemoryContextString(asUserId) : '';
    const text = await chatWithAdvisor({
      message,
      history,
      imageBase64: imageBase64 ? { mimeType: imageBase64.mimeType, data: imageBase64.base64Data } : undefined,
      memoryContext,
    });
    res.json({ text });
  })
);
