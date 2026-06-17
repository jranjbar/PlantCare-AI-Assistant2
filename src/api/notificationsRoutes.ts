import { Router } from 'express';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listNotificationsForOwner,
  createNotification,
  updateNotification,
  deleteNotification,
} from '../services/notificationService';
import { ApiError } from '../types';

export const notificationsRouter = Router();

notificationsRouter.get(
  '/admin/notifications',
  requireAdminAuth,
  (req, res) => {
    const ownerId = String(req.query.ownerId || '');
    if (!ownerId) throw new ApiError(400, 'پارامتر ownerId الزامی است.');
    res.json(listNotificationsForOwner(ownerId));
  }
);

notificationsRouter.post(
  '/admin/notifications',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const { ownerId, ...data } = req.body;
    if (!ownerId) throw new ApiError(400, 'ownerId الزامی است.');
    res.json(await createNotification(ownerId, data));
  })
);

notificationsRouter.put(
  '/admin/notifications/:id',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    res.json(await updateNotification(req.params.id, req.body));
  })
);

notificationsRouter.delete(
  '/admin/notifications/:id',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    await deleteNotification(req.params.id);
    res.json({ success: true });
  })
);
