import { store } from '../database/db';
import { verifyPassword } from './passwordUtils';
import { signAdminToken } from './jwt';
import { ApiError } from '../types';

export async function loginAdmin(username: string, password: string) {
  const db = store.read();
  const admin = db.admins.find((a) => a.username === username);
  if (!admin) {
    throw new ApiError(401, 'نام کاربری یا رمز عبور نادرست است.');
  }
  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) {
    throw new ApiError(401, 'نام کاربری یا رمز عبور نادرست است.');
  }
  const token = signAdminToken({ adminId: admin.id, username: admin.username });
  return { token, admin: { id: admin.id, username: admin.username } };
}
