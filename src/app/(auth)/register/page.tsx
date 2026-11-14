'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, User } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Đăng ký không thành công');
      }

      // Đăng ký thành công và đã tự động cấp cookie session -> Chuyển vào Dashboard
      router.push('/categories');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Đã có lỗi xảy ra khi tạo tài khoản.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-slate-200 shadow-xl shadow-slate-200/50">
      <CardHeader className="space-y-1 pb-4">
        <CardTitle className="text-xl font-bold text-slate-900">Tạo tài khoản mới</CardTitle>
        <CardDescription className="text-slate-500">
          Bắt đầu ghi chép và kiểm soát thu chi cá nhân hiệu quả
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
            <Label htmlFor="name">Họ và tên</Label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="name"
                placeholder="Ví dụ: Nguyễn Văn A"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-9"
                required
                autoFocus
              />
            </div>
          </div>

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
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Mật khẩu</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                id="password"
                type="password"
                placeholder="Tối thiểu 6 ký tự"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-9"
                required
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Đang tạo tài khoản...
              </>
            ) : (
              <>
                Đăng ký tài khoản
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          <p className="text-center text-sm text-slate-500">
            Đã có tài khoản?{' '}
            <Link href="/login" className="font-semibold text-emerald-600 hover:underline">
              Đăng nhập ngay
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
