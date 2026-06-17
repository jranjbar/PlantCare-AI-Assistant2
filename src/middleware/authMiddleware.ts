import { Request, Response, NextFunction } from 'express';
import { verifyAdminToken, AdminTokenPayload } from '../auth/jwt';

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  if (req.cookies?.admin_token) return req.cookies.admin_token;
  return null;
}

export function requireAdminAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  const payload = token ? verifyAdminToken(token) : null;
  if (!payload) {
    return res.status(401).json({ error: 'برای دسترسی به این بخش باید وارد حساب ادمین شوید.' });
  }
  req.admin = payload;
  next();
}

/** برای وب‌هوک تلگرام: تأیید هدر سکرت تا فقط تلگرام بتواند این مسیر را صدا بزند */
export function requireTelegramSecret(expectedSecret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const provided = req.headers['x-telegram-bot-api-secret-token'];
    if (!expectedSecret || provided === expectedSecret) return next();
    res.sendStatus(401);
  };
}
