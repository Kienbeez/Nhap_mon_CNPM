import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth';
import { transactionSchema } from '@/lib/validations';

interface RouteContext {
  params: {
    id: string;
  };
}

/**
 * PUT /api/transactions/[id]
 * Cập nhật thông tin một giao dịch Thu/Chi.
 * RÀNG BUỘC NGHIỆP VỤ:
 * 1. Chỉ chủ sở hữu giao dịch (transaction.userId === session.userId) mới có quyền sửa.
 * 2. Danh mục mới (categoryId) phải là danh mục mặc định hệ thống hoặc danh mục cá nhân của chính user đó.
 * 3. Loại giao dịch (type) phải trùng khớp với loại của danh mục (category.type).
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

    const transactionId = params.id;
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Không tìm thấy giao dịch cần chỉnh sửa.' },
        { status: 404 }
      );
    }

    if (existingTransaction.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền chỉnh sửa giao dịch này.' },
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

    const parsed = transactionSchema.safeParse(body);
    if (!parsed.success) {
      const firstError =
        parsed.error.errors[0]?.message || 'Dữ liệu cập nhật giao dịch không hợp lệ';
      return NextResponse.json(
        { error: firstError, details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { amount, type, categoryId, date, note } = parsed.data;

    // Kiểm tra danh mục đích
    const targetCategory = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!targetCategory) {
      return NextResponse.json(
        { error: 'Danh mục được chọn không tồn tại.' },
        { status: 404 }
      );
    }

    if (!targetCategory.isDefault && targetCategory.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền sử dụng danh mục cá nhân của người dùng khác.' },
        { status: 403 }
      );
    }

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

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        amount,
        type,
        categoryId,
        date,
        note: note || null,
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
        message: 'Cập nhật giao dịch thành công!',
        transaction: {
          ...updatedTransaction,
          amount: Number(updatedTransaction.amount),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API_TRANSACTIONS_PUT_ERROR]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi cập nhật giao dịch.' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/transactions/[id]
 * Xóa một giao dịch Thu/Chi của người dùng hiện tại.
 * RÀNG BUỘC NGHIỆP VỤ:
 * - Chỉ chủ sở hữu giao dịch mới có quyền xóa.
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

    const transactionId = params.id;
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'Không tìm thấy giao dịch cần xóa.' },
        { status: 404 }
      );
    }

    if (existingTransaction.userId !== session.userId) {
      return NextResponse.json(
        { error: 'Bạn không có quyền xóa giao dịch này.' },
        { status: 403 }
      );
    }

    await prisma.transaction.delete({
      where: { id: transactionId },
    });

    return NextResponse.json(
      { message: 'Đã xóa giao dịch thành công!' },
      { status: 200 }
    );
  } catch (error) {
    console.error('[API_TRANSACTIONS_DELETE_ERROR]:', error);
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi xóa giao dịch.' },
      { status: 500 }
    );
  }
}
