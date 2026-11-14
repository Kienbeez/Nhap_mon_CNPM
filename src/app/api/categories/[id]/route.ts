import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { categorySchema } from '@/lib/validations';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PUT /api/categories/[id]
 * Cập nhật thông tin danh mục cá nhân.
 * RÀNG BUỘC NGHIỆP VỤ:
 * 1. Chỉ cho phép sửa danh mục do chính người dùng đó tạo ra (isDefault = false & userId = session.userId).
 * 2. Không cho phép đổi phân loại (INCOME <-> EXPENSE) nếu danh mục đã có giao dịch phát sinh.
 */
export async function PUT(request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thực hiện thao tác này.' },
        { status: 401 }
      );
    }

    const categoryId = params.id;
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Không tìm thấy danh mục cần chỉnh sửa.' },
        { status: 404 }
      );
    }

    // Chặn sửa danh mục mặc định của hệ thống
    if (existingCategory.isDefault) {
      return NextResponse.json(
        { error: 'Không được phép chỉnh sửa danh mục mặc định của hệ thống.' },
        { status: 403 }
      );
    }

    // Chặn sửa danh mục của người dùng khác
    if (existingCategory.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền chỉnh sửa danh mục này.' },
        { status: 403 }
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
      const firstError = parsed.error.errors[0]?.message || 'Dữ liệu cập nhật không hợp lệ';
      return NextResponse.json(
        { error: firstError, details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { name, type, icon, color, description } = parsed.data;

    // Chặn đổi loại Thu/Chi nếu danh mục đã có giao dịch liên kết (tránh lệch loại giao dịch lịch sử)
    const txCount = existingCategory._count?.transactions ?? 0;
    if (existingCategory.type !== type && txCount > 0) {
      return NextResponse.json(
        {
          error: `Không thể thay đổi loại (Khoản Thu / Khoản Chi) của danh mục "${existingCategory.name}" vì đang có ${txCount} giao dịch liên kết.`,
        },
        { status: 400 }
      );
    }

    // Kiểm tra trùng tên với danh mục khác cùng loại
    const duplicate = await prisma.category.findFirst({
      where: {
        id: { not: categoryId },
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

    if (duplicate) {
      return NextResponse.json(
        {
          error: `Tên danh mục "${name}" đã tồn tại trong nhóm ${
            type === 'INCOME' ? 'Khoản Thu' : 'Khoản Chi'
          }.`,
        },
        { status: 409 }
      );
    }

    const updatedCategory = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        type,
        icon,
        color,
        description: description || null,
      },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    return NextResponse.json(
      {
        message: 'Cập nhật danh mục thành công!',
        category: updatedCategory,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Tên danh mục này đã tồn tại trong cùng nhóm Thu/Chi.' },
        { status: 409 }
      );
    }

    console.error('[API_CATEGORIES_PUT_ERROR]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật danh mục.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/categories/[id]
 * Xóa danh mục cá nhân.
 * RÀNG BUỘC NGHIỆP VỤ:
 * 1. Không được xóa danh mục mặc định của hệ thống.
 * 2. Chỉ chủ sở hữu mới được xóa danh mục của mình.
 * 3. Không cho xóa nếu danh mục đã có giao dịch phát sinh để bảo toàn lịch sử thu chi.
 */
export async function DELETE(_request: NextRequest, { params }: RouteContext) {
  try {
    const session = await getSessionUser();
    if (!session) {
      return NextResponse.json(
        { error: 'Vui lòng đăng nhập để thực hiện thao tác này.' },
        { status: 401 }
      );
    }

    const categoryId = params.id;
    const existingCategory = await prisma.category.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!existingCategory) {
      return NextResponse.json(
        { error: 'Không tìm thấy danh mục cần xóa.' },
        { status: 404 }
      );
    }

    if (existingCategory.isDefault) {
      return NextResponse.json(
        { error: 'Không được phép xóa danh mục mặc định của hệ thống.' },
        { status: 403 }
      );
    }

    if (existingCategory.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa danh mục này.' },
        { status: 403 }
      );
    }

    if (existingCategory._count.transactions > 0) {
      return NextResponse.json(
        {
          error: `Không thể xóa danh mục "${existingCategory.name}" vì đang có ${existingCategory._count.transactions} giao dịch liên kết.`,
        },
        { status: 400 }
      );
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    return NextResponse.json(
      { message: 'Đã xóa danh mục thành công!' },
      { status: 200 }
    );
  } catch (error: unknown) {
    // Bắt lỗi khóa ngoại P2003 (Restrict) nếu có giao dịch phát sinh đồng thời ngay trước khi xóa
    if ((error as { code?: string })?.code === 'P2003') {
      return NextResponse.json(
        { error: 'Không thể xóa danh mục vì đang có giao dịch liên kết.' },
        { status: 400 }
      );
    }

    console.error('[API_CATEGORIES_DELETE_ERROR]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa danh mục.' },
      { status: 500 }
    );
  }
}
