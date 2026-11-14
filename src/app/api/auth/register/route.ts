import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { registerSchema } from '@/lib/validations';
import { getAuthCookieOptions, hashPassword, signJwtToken } from '@/lib/auth';

/**
 * POST /api/auth/register
 * Đăng ký tài khoản người dùng mới và tự động khởi tạo phiên đăng nhập (HTTP-Only Cookie)
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

    // 1. Kiểm tra tính hợp lệ của dữ liệu đầu vào bằng Zod
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Dữ liệu đăng ký không hợp lệ';
      return NextResponse.json(
        { error: firstError, details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, email, password } = parsed.data;

    // 2. Kiểm tra xem email đã được đăng ký trước đó chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Địa chỉ email này đã được sử dụng. Vui lòng chọn email khác.' },
        { status: 409 }
      );
    }

    // 3. Mã hóa mật khẩu và lưu người dùng mới vào CSDL
    const passwordHash = await hashPassword(password);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    // 4. Tạo JWT Token và thiết lập HTTP-Only Cookie
    const token = await signJwtToken({
      userId: newUser.id,
      email: newUser.email,
      name: newUser.name,
    });

    const response = NextResponse.json(
      {
        message: 'Đăng ký tài khoản thành công!',
        user: newUser,
      },
      { status: 201 }
    );

    response.cookies.set({
      ...getAuthCookieOptions(),
      value: token,
    });

    return response;
  } catch (error: unknown) {
    // Bắt lỗi race-condition khi 2 request đăng ký cùng một email đồng thời (Unique Constraint P2002)
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Địa chỉ email này đã được sử dụng. Vui lòng chọn email khác.' },
        { status: 409 }
      );
    }

    console.error('[API_REGISTER_ERROR]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi hệ thống khi đăng ký tài khoản. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}
