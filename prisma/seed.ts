import { PrismaClient, TransactionType } from '@prisma/client';

const prisma = new PrismaClient();

interface DefaultCategorySeed {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  description: string;
}

/**
 * Danh sách các danh mục Thu/Chi mặc định của hệ thống (Tiếng Việt)
 * Người dùng chỉ có quyền xem và sử dụng, không có quyền sửa/xóa.
 */
const DEFAULT_CATEGORIES: DefaultCategorySeed[] = [
  // ================= KHOẢN CHI (EXPENSE) =================
  {
    name: 'Ăn uống',
    type: TransactionType.EXPENSE,
    icon: 'Utensils',
    color: '#ef4444',
    description: 'Chi phí ăn sáng, trưa, tối, cà phê, nhà hàng',
  },
  {
    name: 'Di chuyển',
    type: TransactionType.EXPENSE,
    icon: 'Car',
    color: '#f97316',
    description: 'Xăng xe, gửi xe, taxi, bảo dưỡng phương tiện',
  },
  {
    name: 'Mua sắm',
    type: TransactionType.EXPENSE,
    icon: 'ShoppingBag',
    color: '#ec4899',
    description: 'Quần áo, giày dép, đồ dùng cá nhân, gia dụng',
  },
  {
    name: 'Hóa đơn & Tiện ích',
    type: TransactionType.EXPENSE,
    icon: 'Receipt',
    color: '#eab308',
    description: 'Tiền điện, nước, internet, cước điện thoại',
  },
  {
    name: 'Nhà ở',
    type: TransactionType.EXPENSE,
    icon: 'Home',
    color: '#8b5cf6',
    description: 'Tiền thuê nhà, phí quản lý chung cư, sửa chữa nhà',
  },
  {
    name: 'Giải trí',
    type: TransactionType.EXPENSE,
    icon: 'Gamepad2',
    color: '#06b6d4',
    description: 'Xem phim, nghe nhạc, du lịch, thể thao',
  },
  {
    name: 'Y tế & Sức khỏe',
    type: TransactionType.EXPENSE,
    icon: 'HeartPulse',
    color: '#14b8a6',
    description: 'Khám chữa bệnh, thuốc men, bảo hiểm sức khỏe',
  },
  {
    name: 'Giáo dục',
    type: TransactionType.EXPENSE,
    icon: 'GraduationCap',
    color: '#3b82f6',
    description: 'Sách vở, khóa học, học phí, nâng cao kỹ năng',
  },

  // ================= KHOẢN THU (INCOME) =================
  {
    name: 'Tiền lương',
    type: TransactionType.INCOME,
    icon: 'Wallet',
    color: '#10b981',
    description: 'Thu nhập lương chính hàng tháng',
  },
  {
    name: 'Tiền thưởng',
    type: TransactionType.INCOME,
    icon: 'Gift',
    color: '#22c55e',
    description: 'Thưởng hiệu suất, dự án, lễ tết',
  },
  {
    name: 'Đầu tư & Lãi',
    type: TransactionType.INCOME,
    icon: 'TrendingUp',
    color: '#059669',
    description: 'Lãi tiết kiệm, cổ tức, lợi nhuận đầu tư',
  },
  {
    name: 'Thu nhập phụ',
    type: TransactionType.INCOME,
    icon: 'Briefcase',
    color: '#0d9488',
    description: 'Làm thêm (Freelance), kinh doanh nhỏ',
  },
  {
    name: 'Khoản thu khác',
    type: TransactionType.INCOME,
    icon: 'Coins',
    color: '#6366f1',
    description: 'Tiền mừng, hoàn tiền, các khoản thu phát sinh',
  },
];

async function main() {
  console.log('Bắt đầu khởi tạo dữ liệu danh mục mặc định (Seed Default Categories)...');

  let createdCount = 0;
  let updatedCount = 0;

  for (const item of DEFAULT_CATEGORIES) {
    // Kiểm tra xem danh mục mặc định này đã tồn tại chưa (tránh trùng lặp khi chạy lại seed)
    const existing = await prisma.category.findFirst({
      where: {
        name: item.name,
        type: item.type,
        isDefault: true,
        userId: null,
      },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          icon: item.icon,
          color: item.color,
          description: item.description,
        },
      });
      updatedCount++;
    } else {
      await prisma.category.create({
        data: {
          name: item.name,
          type: item.type,
          icon: item.icon,
          color: item.color,
          description: item.description,
          isDefault: true,
          userId: null,
        },
      });
      createdCount++;
    }
  }

  console.log(
    `Hoàn tất Seed! Đã tạo mới ${createdCount} danh mục và cập nhật ${updatedCount} danh mục mặc định.`
  );
}

main()
  .catch((error) => {
    console.error('Lỗi trong quá trình seed dữ liệu:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
