'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Tags,
  ReceiptText,
  BarChart3,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Sparkles,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Plus,
  Layers,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CategoryIcon } from '@/components/category-icon';
import { formatCurrencyVND, formatDateVN } from '@/lib/utils';

interface SummaryData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalCount: number;
}

interface RecentTransaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  note: string | null;
  category: {
    id: string;
    name: string;
    icon: string;
    color: string;
    type: 'INCOME' | 'EXPENSE';
  };
}

export default function HomePage() {
  const [summary, setSummary] = useState<SummaryData>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalCount: 0,
  });
  const [categoryCount, setCategoryCount] = useState<number>(0);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboardOverview() {
      try {
        setLoading(true);
        const [txRes, catRes] = await Promise.all([
          fetch('/api/transactions?limit=5'),
          fetch('/api/categories'),
        ]);

        if (txRes.ok) {
          const txData = await txRes.json();
          if (txData.summary) setSummary(txData.summary);
          if (txData.transactions) setRecentTransactions(txData.transactions);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          if (Array.isArray(catData.categories)) {
            setCategoryCount(catData.categories.length);
          }
        }
      } catch (error) {
        console.error('Lỗi tải dữ liệu tổng quan:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardOverview();
  }, []);

  const subPages = [
    {
      title: 'Quản lý Danh mục Thu/Chi',
      path: '/categories',
      sprint: 'Sprint 1',
      active: true,
      icon: Tags,
      iconBg: 'bg-indigo-100 text-indigo-600',
      borderHover: 'hover:border-indigo-300',
      statsLabel: `${categoryCount} danh mục khả dụng`,
      description:
        'Quản lý 13 danh mục mặc định của hệ thống và tự tạo danh mục cá nhân với bộ chọn 25 biểu tượng cùng bảng màu trực quan.',
      features: [
        'Tách biệt Khoản Thu & Khoản Chi',
        'Bảo vệ danh mục mặc định hệ thống',
        'Tìm kiếm & lọc danh mục tức thì',
      ],
      ctaText: 'Truy cập trang Danh mục',
    },
    {
      title: 'Quản lý Giao dịch Thu/Chi',
      path: '/transactions',
      sprint: 'Sprint 2',
      active: true,
      highlight: true,
      icon: ReceiptText,
      iconBg: 'bg-emerald-100 text-emerald-600',
      borderHover: 'hover:border-emerald-400',
      statsLabel: `${summary.totalCount} giao dịch đã ghi chép`,
      description:
        'Ghi chép thu nhập và chi tiêu hàng ngày với độ chính xác tiền tệ VND tuyệt đối, bộ lọc đa chiều và tự động cân đối số dư.',
      features: [
        'Thêm, sửa, xóa giao dịch Thu/Chi',
        'Lọc theo loại, danh mục, khoảng ngày, từ khóa',
        'Thống kê Tổng Thu, Tổng Chi & Số dư tức thời',
      ],
      ctaText: 'Truy cập trang Giao dịch',
    },
    {
      title: 'Báo cáo & Biểu đồ Thống kê',
      path: '/reports',
      sprint: 'Sprint 3',
      active: false,
      icon: BarChart3,
      iconBg: 'bg-amber-100 text-amber-600',
      borderHover: '',
      statsLabel: 'Kế hoạch Sprint 3',
      description:
        'Trực quan hóa dòng tiền bằng biểu đồ tròn cơ cấu danh mục, biểu đồ cột so sánh thu chi theo tháng và xuất báo cáo.',
      features: [
        'Biểu đồ tỷ trọng chi tiêu theo danh mục',
        'Biểu đồ xu hướng dòng tiền theo tháng/năm',
        'Phân tích & cảnh báo vượt ngân sách',
      ],
      ctaText: 'Sắp ra mắt ở Sprint 3',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Banner Giới thiệu Trang chủ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 sm:p-8 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium backdrop-blur-sm">
              <Sparkles className="h-3.5 w-3.5 text-emerald-200" />
              <span>Trung tâm Điều hướng Hệ thống • Sprint 2</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Trang chủ Quản lý Tài chính Cá nhân
            </h1>
            <p className="text-emerald-100 text-sm sm:text-base leading-relaxed">
              Chào mừng bạn đến với hệ thống Personal Finance Tracker. Chọn nhanh các phân hệ
              chức năng bên dưới để quản lý danh mục, ghi chép giao dịch thu chi hoặc theo dõi số dư.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link href="/transactions">
              <Button className="bg-white text-emerald-800 hover:bg-emerald-50 font-semibold shadow-md">
                <Plus className="w-4 h-4 mr-1.5" />
                Ghi chép Giao dịch
              </Button>
            </Link>
            <Link href="/categories">
              <Button
                variant="outline"
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 hover:text-white"
              >
                <Tags className="w-4 h-4 mr-1.5" />
                Quản lý Danh mục
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Thẻ Tóm tắt Số liệu Tài chính */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tổng Thu nhập
              </p>
              <p className="text-xl font-bold text-emerald-600 mt-1">
                {loading ? '...' : `+${formatCurrencyVND(summary.totalIncome)}`}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Tổng Chi tiêu
              </p>
              <p className="text-xl font-bold text-rose-600 mt-1">
                {loading ? '...' : `-${formatCurrencyVND(summary.totalExpense)}`}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <TrendingDown className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Số dư Hiện tại
              </p>
              <p
                className={`text-xl font-bold mt-1 ${
                  summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {loading ? '...' : formatCurrencyVND(summary.balance)}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                Quy mô Dữ liệu
              </p>
              <p className="text-xl font-bold text-slate-900 mt-1">
                {loading
                  ? '...'
                  : `${summary.totalCount} GD / ${categoryCount} DM`}
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danh sách các Trang con trong Hệ thống (Sub-pages Directory) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Danh mục các Trang con trong Hệ thống
            </h2>
            <p className="text-sm text-slate-500">
              Chọn phân hệ chức năng bạn muốn làm việc
            </p>
          </div>
          <Badge variant="outline" className="w-fit text-xs text-slate-600">
            2/3 Phân hệ đã kích hoạt
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {subPages.map((page) => {
            const Icon = page.icon;
            return (
              <Card
                key={page.path}
                className={`flex flex-col justify-between transition-all duration-200 ${
                  page.highlight
                    ? 'border-emerald-300 ring-1 ring-emerald-500/20 shadow-md'
                    : 'border-slate-200 shadow-sm'
                } ${page.active ? `${page.borderHover} hover:shadow-md` : 'opacity-80 bg-slate-50/60'}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div
                      className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${page.iconBg}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant={page.active ? 'success' : 'secondary'}
                        className="text-xs"
                      >
                        {page.sprint}
                      </Badge>
                      <code className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono">
                        {page.path}
                      </code>
                    </div>
                  </div>

                  <CardTitle className="text-lg font-bold text-slate-900">
                    {page.title}
                  </CardTitle>
                  <CardDescription className="text-xs font-medium text-emerald-700 pt-0.5">
                    {page.statsLabel}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {page.description}
                    </p>

                    <ul className="space-y-1.5 pt-1">
                      {page.features.map((feat) => (
                        <li
                          key={feat}
                          className="flex items-center gap-2 text-xs text-slate-600"
                        >
                          {page.active ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-slate-100">
                    {page.active ? (
                      <Link href={page.path} className="block">
                        <Button
                          className={`w-full ${
                            page.highlight
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-900 hover:bg-slate-800 text-white'
                          }`}
                        >
                          <span>{page.ctaText}</span>
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    ) : (
                      <Button
                        variant="outline"
                        disabled
                        className="w-full text-slate-400 cursor-not-allowed"
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        <span>{page.ctaText}</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Giao dịch gần nhất & Thông tin Tài khoản Demo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 5 Giao dịch gần nhất */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold text-slate-900">
                Giao dịch Gần đây
              </CardTitle>
              <CardDescription className="text-xs">
                5 giao dịch thu chi mới nhất của tài khoản hiện tại
              </CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="outline" size="sm" className="text-xs">
                Xem tất cả
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3 py-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded-xl bg-slate-100 animate-pulse"
                  />
                ))}
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm text-slate-500">
                  Chưa có giao dịch nào được ghi nhận.
                </p>
                <Link href="/transactions">
                  <Button
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 mt-1"
                  >
                    <Plus className="w-4 h-4 mr-1.5" />
                    Thêm giao dịch đầu tiên
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="py-3 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${tx.category.color}18`,
                          color: tx.category.color,
                        }}
                      >
                        <CategoryIcon name={tx.category.icon} className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {tx.category.name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {tx.note || 'Không có ghi chú'} • {formatDateVN(tx.date)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm font-bold whitespace-nowrap ${
                        tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {tx.type === 'INCOME' ? '+' : '-'}
                      {formatCurrencyVND(tx.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Thông tin 3 tài khoản Demo dựng sẵn */}
        <Card className="border-slate-200 shadow-sm bg-slate-50/50">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <CardTitle className="text-base font-bold text-slate-900">
                3 Tài khoản Demo dựng sẵn
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              Dữ liệu độc lập giữa các tài khoản để kiểm thử phân quyền
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <p className="font-semibold text-slate-900">1. Nguyễn Văn An (Demo 1)</p>
              <p className="text-slate-500 font-mono">demo1@financetracker.vn</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <p className="font-semibold text-slate-900">2. Trần Thị Bình (Demo 2)</p>
              <p className="text-slate-500 font-mono">demo2@financetracker.vn</p>
            </div>
            <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
              <p className="font-semibold text-slate-900">3. Lê Hoàng Cường (Demo 3)</p>
              <p className="text-slate-500 font-mono">demo3@financetracker.vn</p>
            </div>
            <p className="text-slate-500 pt-1">
              Mật khẩu chung:{' '}
              <code className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                Password123!
              </code>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
