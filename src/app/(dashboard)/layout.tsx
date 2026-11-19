'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wallet,
  LayoutDashboard,
  Tags,
  ReceiptText,
  BarChart3,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserInfo {
  id: string;
  name: string;
  email: string;
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Lấy thông tin user hiện tại
  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => {
        if (!res.ok) throw new Error('Not logged in');
        return res.json();
      })
      .then((data) => {
        if (data.user) setUser(data.user);
      })
      .catch(() => {
        // Nếu không lấy được session thì middleware đã chặn, fallback redirect
        router.push('/login');
      });
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
    }
  };

  const navItems = [
    {
      name: 'Trang chủ',
      href: '/',
      icon: LayoutDashboard,
      current: pathname === '/',
      status: 'Hub',
    },
    {
      name: 'Danh mục Thu/Chi',
      href: '/categories',
      icon: Tags,
      current: pathname.startsWith('/categories'),
      status: 'Sprint 1',
    },
    {
      name: 'Quản lý Giao dịch',
      href: '/transactions',
      icon: ReceiptText,
      current: pathname.startsWith('/transactions'),
      status: 'Sprint 2',
      disabled: false,
    },
    {
      name: 'Báo cáo Thống kê',
      href: '#',
      icon: BarChart3,
      current: false,
      status: 'Sprint 3',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      {/* Mobile Top Header */}
      <header className="lg:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-sm">
            <Wallet className="w-5 h-5" />
          </div>
          <span className="font-bold text-slate-900 text-base">Finance Tracker</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </header>

      {/* Sidebar Navigation */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static',
          mobileMenuOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        )}
      >
        <div>
          {/* Logo Brand */}
          <div className="p-6 border-b border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base leading-tight">
                Finance Tracker
              </h2>
              <p className="text-xs text-slate-500 font-medium">Quản lý thu chi</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Chức năng chính
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              if (item.disabled) {
                return (
                  <div
                    key={item.name}
                    aria-disabled="true"
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-400 cursor-not-allowed opacity-75 select-none"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{item.name}</span>
                    </div>
                    {item.status && (
                      <Badge
                        variant="outline"
                        className="text-[10px] px-1.5 py-0 font-normal"
                      >
                        {item.status}
                      </Badge>
                    )}
                  </div>
                );
              }
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    item.current
                      ? 'bg-emerald-50 text-emerald-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('w-4 h-4', item.current ? 'text-emerald-600' : 'text-slate-400')} />
                    <span>{item.name}</span>
                  </div>
                  {item.status && (
                    <Badge
                      variant={item.current ? 'success' : 'outline'}
                      className="text-[10px] px-1.5 py-0 font-normal"
                    >
                      {item.status}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile & Logout Bottom */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm shrink-0 border border-emerald-200">
              {user?.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user?.name || 'Đang tải...'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full text-slate-600 hover:text-red-600 hover:bg-red-50 border-slate-200 justify-start"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {loggingOut ? 'Đang đăng xuất...' : 'Đăng xuất'}
          </Button>
        </div>
      </aside>

      {/* Backdrop for Mobile Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <div className="hidden lg:flex items-center justify-between bg-white border-b border-slate-200 px-8 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500 font-medium">Kế hoạch Agile:</span>
            <Badge variant="success" className="font-medium text-xs">
              Sprint 2: Quản lý Giao dịch
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Phiên làm việc bảo mật (JWT HTTP-Only)</span>
            </div>
          </div>
        </div>

        {/* Dynamic Page Content */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">{children}</div>
      </main>
    </div>
  );
}
