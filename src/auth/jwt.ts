import jwt from 'jsonwebtoken';
import { env } from '../utils/env';

export interface AdminTokenPayload {
  adminId: string;
  username: string;
}

const EXPIRES_IN = '12h';

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, env.adminJwtSecret, { expiresIn: EXPIRES_IN });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    return jwt.verify(token, env.adminJwtSecret) as AdminTokenPayload;
  } catch {
    return null;
  }
}
