'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  TrendingUp,
  TrendingDown,
  Wallet,
  Calendar,
  Filter,
  RotateCcw,
  ReceiptText,
  ChevronLeft,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CategoryIcon } from '@/components/category-icon';
import { formatCurrencyVND, formatDateVN } from '@/lib/utils';

interface CategoryOption {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  isDefault: boolean;
}

interface TransactionItem {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  note: string | null;
  categoryId: string;
  createdAt: string;
  category: CategoryOption;
}

interface TransactionSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalCount: number;
}

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toInputDateString(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return getTodayDateString();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const QUICK_AMOUNTS = [50000, 100000, 200000, 500000, 1000000, 5000000];

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [summary, setSummary] = useState<TransactionSummary>({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
    totalCount: 0,
  });
  const [loading, setLoading] = useState(true);

  // State Bộ lọc (Filters)
  const [activeTab, setActiveTab] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Thông báo Notification
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // State Dialog Thêm / Sửa Giao dịch
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<TransactionItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    amount: '',
    categoryId: '',
    date: getTodayDateString(),
    note: '',
  });

  // State Dialog Xác nhận Xóa
  const [deletingTx, setDeletingTx] = useState<TransactionItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Tải danh sách Danh mục để hiển thị trong bộ lọc & form
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories');
      if (!res.ok) return;
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err) {
      console.error('Lỗi tải danh mục:', err);
    }
  }, []);

  // Tải danh sách Giao dịch từ API theo bộ lọc hiện tại
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'ALL') params.set('type', activeTab);
      if (selectedCategoryId) params.set('categoryId', selectedCategoryId);
      if (searchQuery.trim()) params.set('search', searchQuery.trim());
      if (startDate) params.set('startDate', startDate);
      if (endDate) params.set('endDate', endDate);
      params.set('page', String(page));
      params.set('limit', '20');

      const res = await fetch(`/api/transactions?${params.toString()}`);
      if (!res.ok) throw new Error('Không thể tải danh sách giao dịch');
      const data = await res.json();

      setTransactions(data.transactions || []);
      if (data.summary) setSummary(data.summary);
      if (data.pagination) setTotalPages(data.pagination.totalPages || 1);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Lỗi khi tải danh sách giao dịch.',
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedCategoryId, searchQuery, startDate, endDate, page]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Tự động ẩn thông báo sau 4 giây
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Danh sách danh mục trong Dropdown bộ lọc (lọc theo Tab hiện tại)
  const filterCategoryOptions = useMemo(() => {
    if (activeTab === 'ALL') return categories;
    return categories.filter((c) => c.type === activeTab);
  }, [categories, activeTab]);

  // Danh sách danh mục trong Modal Thêm/Sửa (lọc theo loại giao dịch đang chọn trong Form)
  const formCategoryOptions = useMemo(() => {
    return categories.filter((c) => c.type === formData.type);
  }, [categories, formData.type]);

  // Lọc nhanh "Tháng này"
  const handleSelectCurrentMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    setStartDate(toInputDateString(firstDay.toISOString()));
    setEndDate(toInputDateString(lastDay.toISOString()));
    setPage(1);
  };

  // Đặt lại toàn bộ bộ lọc
  const handleResetFilters = () => {
    setActiveTab('ALL');
    setSelectedCategoryId('');
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters =
    activeTab !== 'ALL' ||
    Boolean(selectedCategoryId) ||
    Boolean(searchQuery.trim()) ||
    Boolean(startDate) ||
    Boolean(endDate);

  // Mở Modal Thêm mới giao dịch
  const handleOpenCreate = () => {
    setEditingTx(null);
    setFormError(null);
    const defaultType = activeTab === 'INCOME' ? 'INCOME' : 'EXPENSE';
    const matchingCats = categories.filter((c) => c.type === defaultType);
    setFormData({
      type: defaultType,
      amount: '',
      categoryId: matchingCats[0]?.id || '',
      date: getTodayDateString(),
      note: '',
    });
    setIsFormOpen(true);
  };

  // Mở Modal Chỉnh sửa giao dịch
  const handleOpenEdit = (tx: TransactionItem) => {
    setEditingTx(tx);
    setFormError(null);
    setFormData({
      type: tx.type,
      amount: String(tx.amount),
      categoryId: tx.categoryId,
      date: toInputDateString(tx.date),
      note: tx.note || '',
    });
    setIsFormOpen(true);
  };

  // Khi đổi loại giao dịch (Khoản Chi <-> Khoản Thu) trong Modal
  const handleFormTypeChange = (newType: 'INCOME' | 'EXPENSE') => {
    const matchingCats = categories.filter((c) => c.type === newType);
    const currentCatMatches = matchingCats.some((c) => c.id === formData.categoryId);
    setFormData((prev) => ({
      ...prev,
      type: newType,
      categoryId: currentCatMatches ? prev.categoryId : matchingCats[0]?.id || '',
    }));
  };

  // Gửi Form Thêm / Sửa Giao dịch
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const numericAmount = Number(formData.amount);
    if (!formData.amount || isNaN(numericAmount) || numericAmount <= 0) {
      setFormError('Vui lòng nhập số tiền giao dịch lớn hơn 0.');
      return;
    }

    if (!formData.categoryId) {
      setFormError('Vui lòng chọn một danh mục cho giao dịch.');
      return;
    }

    setFormSubmitting(true);

    try {
      const url = editingTx
        ? `/api/transactions/${editingTx.id}`
        : '/api/transactions';
      const method = editingTx ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
          type: formData.type,
          categoryId: formData.categoryId,
          date: formData.date,
          note: formData.note.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể lưu giao dịch');
      }

      setNotification({
        type: 'success',
        message:
          data.message ||
          (editingTx
            ? 'Cập nhật giao dịch thành công!'
            : 'Thêm giao dịch mới thành công!'),
      });
      setIsFormOpen(false);
      await fetchTransactions();
    } catch (err: any) {
      setFormError(err.message || 'Đã xảy ra lỗi khi lưu giao dịch.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Xác nhận Xóa Giao dịch
  const handleConfirmDelete = async () => {
    if (!deletingTx) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/transactions/${deletingTx.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Không thể xóa giao dịch');
      }

      setNotification({
        type: 'success',
        message: data.message || 'Đã xóa giao dịch thành công!',
      });
      setDeletingTx(null);
      await fetchTransactions();
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Lỗi khi xóa giao dịch.',
      });
      setDeletingTx(null);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Trang Quản lý Giao dịch */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Quản lý Giao dịch Thu/Chi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Ghi chép, tra cứu lịch sử thu chi và theo dõi cân đối số dư tài chính cá nhân
          </p>
        </div>

        <Button
          onClick={handleOpenCreate}
          className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shrink-0"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm giao dịch mới
        </Button>
      </div>

      {/* Thông báo Trạng thái (Notification Banner) */}
      {notification && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl border text-sm font-medium shadow-sm transition-all ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-700'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* 3 Thẻ Tổng quan Tài chính (Summary Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tổng Thu nhập (Khoản Thu)
              </p>
              <p className="text-2xl font-bold text-emerald-600">
                +{formatCurrencyVND(summary.totalIncome)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Tổng Chi tiêu (Khoản Chi)
              </p>
              <p className="text-2xl font-bold text-rose-600">
                -{formatCurrencyVND(summary.totalExpense)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100">
              <TrendingDown className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Số dư (Thu - Chi)
                </p>
                <Badge
                  variant={summary.balance >= 0 ? 'success' : 'destructive'}
                  className="text-[10px] px-1.5 py-0"
                >
                  {summary.balance >= 0 ? 'Cân đối dương' : 'Chi vượt thu'}
                </Badge>
              </div>
              <p
                className={`text-2xl font-bold ${
                  summary.balance >= 0 ? 'text-slate-900' : 'text-rose-600'
                }`}
              >
                {formatCurrencyVND(summary.balance)}
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
              <Wallet className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Thanh Bộ lọc Đa chiều (Filter Bar) */}
      <Card className="border-slate-200 shadow-sm">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Tabs Loại Giao dịch */}
            <Tabs
              value={activeTab}
              onValueChange={(val) => {
                setActiveTab(val as 'ALL' | 'EXPENSE' | 'INCOME');
                setSelectedCategoryId('');
                setPage(1);
              }}
              className="w-full lg:w-auto"
            >
              <TabsList className="grid w-full sm:w-auto grid-cols-3 bg-slate-100 p-1">
                <TabsTrigger value="ALL" className="text-xs sm:text-sm">
                  Tất cả ({summary.totalCount})
                </TabsTrigger>
                <TabsTrigger value="EXPENSE" className="text-xs sm:text-sm">
                  Khoản Chi
                </TabsTrigger>
                <TabsTrigger value="INCOME" className="text-xs sm:text-sm">
                  Khoản Thu
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Ô Tìm kiếm từ khóa */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Tìm theo ghi chú hoặc tên danh mục..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(1);
                }}
                className="pl-9 bg-white"
              />
            </div>
          </div>

          {/* Hàng lọc thứ 2: Danh mục + Khoảng thời gian */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
            {/* Lọc theo Danh mục */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                <Filter className="w-3 h-3" />
                Lọc theo Danh mục
              </Label>
              <select
                value={selectedCategoryId}
                onChange={(e) => {
                  setSelectedCategoryId(e.target.value);
                  setPage(1);
                }}
                className="flex h-9 w-full rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-900 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">-- Tất cả danh mục --</option>
                {filterCategoryOptions.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.type === 'INCOME' ? '[Thu] ' : '[Chi] '}
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Từ ngày */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Từ ngày
              </Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 bg-white"
              />
            </div>

            {/* Đến ngày */}
            <div className="space-y-1">
              <Label className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Đến ngày
              </Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="h-9 bg-white"
              />
            </div>

            {/* Nút thao tác bộ lọc nhanh */}
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSelectCurrentMonth}
                className="h-9 text-xs flex-1"
              >
                Tháng này
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-9 text-xs text-slate-600 hover:text-red-600"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-1" />
                  Đặt lại
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danh sách Giao dịch (Transaction List) */}
      <Card className="border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Đang tải danh sách giao dịch...</p>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="h-14 w-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <ReceiptText className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                {hasActiveFilters
                  ? 'Không tìm thấy giao dịch phù hợp'
                  : 'Chưa có giao dịch thu chi nào'}
              </h3>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                {hasActiveFilters
                  ? 'Hãy thử điều chỉnh khoảng thời gian, danh mục hoặc từ khóa tìm kiếm.'
                  : 'Bắt đầu ghi chép khoản thu hoặc khoản chi đầu tiên của bạn để theo dõi dòng tiền.'}
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              {hasActiveFilters ? (
                <Button variant="outline" size="sm" onClick={handleResetFilters}>
                  <RotateCcw className="w-4 h-4 mr-1.5" />
                  Xóa toàn bộ bộ lọc
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleOpenCreate}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Plus className="w-4 h-4 mr-1.5" />
                  Thêm giao dịch đầu tiên
                </Button>
              )}
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="p-4 sm:px-6 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                {/* Cột Trái: Icon Danh mục + Thông tin */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                    style={{
                      backgroundColor: `${tx.category.color}18`,
                      color: tx.category.color,
                    }}
                  >
                    <CategoryIcon name={tx.category.icon} className="w-5 h-5" />
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm sm:text-base">
                        {tx.category.name}
                      </span>
                      <Badge
                        variant={tx.type === 'INCOME' ? 'success' : 'destructive'}
                        className="text-[10px] px-1.5 py-0 font-medium"
                      >
                        {tx.type === 'INCOME' ? 'Khoản Thu' : 'Khoản Chi'}
                      </Badge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 font-medium text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {formatDateVN(tx.date)}
                      </span>
                      {tx.note && (
                        <span className="inline-flex items-center gap-1 text-slate-600">
                          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs sm:max-w-md">{tx.note}</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Cột Phải: Số tiền VND + Nút Sửa / Xóa */}
                <div className="flex items-center justify-between sm:justify-end gap-4 pl-14 sm:pl-0">
                  <span
                    className={`text-base sm:text-lg font-bold whitespace-nowrap ${
                      tx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                    }`}
                  >
                    {tx.type === 'INCOME' ? '+' : '-'}
                    {formatCurrencyVND(tx.amount)}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(tx)}
                      className="h-8 px-2.5 text-slate-600 hover:text-emerald-700 hover:border-emerald-300"
                    >
                      <Pencil className="w-3.5 h-3.5 mr-1" />
                      <span className="text-xs">Sửa</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeletingTx(tx)}
                      className="h-8 px-2.5 text-slate-600 hover:text-red-600 hover:border-red-300 hover:bg-red-50"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-1" />
                      <span className="text-xs">Xóa</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Thanh Phân trang (Pagination Footer) */}
        {!loading && totalPages > 1 && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <span>
              Trang <strong>{page}</strong> / <strong>{totalPages}</strong> (Tổng{' '}
              {summary.totalCount} giao dịch)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-8 px-2.5"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-8 px-2.5"
              >
                Sau
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* MODAL THÊM / SỬA GIAO DỊCH */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900">
              {editingTx ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch Thu/Chi mới'}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Chọn phân loại, danh mục và nhập số tiền bằng Việt Nam Đồng (VND)
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            {formError && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-xs text-red-600 border border-red-200">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Chọn Loại Giao dịch (Khoản Chi / Khoản Thu) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Phân loại giao dịch
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleFormTypeChange('EXPENSE')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    formData.type === 'EXPENSE'
                      ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  Khoản Chi (Chi tiêu)
                </button>
                <button
                  type="button"
                  onClick={() => handleFormTypeChange('INCOME')}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                    formData.type === 'INCOME'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  Khoản Thu (Thu nhập)
                </button>
              </div>
            </div>

            {/* Nhập Số tiền (VND) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="tx-amount" className="text-xs font-semibold text-slate-700">
                  Số tiền (VND) <span className="text-red-500">*</span>
                </Label>
                {Number(formData.amount) > 0 && (
                  <span className="text-xs font-bold text-emerald-600">
                    Định dạng: {formatCurrencyVND(Number(formData.amount))}
                  </span>
                )}
              </div>
              <Input
                id="tx-amount"
                type="number"
                min="1"
                max="999999999999"
                step="any"
                placeholder="Ví dụ: 150000"
                value={formData.amount}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, amount: e.target.value }))
                }
                required
                className="text-base font-semibold"
              />
              {/* Nút gợi ý số tiền nhanh */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_AMOUNTS.map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, amount: String(amt) }))
                    }
                    className="text-[11px] px-2 py-1 rounded-md bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-medium transition-colors"
                  >
                    {formatCurrencyVND(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Chọn Danh mục tương ứng */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700">
                Chọn Danh mục ({formData.type === 'INCOME' ? 'Khoản Thu' : 'Khoản Chi'}){' '}
                <span className="text-red-500">*</span>
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl bg-slate-50/50">
                {formCategoryOptions.map((cat) => {
                  const isSelected = formData.categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, categoryId: cat.id }))
                      }
                      className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs transition-all ${
                        isSelected
                          ? 'bg-white border-emerald-600 ring-2 ring-emerald-500/20 font-semibold text-slate-900 shadow-sm'
                          : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-white'
                      }`}
                    >
                      <div
                        className="h-7 w-7 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${cat.color}20`,
                          color: cat.color,
                        }}
                      >
                        <CategoryIcon name={cat.icon} className="w-4 h-4" />
                      </div>
                      <span className="truncate">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Ngày giao dịch */}
            <div className="space-y-1.5">
              <Label htmlFor="tx-date" className="text-xs font-semibold text-slate-700">
                Ngày giao dịch <span className="text-red-500">*</span>
              </Label>
              <Input
                id="tx-date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, date: e.target.value }))
                }
                required
              />
            </div>

            {/* Ghi chú */}
            <div className="space-y-1.5">
              <Label htmlFor="tx-note" className="text-xs font-semibold text-slate-700">
                Ghi chú chi tiết (Tùy chọn)
              </Label>
              <Input
                id="tx-note"
                placeholder="Ví dụ: Ăn trưa cùng đồng nghiệp, Thanh toán tiền điện..."
                maxLength={255}
                value={formData.note}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, note: e.target.value }))
                }
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={formSubmitting}
              >
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                disabled={formSubmitting}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : editingTx ? (
                  'Lưu thay đổi'
                ) : (
                  'Thêm giao dịch'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL XÁC NHẬN XÓA GIAO DỊCH */}
      <Dialog
        open={Boolean(deletingTx)}
        onOpenChange={(open) => !open && setDeletingTx(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900">
              Xác nhận xóa giao dịch
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Thao tác này sẽ xóa vĩnh viễn giao dịch khỏi sổ thu chi và cập nhật lại số dư.
            </DialogDescription>
          </DialogHeader>

          {deletingTx && (
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Danh mục:</span>
                <span className="font-bold text-slate-900">
                  {deletingTx.category.name}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Số tiền:</span>
                <span
                  className={`font-bold ${
                    deletingTx.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {deletingTx.type === 'INCOME' ? '+' : '-'}
                  {formatCurrencyVND(deletingTx.amount)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-700">Ngày giao dịch:</span>
                <span className="text-slate-600">{formatDateVN(deletingTx.date)}</span>
              </div>
              {deletingTx.note && (
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700">Ghi chú:</span>
                  <span className="text-slate-600 truncate max-w-[220px]">
                    {deletingTx.note}
                  </span>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingTx(null)}
              disabled={deleteLoading}
            >
              Hủy
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xóa giao dịch'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
