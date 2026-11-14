import { NextRequest, NextResponse } from 'next/server';
import { TransactionType } from '@prisma/client';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { categorySchema } from '@/lib/validations';

/**
 * GET /api/categories
 * Lấy danh sách danh mục Thu/Chi (gồm danh mục mặc định của hệ thống + danh mục riêng của người dùng)
 * Hỗ trợ query params: ?type=INCOME|EXPENSE & ?search=tu_khoa
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để xem danh mục.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const typeParam = searchParams.get('type');
    const searchParam = searchParams.get('search')?.trim();

    const typeFilter =
      typeParam === 'INCOME' || typeParam === 'EXPENSE'
        ? (typeParam as TransactionType)
        : undefined;

    const categories = await prisma.category.findMany({
      where: {
        // Chỉ lấy danh mục mặc định của hệ thống HOẶC danh mục do chính user này tạo
        OR: [
          { isDefault: true, userId: null },
          { isDefault: false, userId: session.userId },
        ],
        ...(typeFilter ? { type: typeFilter } : {}),
        ...(searchParam
          ? {
              name: {
                contains: searchParam,
                mode: 'insensitive',
              },
            }
          : {}),
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
      orderBy: [
        // Ưu tiên hiển thị danh mục do người dùng tự tạo lên đầu (hoặc nhóm theo isDefault)
        { isDefault: 'asc' },
        { createdAt: 'desc' },
        { name: 'asc' },
      ],
    });

    return NextResponse.json({ categories }, { status: 200 });
  } catch (error) {
    console.error('[API_CATEGORIES_GET_ERROR]:', error);
    return NextResponse.json(
      { error: 'Không thể tải danh sách danh mục. Vui lòng thử lại sau.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/categories
 * Tạo mới một danh mục cá nhân cho người dùng hiện tại
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thêm danh mục.' },
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

    const parsed = categorySchema.safeParse(body);

    if (!parsed.success) {
      const firstError = parsed.error.errors[0]?.message || 'Dữ liệu danh mục không hợp lệ';
      return NextResponse.json(
        { error: firstError, details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, type, icon, color, description } = parsed.data;

    // Kiểm tra trùng tên danh mục trong cùng phân loại (cả danh mục hệ thống lẫn cá nhân)
    const duplicateCategory = await prisma.category.findFirst({
      where: {
        type,
        name: {
          equals: name,
          mode: 'insensitive',
        },
        OR: [
          { isDefault: true, userId: null },
          { userId: session.userId },
        ],
      },
    });

    if (duplicateCategory) {
      return NextResponse.json(
        {
          error: `Danh mục "${name}" đã tồn tại trong nhóm ${
            type === 'INCOME' ? 'Khoản Thu' : 'Khoản Chi'
          }.`,
        },
        { status: 409 }
      );
    }

    const newCategory = await prisma.category.create({
      data: {
        name,
        type,
        icon,
        color,
        description: description || null,
        isDefault: false,
        userId: session.userId,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Thêm danh mục mới thành công!',
        category: newCategory,
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    const errorCode = (error as { code?: string })?.code;

    // Race condition trùng tên danh mục cá nhân (Unique Constraint P2002)
    if (errorCode === 'P2002') {
      return NextResponse.json(
        { error: 'Tên danh mục này đã tồn tại trong cùng nhóm Thu/Chi.' },
        { status: 409 }
      );
    }

    // Tài khoản trong JWT không còn tồn tại trong DB (Foreign Key Constraint P2003)
    if (errorCode === 'P2003') {
      return NextResponse.json(
        { error: 'Tài khoản người dùng không hợp lệ hoặc đã bị xóa. Vui lòng đăng nhập lại.' },
        { status: 401 }
      );
    }

    console.error('[API_CATEGORIES_POST_ERROR]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi tạo danh mục mới.' },
      { status: 500 }
    );
  }
}
