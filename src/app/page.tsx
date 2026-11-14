import { redirect } from 'next/navigation';
import { getSessionUser } from '@/lib/auth';

/**
 * Trang chủ ('/') tự động chuyển hướng:
 * - Nếu đã đăng nhập -> vào trang Quản lý danh mục (/categories)
 * - Nếu chưa đăng nhập -> chuyển sang trang Đăng nhập (/login)
 */
export default async function HomePage() {
  const user = await getSessionUser();

  if (user) {
    redirect('/categories');
  } else {
    redirect('/login');
  }
}
