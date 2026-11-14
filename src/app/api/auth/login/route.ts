import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import {
  DUMMY_PASSWORD_HASH,
  getAuthCookieOptions,
  signJwtToken,
  verifyPassword,
} from '@/lib/auth';

/**
 * POST /api/auth/login
 * Xác thực thông tin đăng nhập và cấp phát JWT lưu trong HTTP-Only Cookie
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Dữ liệu gửi lên không đúng định dạng JSON hợp lệ.' },
        { status: 400 }
      );
    }

    // 1. Validate email & password
    const parsed = loginSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Thông tin đăng nhập không hợp lệ';
      return NextResponse.json(
        { error: firstError, details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // 2. Tìm người dùng theo email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Chạy verifyPassword với hash giả để cân bằng thời gian phản hồi, chống dò email (Timing Attack)
      await verifyPassword(password, DUMMY_PASSWORD_HASH);
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    // 3. Kiểm tra mật khẩu
    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email hoặc mật khẩu không chính xác.' },
        { status: 401 }
      );
    }

    // 4. Ký JWT và gắn vào HTTP-Only Cookie
    const token = await signJwtToken({
      userId: user.id,
      email: user.email,
      name: user.name,
    });

    const response = NextResponse.json(
      {
        message: 'Đăng nhập thành công!',
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
        },
      },
      { status: 200 }
    );

    response.cookies.set({
      ...getAuthCookieOptions(),
      value: token,
    });

    return response;
  } catch (error) {
    console.error('[API_LOGIN_ERROR]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống khi đăng nhập. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
