import { NextRequest, NextResponse } from 'next/server';
import { Prisma, TransactionType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { transactionSchema } from '@/lib/validations';

/**
 * GET /api/transactions
 * Lấy danh sách giao dịch Thu/Chi của người dùng hiện tại kèm thống kê Tổng Thu, Tổng Chi, Số dư.
 * Hỗ trợ query params:
 * - ?type=INCOME|EXPENSE
 * - ?categoryId=<id>
 * - ?search=<tu_khoa>
 * - ?startDate=YYYY-MM-DD
 * - ?endDate=YYYY-MM-DD
 * - ?page=1&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để xem danh sách giao dịch.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');
    const categoryIdParam = searchParams.get('categoryId')?.trim();
    const searchParam = searchParams.get('search')?.trim();
    const startDateParam = searchParams.get('startDate')?.trim();
    const endDateParam = searchParams.get('endDate')?.trim();

    const pageParam = parseInt(searchParams.get('page') || '1', 10);
    const limitParam = parseInt(searchParams.get('limit') || '50', 10);
    const page = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit =
      Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 200) : 50;

    const typeFilter =
      typeParam === 'INCOME' || typeParam === 'EXPENSE'
        ? (typeParam as TransactionType)
        : undefined;

    // Xây dựng bộ lọc khoảng thời gian (Từ ngày 00:00:00.000 đến ngày 23:59:59.999)
    const dateFilter: Prisma.DateTimeFilter = {};
    if (startDateParam) {
      const start = new Date(startDateParam);
      if (!isNaN(start.getTime())) {
        start.setHours(0, 0, 0, 0);
        dateFilter.gte = start;
      }
    }
    if (endDateParam) {
      const end = new Date(endDateParam);
      if (!isNaN(end.getTime())) {
        end.setHours(23, 59, 59, 999);
        dateFilter.lte = end;
      }
    }

    const whereClause: Prisma.TransactionWhereInput = {
      userId: session.userId,
      ...(typeFilter ? { type: typeFilter } : {}),
      ...(categoryIdParam ? { categoryId: categoryIdParam } : {}),
      ...(Object.keys(dateFilter).length > 0 ? { date: dateFilter } : {}),
      ...(searchParam
        ? {
            OR: [
              {
                note: {
                  contains: searchParam,
                  mode: 'insensitive',
                },
              },
              {
                category: {
                  name: {
                    contains: searchParam,
                    mode: 'insensitive',
                  },
                },
              },
            ],
          }
        : {}),
    };

    const allMatchingTransactions = await prisma.transaction.findMany({
      where: whereClause,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
            isDefault: true,
          },
        },
      },
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });

    // Tính toán tổng thu, tổng chi và số dư chính xác từ tập giao dịch khớp bộ lọc
    let totalIncome = 0;
    let totalExpense = 0;

    const normalizedTransactions = allMatchingTransactions.map((tx) => {
      const numericAmount = Number(tx.amount);
      if (tx.type === 'INCOME') {
        totalIncome += numericAmount;
      } else {
        totalExpense += numericAmount;
      }

      return {
        ...tx,
        amount: numericAmount,
      };
    });

    totalIncome = Math.round(totalIncome * 100) / 100;
    totalExpense = Math.round(totalExpense * 100) / 100;
    const balance = Math.round((totalIncome - totalExpense) * 100) / 100;
    const totalCount = normalizedTransactions.length;
    const totalPages = Math.max(1, Math.ceil(totalCount / limit));

    const startIndex = (page - 1) * limit;
    const paginatedTransactions = normalizedTransactions.slice(
      startIndex,
      startIndex + limit
    );

    return NextResponse.json(
      {
        transactions: paginatedTransactions,
        summary: {
          totalIncome,
          totalExpense,
          balance,
          totalCount,
        },
        pagination: {
          page,
          limit,
          totalCount,
          totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API_TRANSACTIONS_GET_ERROR]:', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách giao dịch. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/transactions
 * Tạo mới một giao dịch Thu/Chi cho người dùng hiện tại.
 * RÀNG BUỘC NGHIỆP VỤ:
 * 1. Danh mục được chọn phải tồn tại và thuộc về hệ thống (isDefault=true) hoặc thuộc về chính user hiện tại.
 * 2. Loại giao dịch (INCOME/EXPENSE) phải khớp với loại của danh mục được chọn.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thêm giao dịch.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Dữ liệu gửi lên không đúng định dạng JSON hợp lệ.' },
        { status: 400 }
      );
    }

    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      const firstError =
        parsed.error.errors[0]?.message || 'Dữ liệu giao dịch không hợp lệ';
      return NextResponse.json(
        { error: firstError, details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, type, categoryId, date, note } = parsed.data;

    // Kiểm tra sự tồn tại và quyền truy cập danh mục
    const targetCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!targetCategory) {
      return NextResponse.json(
        { error: 'Danh mục được chọn không tồn tại.' },
        { status: 404 }
      );
    }

    // Chặn sử dụng danh mục cá nhân của người dùng khác
    if (!targetCategory.isDefault && targetCategory.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền sử dụng danh mục cá nhân của người dùng khác.' },
        { status: 403 }
      );
    }

    // Ràng buộc đồng nhất loại giao dịch và loại danh mục
    if (targetCategory.type !== type) {
      return NextResponse.json(
        {
          error: `Loại giao dịch (${
            type === 'INCOME' ? 'Khoản Thu' : 'Khoản Chi'
          }) không khớp với phân loại của danh mục "${targetCategory.name}" (${
            targetCategory.type === 'INCOME' ? 'Khoản Thu' : 'Khoản Chi'
          }).`,
        },
        { status: 400 }
      );
    }

    const newTransaction = await prisma.transaction.create({
      data: {
        amount,
        type,
        categoryId,
        date,
        note: note || null,
        userId: session.userId,
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            type: true,
            icon: true,
            color: true,
            isDefault: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Thêm giao dịch mới thành công!',
        transaction: {
          ...newTransaction,
          amount: Number(newTransaction.amount),
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code;

    if (errorCode === 'P2003') {
      return NextResponse.json(
        { error: 'Dữ liệu liên kết (Tài khoản hoặc Danh mục) không hợp lệ.' },
        { status: 400 }
      );
    }

    console.error('[API_TRANSACTIONS_POST_ERROR]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi thêm giao dịch mới.' },
      { status: 500 }
    );
  }
}
