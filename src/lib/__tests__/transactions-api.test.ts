import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockGetSessionUser = vi.fn();
const mockCategoryFindUnique = vi.fn();
const mockTransactionFindMany = vi.fn();
const mockTransactionFindUnique = vi.fn();
const mockTransactionCreate = vi.fn();
const mockTransactionUpdate = vi.fn();
const mockTransactionDelete = vi.fn();

vi.mock('@/lib/auth', () => ({
  getSessionUser: () => mockGetSessionUser(),
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    category: {
      findUnique: (...args: unknown[]) => mockCategoryFindUnique(...args),
    },
    transaction: {
      findMany: (...args: unknown[]) => mockTransactionFindMany(...args),
      findUnique: (...args: unknown[]) => mockTransactionFindUnique(...args),
      create: (...args: unknown[]) => mockTransactionCreate(...args),
      update: (...args: unknown[]) => mockTransactionUpdate(...args),
      delete: (...args: unknown[]) => mockTransactionDelete(...args),
    },
  },
}));

import { GET, POST } from '@/app/api/transactions/route';
import { PUT, DELETE } from '@/app/api/transactions/[id]/route';

describe('Unit Tests: Ràng buộc nghiệp vụ API Giao dịch (/api/transactions - Sprint 2)', () => {
  const mockUserSession = {
    userId: 'user_demo_1',
    email: 'demo1@financetracker.vn',
    name: 'Nguyễn Văn An (Demo 1)',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSessionUser.mockResolvedValue(mockUserSession);
  });

  it('GET /api/transactions: Tính toán chính xác Tổng Thu, Tổng Chi và Số dư', async () => {
    mockTransactionFindMany.mockResolvedValue([
      {
        id: 'tx_1',
        amount: '15000000.00',
        type: 'INCOME',
        date: new Date('2026-11-10'),
        note: 'Lương tháng 11',
        userId: mockUserSession.userId,
        categoryId: 'cat_salary',
        category: {
          id: 'cat_salary',
          name: 'Tiền lương',
          type: 'INCOME',
          icon: 'Wallet',
          color: '#10b981',
          isDefault: true,
        },
      },
      {
        id: 'tx_2',
        amount: '1250000.00',
        type: 'EXPENSE',
        date: new Date('2026-11-12'),
        note: 'Ăn uống tuần',
        userId: mockUserSession.userId,
        categoryId: 'cat_food',
        category: {
          id: 'cat_food',
          name: 'Ăn uống',
          type: 'EXPENSE',
          icon: 'Utensils',
          color: '#ef4444',
          isDefault: true,
        },
      },
    ]);

    const req = new NextRequest('http://localhost:3000/api/transactions');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data.summary).toEqual({
      totalIncome: 15000000,
      totalExpense: 1250000,
      balance: 13750000,
      totalCount: 2,
    });
    expect(data.transactions).toHaveLength(2);
    expect(data.transactions[0].amount).toBe(15000000);
  });

  it('POST /api/transactions: Tạo mới giao dịch thành công (201) khi danh mục hợp lệ và khớp loại', async () => {
    mockCategoryFindUnique.mockResolvedValue({
      id: 'cat_food',
      name: 'Ăn uống',
      type: 'EXPENSE',
      isDefault: true,
      userId: null,
    });

    mockTransactionCreate.mockResolvedValue({
      id: 'tx_new',
      amount: '150000.00',
      type: 'EXPENSE',
      categoryId: 'cat_food',
      userId: mockUserSession.userId,
      date: new Date('2026-11-20'),
      note: 'Ăn trưa',
      category: {
        id: 'cat_food',
        name: 'Ăn uống',
        type: 'EXPENSE',
        icon: 'Utensils',
        color: '#ef4444',
        isDefault: true,
      },
    });

    const req = new NextRequest('http://localhost:3000/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        amount: 150000,
        type: 'EXPENSE',
        categoryId: 'cat_food',
        date: '2026-11-20',
        note: 'Ăn trưa',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.transaction.amount).toBe(150000);
  });

  it('POST /api/transactions: Chặn (400 Bad Request) khi loại giao dịch không khớp với loại của danh mục', async () => {
    // Danh mục "Ăn uống" là EXPENSE nhưng gửi giao dịch là INCOME
    mockCategoryFindUnique.mockResolvedValue({
      id: 'cat_food',
      name: 'Ăn uống',
      type: 'EXPENSE',
      isDefault: true,
      userId: null,
    });

    const req = new NextRequest('http://localhost:3000/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        amount: 500000,
        type: 'INCOME',
        categoryId: 'cat_food',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain('không khớp');
  });

  it('POST /api/transactions: Chặn (403 Forbidden) khi gắn giao dịch vào danh mục cá nhân của người dùng khác', async () => {
    mockCategoryFindUnique.mockResolvedValue({
      id: 'cat_private_other',
      name: 'Danh mục riêng của Demo 2',
      type: 'EXPENSE',
      isDefault: false,
      userId: 'user_demo_2',
    });

    const req = new NextRequest('http://localhost:3000/api/transactions', {
      method: 'POST',
      body: JSON.stringify({
        amount: 200000,
        type: 'EXPENSE',
        categoryId: 'cat_private_other',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('PUT /api/transactions/[id]: Chặn sửa (403 Forbidden) giao dịch thuộc về người dùng khác', async () => {
    mockTransactionFindUnique.mockResolvedValue({
      id: 'tx_other_user',
      amount: '300000.00',
      type: 'EXPENSE',
      userId: 'user_demo_2',
      categoryId: 'cat_food',
    });

    const req = new NextRequest('http://localhost:3000/api/transactions/tx_other_user', {
      method: 'PUT',
      body: JSON.stringify({
        amount: 999999,
        type: 'EXPENSE',
        categoryId: 'cat_food',
      }),
      headers: { 'Content-Type': 'application/json' },
    });

    const res = await PUT(req, { params: { id: 'tx_other_user' } });
    expect(res.status).toBe(403);
  });

  it('DELETE /api/transactions/[id]: Chặn xóa (403 Forbidden) giao dịch của người khác và cho phép xóa (200) giao dịch của chính mình', async () => {
    // 1. Thử xóa giao dịch của người khác -> 403
    mockTransactionFindUnique.mockResolvedValueOnce({
      id: 'tx_other',
      userId: 'user_demo_3',
    });

    const reqForbidden = new NextRequest('http://localhost:3000/api/transactions/tx_other', {
      method: 'DELETE',
    });
    const resForbidden = await DELETE(reqForbidden, { params: { id: 'tx_other' } });
    expect(resForbidden.status).toBe(403);

    // 2. Xóa giao dịch của chính mình -> 200
    mockTransactionFindUnique.mockResolvedValueOnce({
      id: 'tx_own',
      userId: mockUserSession.userId,
    });
    mockTransactionDelete.mockResolvedValueOnce({ id: 'tx_own' });

    const reqOwn = new NextRequest('http://localhost:3000/api/transactions/tx_own', {
      method: 'DELETE',
    });
    const resOwn = await DELETE(reqOwn, { params: { id: 'tx_own' } });
    expect(resOwn.status).toBe(200);
  });
});
