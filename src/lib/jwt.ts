import { SignJWT, jwtVerify } from 'jose';

// ============================================================================
// EDGE-SAFE JWT UTILITIES
// Tách biệt hoàn toàn khỏi bcryptjs và next/headers để chạy nhẹ nhàng trên Next.js Edge Middleware
// ============================================================================

export const AUTH_COOKIE_NAME = 'finance_auth_token';
const TOKEN_EXPIRATION = '7d'; // Phiên đăng nhập có hiệu lực 7 ngày
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 ngày (tính bằng giây)
const DEV_FALLBACK_SECRET = 'dev-only-jwt-secret-key-personal-finance-tracker-local';

export interface JwtSessionPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Lấy khóa bí mật JWT dưới dạng Uint8Array cho thư viện jose.
 * Bắt buộc phải cấu hình JWT_SECRET (tối thiểu 32 ký tự) trên môi trường production.
 */
export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET?.trim();

  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'CRITICAL: Biến môi trường JWT_SECRET bắt buộc phải được cấu hình trên môi trường production.'
      );
    }
    return new TextEncoder().encode(DEV_FALLBACK_SECRET);
  }

  if (process.env.NODE_ENV === 'production' && secret.length < 32) {
    throw new Error(
      'CRITICAL: Biến môi trường JWT_SECRET phải có độ dài tối thiểu 32 ký tự trên môi trường production.'
    );
  }

  return new TextEncoder().encode(secret);
}

/**
 * Ký và tạo chuỗi JWT Token từ thông tin phiên người dùng
 */
export async function signJwtToken(payload: JwtSessionPayload): Promise<string> {
  const secretKey = getJwtSecretKey();

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(TOKEN_EXPIRATION)
    .sign(secretKey);
}

/**
 * Xác thực và giải mã JWT Token.
 * Trả về thông tin user nếu hợp lệ, hoặc null nếu token hết hạn / bị giả mạo.
 */
export async function verifyJwtToken(token: string): Promise<JwtSessionPayload | null> {
  try {
    const secretKey = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secretKey);

    if (
      typeof payload.userId === 'string' &&
      typeof payload.email === 'string' &&
      typeof payload.name === 'string'
    ) {
      return {
        userId: payload.userId,
        email: payload.email,
        name: payload.name,
      };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Cấu hình chuẩn cho HTTP-Only Cookie chứa JWT
 */
export function getAuthCookieOptions() {
  return {
    name: AUTH_COOKIE_NAME,
    httpOnly: true,
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    maxAge: COOKIE_MAX_AGE,
  };
}
