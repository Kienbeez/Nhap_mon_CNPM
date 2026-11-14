import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import {
  AUTH_COOKIE_NAME,
  type JwtSessionPayload,
  getAuthCookieOptions,
  getJwtSecretKey,
  signJwtToken,
  verifyJwtToken,
} from './jwt';

// ============================================================================
// AUTHENTICATION & PASSWORD UTILITIES (Server / Node.js Runtime)
// ============================================================================

export {
  AUTH_COOKIE_NAME,
  type JwtSessionPayload,
  getAuthCookieOptions,
  getJwtSecretKey,
  signJwtToken,
  verifyJwtToken,
};

/**
 * Chuỗi bcrypt hash giả (10 rounds) dùng để cân bằng thời gian phản hồi (chống Timing Attack)
 * khi người dùng đăng nhập bằng email không tồn tại trong hệ thống.
 */
export const DUMMY_PASSWORD_HASH =
  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

/**
 * Mã hóa mật khẩu người dùng bằng thuật toán bcrypt (10 salt rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Kiểm tra mật khẩu nhập vào so với chuỗi hash lưu trong CSDL
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Lấy thông tin người dùng hiện tại từ HTTP-Only Cookie trong Server Components / API Routes
 */
export async function getSessionUser(): Promise<JwtSessionPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  return verifyJwtToken(token);
}
