import { randomUUID } from 'crypto';
import { Request, Response, NextFunction, RequestHandler } from 'express';

export function generateId(prefix: string): string {
  return `${prefix}_${randomUUID()}`;
}

/** پوشاندن هندلرهای async تا خطاها به errorHandler مرکزی منتقل شوند */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
