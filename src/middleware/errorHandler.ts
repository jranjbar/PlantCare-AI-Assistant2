import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';
import { createLogger } from '../utils/logger';

const logger = createLogger('errorHandler');

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: 'مسیر درخواستی یافت نشد.' });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    return res.status(err.status).json({ error: err.message });
  }
  const message = err instanceof Error ? err.message : 'خطای ناشناخته در سرور';
  logger.error(`خطای پردازش‌نشده در ${req.method} ${req.path}`, err);
  res.status(500).json({ error: message || 'خطای داخلی سرور رخ داد.' });
}
