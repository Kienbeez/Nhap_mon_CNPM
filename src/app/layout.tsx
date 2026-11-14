import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin', 'vietnamese'] });

export const metadata: Metadata = {
  title: 'Personal Finance Tracker - Quản lý Thu Chi Cá nhân',
  description: 'Hệ thống quản lý tài chính thông minh, theo dõi thu chi và danh mục cá nhân tiện lợi',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
