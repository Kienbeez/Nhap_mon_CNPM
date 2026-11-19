import { NextRequest, NextResponse } from 'next/server';
import { AUTH_COOKIE_NAME, verifyJwtToken } from '@/lib/jwt';

// Các đường dẫn trang yêu cầu phải đăng nhập
const PROTECTED_PAGE_PREFIXES = ['/categories', '/transactions', '/reports'];

// Các đường dẫn API yêu cầu xác thực JWT
const PROTECTED_API_PREFIXES = ['/api/categories', '/api/transactions', '/api/reports'];

// Các trang dành cho khách chưa đăng nhập (nếu đã đăng nhập sẽ chuyển hướng vào trang chính)
const AUTH_PAGES = ['/login', '/register'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  const session = token ? await verifyJwtToken(token) : null;
  const isAuthenticated = Boolean(session);

  // 1. Bảo vệ các API route yêu cầu xác thực (/api/categories/*, /api/transactions/*, /api/reports/*)
  if (PROTECTED_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Phiên đăng nhập không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.' },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // 2. Nếu người dùng đã đăng nhập mà truy cập /login hoặc /register -> chuyển tới Trang chủ (/)
  if (AUTH_PAGES.includes(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // 3. Nếu người dùng chưa đăng nhập mà truy cập các trang quản lý -> chuyển tới /login
  const isProtectedPage =
    pathname === '/' ||
    PROTECTED_PAGE_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (isProtectedPage && !isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    if (pathname !== '/') {
      loginUrl.searchParams.set('callbackUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Khớp tất cả các request path ngoại trừ:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
