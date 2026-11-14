'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Lock,
  Pencil,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
  FolderPlus,
  Tags,
  Receipt,
  WalletCards,
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
import {
  CategoryIcon,
  AVAILABLE_ICONS,
  AVAILABLE_COLORS,
} from '@/components/category-icon';

interface CategoryItem {
  id: string;
  name: string;
  type: 'INCOME' | 'EXPENSE';
  icon: string;
  color: string;
  description: string | null;
  isDefault: boolean;
  userId: string | null;
  createdAt: string;
  _count?: {
    transactions: number;
  };
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'EXPENSE' | 'INCOME'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Thông báo Notification
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // State Dialog Thêm / Sửa
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryItem | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    name: '',
    type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
    icon: 'Utensils',
    color: '#ef4444',
    description: '',
  });

  // State Dialog Xác nhận Xóa
  const [deletingCategory, setDeletingCategory] = useState<CategoryItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Tải danh sách danh mục từ API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/categories');
      if (!res.ok) throw new Error('Không thể tải danh sách danh mục');
      const data = await res.json();
      setCategories(data.categories || []);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Lỗi khi tải danh mục.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Tự động tắt thông báo sau 4 giây
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Lọc danh mục theo Tab và Ô tìm kiếm
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchesTab = activeTab === 'ALL' || cat.type === activeTab;
      const matchesSearch =
        !searchQuery.trim() ||
        cat.name.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        (cat.description &&
          cat.description.toLowerCase().includes(searchQuery.toLowerCase().trim()));
      return matchesTab && matchesSearch;
    });
  }, [categories, activeTab, searchQuery]);

  // Thống kê số lượng
  const expenseCount = useMemo(
    () => categories.filter((c) => c.type === 'EXPENSE').length,
    [categories]
  );
  const incomeCount = useMemo(
    () => categories.filter((c) => c.type === 'INCOME').length,
    [categories]
  );
  const userCount = useMemo(
    () => categories.filter((c) => !c.isDefault).length,
    [categories]
  );

  // Mở modal thêm mới
  const handleOpenAddModal = (defaultType?: 'INCOME' | 'EXPENSE') => {
    setEditingCategory(null);
    const chosenType = defaultType || (activeTab === 'INCOME' ? 'INCOME' : 'EXPENSE');
    setFormData({
      name: '',
      type: chosenType,
      icon: chosenType === 'INCOME' ? 'Wallet' : 'Utensils',
      color: chosenType === 'INCOME' ? '#10b981' : '#ef4444',
      description: '',
    });
    setIsFormOpen(true);
  };

  // Mở modal chỉnh sửa
  const handleOpenEditModal = (cat: CategoryItem) => {
    if (cat.isDefault) {
      setNotification({
        type: 'error',
        message: 'Bạn không được phép chỉnh sửa danh mục mặc định của hệ thống.',
      });
      return;
    }
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      type: cat.type,
      icon: cat.icon,
      color: cat.color,
      description: cat.description || '',
    });
    setIsFormOpen(true);
  };

  // Xử lý gửi Form Thêm / Sửa
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setNotification({ type: 'error', message: 'Tên danh mục không được để trống' });
      return;
    }

    setFormSubmitting(true);
    try {
      const url = editingCategory
        ? `/api/categories/${editingCategory.id}`
        : '/api/categories';
      const method = editingCategory ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Thao tác không thành công');
      }

      setNotification({
        type: 'success',
        message: editingCategory
          ? 'Cập nhật danh mục thành công!'
          : 'Thêm mới danh mục cá nhân thành công!',
      });
      setIsFormOpen(false);
      fetchCategories();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setFormSubmitting(false);
    }
  };

  // Xử lý Xóa danh mục
  const handleDeleteConfirm = async () => {
    if (!deletingCategory) return;
    setDeleteLoading(true);

    try {
      const res = await fetch(`/api/categories/${deletingCategory.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Xóa danh mục thất bại');
      }

      setNotification({
        type: 'success',
        message: 'Đã xóa danh mục thành công!',
      });
      setDeletingCategory(null);
      fetchCategories();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message });
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Tags className="w-6 h-6 text-emerald-600" />
            Quản lý Danh mục Thu / Chi
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Thiết lập danh mục để phân loại chi tiêu và nguồn thu nhập dễ dàng hơn
          </p>
        </div>

        <Button
          onClick={() => handleOpenAddModal()}
          className="bg-emerald-600 hover:bg-emerald-700 shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Thêm danh mục mới
        </Button>
      </div>

      {/* Floating Notification */}
      {notification && (
        <div
          className={`flex items-center gap-2 p-4 rounded-xl border text-sm font-medium transition-all shadow-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
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

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Khoản Chi</p>
              <h3 className="text-2xl font-bold text-rose-600 mt-0.5">{expenseCount}</h3>
              <p className="text-[11px] text-slate-400">Danh mục chi tiêu</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Khoản Thu</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{incomeCount}</h3>
              <p className="text-[11px] text-slate-400">Nguồn thu nhập</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <WalletCards className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-slate-200">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Tự Tạo (Custom)</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-0.5">{userCount}</h3>
              <p className="text-[11px] text-slate-400">Danh mục cá nhân</p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        <Tabs
          value={activeTab}
          onValueChange={(val) => setActiveTab(val as any)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 w-full sm:w-auto">
            <TabsTrigger value="ALL">Tất cả ({categories.length})</TabsTrigger>
            <TabsTrigger value="EXPENSE">Khoản Chi ({expenseCount})</TabsTrigger>
            <TabsTrigger value="INCOME">Khoản Thu ({incomeCount})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên danh mục..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-slate-50 border-slate-200"
          />
        </div>
      </div>

      {/* Category Grid List */}
      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-3" />
          <p className="text-sm font-medium">Đang tải danh mục thu chi...</p>
        </div>
      ) : filteredCategories.length === 0 ? (
        <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center flex flex-col items-center justify-center">
          <Tags className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="text-base font-semibold text-slate-800">Không tìm thấy danh mục nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mt-1">
            {searchQuery
              ? 'Không có danh mục nào khớp với từ khóa tìm kiếm của bạn.'
              : 'Hãy thêm danh mục cá nhân đầu tiên để quản lý thu chi tiện lợi hơn.'}
          </p>
          <Button
            onClick={() => handleOpenAddModal()}
            className="mt-4 bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tạo danh mục ngay
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((cat) => (
            <Card
              key={cat.id}
              className="bg-white border-slate-200 hover:border-slate-300 transition-all hover:shadow-md"
            >
              <CardContent className="p-5 flex flex-col justify-between h-full">
                <div>
                  {/* Card Header: Icon + Badges */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div
                      className="h-12 w-12 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-6 h-6" />
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <Badge
                        variant={cat.type === 'INCOME' ? 'success' : 'expense'}
                        className="text-[11px] font-semibold"
                      >
                        {cat.type === 'INCOME' ? 'Khoản Thu' : 'Khoản Chi'}
                      </Badge>

                      {cat.isDefault ? (
                        <Badge
                          variant="system"
                          className="text-[10px] flex items-center gap-1 font-medium"
                        >
                          <Lock className="w-3 h-3 text-slate-400" />
                          Mặc định hệ thống
                        </Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="text-[10px] text-indigo-600 border-indigo-200 bg-indigo-50/50"
                        >
                          Cá nhân tạo
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-900 truncate">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                    {cat.description || 'Chưa có mô tả cho danh mục này.'}
                  </p>
                </div>

                {/* Footer Actions & Stats */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400">
                    {cat._count?.transactions || 0} giao dịch liên kết
                  </span>

                  <div className="flex items-center gap-1">
                    {cat.isDefault ? (
                      <span className="text-[11px] text-slate-400 italic">
                        Chỉ xem
                      </span>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenEditModal(cat)}
                          className="h-8 w-8 text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                          title="Sửa danh mục"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeletingCategory(cat)}
                          className="h-8 w-8 text-slate-500 hover:text-rose-600 hover:bg-rose-50"
                          title="Xóa danh mục"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ================= MODAL THÊM / SỬA DANH MỤC ================= */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>
              {editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm mới danh mục cá nhân'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory
                ? 'Cập nhật lại tên, biểu tượng và màu sắc của danh mục cá nhân'
                : 'Tạo danh mục riêng để phân loại chi tiêu và thu nhập theo nhu cầu của bạn'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit} className="space-y-4 py-2">
            {/* Phân loại Thu / Chi */}
            <div className="space-y-1.5">
              <Label>Loại danh mục</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={Boolean(
                    editingCategory && (editingCategory._count?.transactions ?? 0) > 0
                  )}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: 'EXPENSE',
                      color: prev.color === '#10b981' ? '#ef4444' : prev.color,
                    }))
                  }
                  className={`py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    formData.type === 'EXPENSE'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Receipt className="w-4 h-4" />
                  Khoản Chi (Expense)
                </button>

                <button
                  type="button"
                  disabled={Boolean(
                    editingCategory && (editingCategory._count?.transactions ?? 0) > 0
                  )}
                  onClick={() =>
                    setFormData((prev) => ({
                      ...prev,
                      type: 'INCOME',
                      color: prev.color === '#ef4444' ? '#10b981' : prev.color,
                    }))
                  }
                  className={`py-2 px-3 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                    formData.type === 'INCOME'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <WalletCards className="w-4 h-4" />
                  Khoản Thu (Income)
                </button>
              </div>
              {editingCategory && (editingCategory._count?.transactions ?? 0) > 0 && (
                <p className="text-[11px] text-amber-600 pt-0.5">
                  Không thể đổi loại Thu/Chi vì danh mục này đã có giao dịch liên kết.
                </p>
              )}
            </div>

            {/* Tên danh mục */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Tên danh mục *</Label>
              <Input
                id="cat-name"
                placeholder="Ví dụ: Cà phê, Tiền mừng, Mua sách..."
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>

            {/* Chọn màu sắc */}
            <div className="space-y-1.5">
              <Label>Màu đại diện</Label>
              <div className="flex flex-wrap gap-2 pt-1">
                {AVAILABLE_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Chọn màu ${c}`}
                    aria-pressed={formData.color === c}
                    onClick={() => setFormData((prev) => ({ ...prev, color: c }))}
                    className={`h-7 w-7 rounded-full transition-transform ${
                      formData.color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-800' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Chọn biểu tượng Icon */}
            <div className="space-y-1.5">
              <Label>Biểu tượng (Icon)</Label>
              <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg bg-slate-50">
                {AVAILABLE_ICONS.map((iconName) => (
                  <button
                    key={iconName}
                    type="button"
                    aria-label={`Chọn biểu tượng ${iconName}`}
                    aria-pressed={formData.icon === iconName}
                    onClick={() => setFormData((prev) => ({ ...prev, icon: iconName }))}
                    className={`h-10 rounded-lg flex items-center justify-center transition-all ${
                      formData.icon === iconName
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-600 hover:bg-white hover:text-slate-900'
                    }`}
                    title={iconName}
                  >
                    <CategoryIcon name={iconName} className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Mô tả */}
            <div className="space-y-1.5">
              <Label htmlFor="cat-desc">Mô tả ghi chú (tùy chọn)</Label>
              <Input
                id="cat-desc"
                placeholder="Ghi chú chi tiết mục đích danh mục này..."
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={formSubmitting}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={formSubmitting}
              >
                {formSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang lưu...
                  </>
                ) : editingCategory ? (
                  'Cập nhật'
                ) : (
                  'Tạo danh mục'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL XÁC NHẬN XÓA ================= */}
      <Dialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
      >
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="text-rose-600 flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Xác nhận xóa danh mục
            </DialogTitle>
            <DialogDescription className="pt-2">
              Bạn có chắc chắn muốn xóa danh mục{' '}
              <strong className="text-slate-900 font-bold">
                "{deletingCategory?.name}"
              </strong>{' '}
              không? Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-4">
            <Button
              variant="outline"
              onClick={() => setDeletingCategory(null)}
              disabled={deleteLoading}
            >
              Hủy bỏ
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xác nhận xóa'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
