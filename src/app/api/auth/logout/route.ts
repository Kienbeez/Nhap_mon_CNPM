import { NextResponse } from 'next/server';
import { getAuthCookieOptions } from '@/lib/auth';

/**
 * POST /api/auth/logout
 * Xóa HTTP-Only Cookie chứa JWT để đăng xuất người dùng
 */
export async function POST() {
  const response = NextResponse.json(
    { message: 'Đã đăng xuất thành công.' },
    { status: 200 }
  );

  response.cookies.set({
    ...getAuthCookieOptions(),
    value: '',
    maxAge: 0,
  });

  return response;
}
