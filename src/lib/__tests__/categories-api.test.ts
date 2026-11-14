import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetSessionUser = vi.fn();
const mockCategoryFindFirst = vi.fn();
const mockCategoryFindUnique = vi.fn();
const mockCategoryCreate = vi.fn();
const mockCategoryUpdate = vi.fn();
const mockCategoryDelete = vi.fn();

vi.mock('@/lib/auth', () => ({
  getSessionUser: () => mockGetSessionUser(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    category: {
      findFirst: (...args: unknown[]) => mockCategoryFindFirst(...args),
      findUnique: (...args: unknown[]) => mockCategoryFindUnique(...args),
      create: (...args: unknown[]) => mockCategoryCreate(...args),
      update: (...args: unknown[]) => mockCategoryUpdate(...args),
      delete: (...args: unknown[]) => mockCategoryDelete(...args),
    },
  },
}));

import { POST } from '@/app/api/categories/route';
import { PUT, DELETE } from '@/app/api/categories/[id]/route';

describe('Unit Tests: Ràng buộc nghiệp vụ API Danh mục (/api/categories)', () => {
  const mockUserSession = {
    userId: 'user_owner_1',
    email: 'owner@example.com',
    name: 'Chủ sở hữu',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionUser.mockResolvedValue(mockUserSession);
  });

  it('Trả về 400 Bad Request khi body gửi lên không phải là JSON hợp lệ', async () => {
    const req = new NextRequest('http://localhost:3000/api/categories', {
      method: 'POST',
      body: '{invalid-json',
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('Trả về 409 Conflict khi thêm danh mục trùng tên trong cùng nhóm Thu/Chi', async () => {
    mockCategoryFindFirst.mockResolvedValue({
      id: 'cat_existing',
      name: 'Ăn uống',
      type: 'EXPENSE',
    });

    const req = new NextRequest('http://localhost:3000/api/categories', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Ăn uống',
        type: 'EXPENSE',
        icon: 'Utensils',
        color: '#ef4444',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(409);
  });

  it('Chặn sửa (403 Forbidden) đối với danh mục mặc định của hệ thống', async () => {
    mockCategoryFindUnique.mockResolvedValue({
      id: 'cat_default',
      name: 'Ăn uống',
      type: 'EXPENSE',
      isDefault: true,
      userId: null,
      _count: { transactions: 0 },
    });

    const req = new NextRequest('http://localhost:3000/api/categories/cat_default', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Ăn uống sửa',
        type: 'EXPENSE',
        icon: 'Utensils',
        color: '#ef4444',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PUT(req, { params: { id: 'cat_default' } });
    expect(res.status).toBe(403);
  });

  it('Chặn sửa (403 Forbidden) đối với danh mục của người dùng khác', async () => {
    mockCategoryFindUnique.mockResolvedValue({
      id: 'cat_other',
      name: 'Cà phê sáng',
      type: 'EXPENSE',
      isDefault: false,
      userId: 'user_other_2',
      _count: { transactions: 0 },
    });

    const req = new NextRequest('http://localhost:3000/api/categories/cat_other', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Cà phê tối',
        type: 'EXPENSE',
        icon: 'Coffee',
        color: '#ef4444',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PUT(req, { params: { id: 'cat_other' } });
    expect(res.status).toBe(403);
  });

  it('Chặn đổi loại Thu/Chi (400 Bad Request) khi danh mục đã có giao dịch liên kết', async () => {
    mockCategoryFindUnique.mockResolvedValue({
      id: 'cat_with_tx',
      name: 'Freelance',
      type: 'INCOME',
      isDefault: false,
      userId: mockUserSession.userId,
      _count: { transactions: 3 },
    });

    const req = new NextRequest('http://localhost:3000/api/categories/cat_with_tx', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Freelance',
        type: 'EXPENSE', // Cố tình đổi từ INCOME sang EXPENSE
        icon: 'Briefcase',
        color: '#ef4444',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PUT(req, { params: { id: 'cat_with_tx' } });
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('3 giao dịch liên kết');
  });

  it('Chặn xóa (403 Forbidden) danh mục mặc định và chặn xóa (400) danh mục đang có giao dịch', async () => {
    mockCategoryFindUnique.mockResolvedValueOnce({
      id: 'cat_default',
      name: 'Tiền lương',
      type: 'INCOME',
      isDefault: true,
      userId: null,
      _count: { transactions: 0 },
    });

    const delDefaultReq = new NextRequest('http://localhost:3000/api/categories/cat_default', {
      method: 'DELETE',
    });
    const resDefault = await DELETE(delDefaultReq, { params: { id: 'cat_default' } });
    expect(resDefault.status).toBe(403);

    mockCategoryFindUnique.mockResolvedValueOnce({
      id: 'cat_used',
      name: 'Đầu tư chứng khoán',
      type: 'INCOME',
      isDefault: false,
      userId: mockUserSession.userId,
      _count: { transactions: 5 },
    });

    const delUsedReq = new NextRequest('http://localhost:3000/api/categories/cat_used', {
      method: 'DELETE',
    });
    const resUsed = await DELETE(delUsedReq, { params: { id: 'cat_used' } });
    expect(resUsed.status).toBe(400);
  });
});
