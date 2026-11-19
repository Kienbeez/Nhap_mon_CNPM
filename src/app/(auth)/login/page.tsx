'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  ArrowRight,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  UserCheck,
} from 'lucide-react';

const DEMO_USERS = [
  {
    label: 'Demo 1: Nguyễn Văn An',
    email: 'demo1@financetracker.vn',
    password: 'Password123!',
    desc: '6 giao dịch mẫu',
  },
  {
    label: 'Demo 2: Trần Thị Bình',
    email: 'demo2@financetracker.vn',
    password: 'Password123!',
    desc: 'Có danh mục riêng + 5 giao dịch',
  },
  {
    label: 'Demo 3: Lê Hoàng Cường',
    email: 'demo3@financetracker.vn',
    password: 'Password123!',
    desc: '5 giao dịch mẫu',
  },
];

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const performLogin = async (loginEmail: string, loginPassword: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng nhập không thành công');
      }

      // Chỉ chấp nhận đường dẫn nội bộ hợp lệ (bắt đầu bằng '/' và không phải '//') để chống Open Redirect
      const rawCallback = searchParams.get('callbackUrl');
      const targetUrl =
        rawCallback && rawCallback.startsWith('/') && !rawCallback.startsWith('//')
          ? rawCallback
          : '/';

      router.push(targetUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const handleQuickDemoSelect = (demoEmail: string, demoPassword: string) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">
          Đăng nhập tài khoản
        </CardTitle>
        <CardDescription className="text-slate-500">
          Nhập email và mật khẩu của bạn để truy cập sổ thu chi
        </CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">Địa chỉ Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9"
                required
                autoFocus
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Mật khẩu</Label>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>

          {/* Khu vực chọn nhanh 3 Tài khoản Demo dựng sẵn */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                3 Tài khoản Demo dựng sẵn (Click để điền nhanh)
              </span>
              <Badge variant="success" className="text-[10px] px-1.5 py-0">
                Password123!
              </Badge>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {DEMO_USERS.map((demo) => {
                const isSelected = email === demo.email;
                return (
                  <button
                    key={demo.email}
                    type="button"
                    onClick={() => handleQuickDemoSelect(demo.email, demo.password)}
                    className={`flex items-center justify-between text-left px-2.5 py-1.5 rounded-lg border text-xs transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 font-medium shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <UserCheck
                        className={`h-3.5 w-3.5 shrink-0 ${
                          isSelected ? 'text-white' : 'text-emerald-600'
                        }`}
                      />
                      <div className="truncate">
                        <span className="font-semibold">{demo.label}</span>
                        <span
                          className={`ml-1.5 text-[11px] ${
                            isSelected ? 'text-emerald-100' : 'text-slate-400'
                          }`}
                        >
                          ({demo.email})
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang đăng nhập...
              </>
            ) : (
              <>
                Đăng nhập
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-slate-500">
            Chưa có tài khoản?{' '}
            <Link
              href="/register"
              className="font-semibold text-emerald-600 hover:underline"
            >
              Đăng ký ngay
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="h-80 rounded-xl bg-white/60 animate-pulse" />}>
      <LoginForm />
    </Suspense>
  );
}
