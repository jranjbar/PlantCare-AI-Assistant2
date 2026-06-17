import { Router } from 'express';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/asyncHandler';
import {
  listPlantsForOwner,
  createPlant,
  updatePlant,
  deletePlant,
  addPlantLog,
  markWatered,
} from '../services/plantService';
import { ApiError } from '../types';

export const plantsRouter = Router();

plantsRouter.get(
  '/admin/plants',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const ownerId = String(req.query.ownerId || '');
    if (!ownerId) throw new ApiError(400, 'پارامتر ownerId الزامی است.');
    res.json(await listPlantsForOwner(ownerId));
  })
);

plantsRouter.post(
  '/admin/plants',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    const { ownerId, ...data } = req.body;
    if (!ownerId || !data.nameFarsi) throw new ApiError(400, 'ownerId و nameFarsi الزامی هستند.');
    res.json(await createPlant(ownerId, data));
  })
);

plantsRouter.put(
  '/admin/plants/:id',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    res.json(await updatePlant(req.params.id, req.body));
  })
);

plantsRouter.delete(
  '/admin/plants/:id',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    await deletePlant(req.params.id);
    res.json({ success: true });
  })
);

plantsRouter.post(
  '/admin/plants/:id/logs',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    res.json(await addPlantLog(req.params.id, req.body));
  })
);

plantsRouter.post(
  '/admin/plants/:id/water',
  requireAdminAuth,
  asyncHandler(async (req, res) => {
    res.json(await markWatered(req.params.id));
  })
);
