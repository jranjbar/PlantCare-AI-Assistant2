import { Router } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { loginAdmin } from '../auth/adminAuthService';
import { requireAdminAuth } from '../middleware/authMiddleware';
import { rateLimit } from '../middleware/rateLimiter';
import { ApiError } from '../types';

export const authRouter = Router();

authRouter.post(
  '/auth/login',
  rateLimit(10, 60_000),
  asyncHandler(async (req, res) => {
    const { username, password } = req.body || {};
    if (!username || !password) {
      throw new ApiError(400, 'نام کاربری و رمز عبور الزامی است.');
    }
    const { token, admin } = await loginAdmin(username, password);
    res.cookie('admin_token', token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 12 * 60 * 60 * 1000,
    });
    res.json({ token, admin });
  })
);

authRouter.post('/auth/logout', (req, res) => {
  res.clearCookie('admin_token');
  res.json({ success: true });
});

authRouter.get('/auth/me', requireAdminAuth, (req, res) => {
  res.json({ admin: req.admin });
});
