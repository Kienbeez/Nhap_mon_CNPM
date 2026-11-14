import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';

/**
 * GET /api/auth/me
 * Trả về thông tin người dùng hiện đang đăng nhập dựa trên JWT Cookie
 */
export async function GET() {
  try {
    const session = await getSessionUser();

    if (!session) {
      return NextResponse.json(
        { error: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Không tìm thấy tài khoản người dùng.' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('[API_AUTH_ME_ERROR]:', error);
    return NextResponse.json(
      { error: 'Lỗi khi truy xuất thông tin người dùng.' },
      { status: 500 }
    );
  }
}
