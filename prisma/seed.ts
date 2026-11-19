import { PrismaClient, TransactionType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

interface DefaultCategorySeed {
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  description: string;
}

/**
 * Danh sách 13 danh mục Thu/Chi mặc định của hệ thống (Tiếng Việt)
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

interface DemoAccountSeed {
  name: string;
  email: string;
  password: string;
  customCategory?: {
    name: string;
    type: TransactionType;
    icon: string;
    color: string;
    description: string;
  };
  sampleTransactions: Array<{
    categoryName: string;
    type: TransactionType;
    amount: number;
    daysAgo: number;
    note: string;
  }>;
}

const DEMO_PASSWORD = 'Password123!';

const DEMO_ACCOUNTS: DemoAccountSeed[] = [
  {
    name: 'Nguyễn Văn An (Demo 1)',
    email: 'demo1@financetracker.vn',
    password: DEMO_PASSWORD,
    sampleTransactions: [
      {
        categoryName: 'Tiền lương',
        type: TransactionType.INCOME,
        amount: 18500000,
        daysAgo: 10,
        note: 'Lương chính thức tháng này',
      },
      {
        categoryName: 'Tiền thưởng',
        type: TransactionType.INCOME,
        amount: 2500000,
        daysAgo: 5,
        note: 'Thưởng hoàn thành sớm tiến độ Sprint dự án',
      },
      {
        categoryName: 'Nhà ở',
        type: TransactionType.EXPENSE,
        amount: 4500000,
        daysAgo: 8,
        note: 'Tiền thuê căn hộ và phí dịch vụ chung cư',
      },
      {
        categoryName: 'Ăn uống',
        type: TransactionType.EXPENSE,
        amount: 1250000,
        daysAgo: 3,
        note: 'Ăn trưa văn phòng và đi siêu thị cuối tuần',
      },
      {
        categoryName: 'Hóa đơn & Tiện ích',
        type: TransactionType.EXPENSE,
        amount: 680000,
        daysAgo: 2,
        note: 'Thanh toán tiền điện, nước và Internet cáp quang',
      },
      {
        categoryName: 'Di chuyển',
        type: TransactionType.EXPENSE,
        amount: 450000,
        daysAgo: 1,
        note: 'Đổ xăng xe máy và vé gửi xe tháng',
      },
    ],
  },
  {
    name: 'Trần Thị Bình (Demo 2)',
    email: 'demo2@financetracker.vn',
    password: DEMO_PASSWORD,
    customCategory: {
      name: 'Cà phê & Trà sữa',
      type: TransactionType.EXPENSE,
      icon: 'Coffee',
      color: '#f59e0b',
      description: 'Thưởng thức đồ uống và gặp gỡ bạn bè',
    },
    sampleTransactions: [
      {
        categoryName: 'Tiền lương',
        type: TransactionType.INCOME,
        amount: 15000000,
        daysAgo: 12,
        note: 'Lương chuyển khoản định kỳ',
      },
      {
        categoryName: 'Thu nhập phụ',
        type: TransactionType.INCOME,
        amount: 4200000,
        daysAgo: 4,
        note: 'Thù lao dự án thiết kế UI/UX Freelance',
      },
      {
        categoryName: 'Mua sắm',
        type: TransactionType.EXPENSE,
        amount: 2150000,
        daysAgo: 6,
        note: 'Mua trang phục công sở và phụ kiện',
      },
      {
        categoryName: 'Cà phê & Trà sữa',
        type: TransactionType.EXPENSE,
        amount: 320000,
        daysAgo: 2,
        note: 'Cà phê làm việc nhóm cuối tuần',
      },
      {
        categoryName: 'Giải trí',
        type: TransactionType.EXPENSE,
        amount: 550000,
        daysAgo: 1,
        note: 'Vé xem phim rạp và gia hạn gói nhạc số',
      },
    ],
  },
  {
    name: 'Lê Hoàng Cường (Demo 3)',
    email: 'demo3@financetracker.vn',
    password: DEMO_PASSWORD,
    sampleTransactions: [
      {
        categoryName: 'Tiền lương',
        type: TransactionType.INCOME,
        amount: 12000000,
        daysAgo: 9,
        note: 'Lương cơ bản hàng tháng',
      },
      {
        categoryName: 'Đầu tư & Lãi',
        type: TransactionType.INCOME,
        amount: 1800000,
        daysAgo: 3,
        note: 'Lãi tiết kiệm ngân hàng và cổ tức',
      },
      {
        categoryName: 'Giáo dục',
        type: TransactionType.EXPENSE,
        amount: 1500000,
        daysAgo: 5,
        note: 'Đăng ký khóa học lập trình Fullstack Next.js',
      },
      {
        categoryName: 'Y tế & Sức khỏe',
        type: TransactionType.EXPENSE,
        amount: 600000,
        daysAgo: 2,
        note: 'Gia hạn thẻ tập Gym & mua vitamin tổng hợp',
      },
      {
        categoryName: 'Ăn uống',
        type: TransactionType.EXPENSE,
        amount: 850000,
        daysAgo: 1,
        note: 'Mua thực phẩm tươi sống nấu ăn tại nhà',
      },
    ],
  },
];

async function main() {
  console.log('1. Bắt đầu khởi tạo 13 danh mục mặc định (Seed Default Categories)...');

  let createdCount = 0;
  let updatedCount = 0;
  const defaultCategoryMap = new Map<string, string>();

  for (const item of DEFAULT_CATEGORIES) {
    const existing = await prisma.category.findFirst({
      where: {
        name: item.name,
        type: item.type,
        isDefault: true,
        userId: null,
      },
    });

    if (existing) {
      const updated = await prisma.category.update({
        where: { id: existing.id },
        data: {
          icon: item.icon,
          color: item.color,
          description: item.description,
        },
      });
      defaultCategoryMap.set(item.name, updated.id);
      updatedCount++;
    } else {
      const created = await prisma.category.create({
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
      defaultCategoryMap.set(item.name, created.id);
      createdCount++;
    }
  }

  console.log(
    `   -> Đã tạo mới ${createdCount} danh mục và cập nhật ${updatedCount} danh mục mặc định.`
  );

  console.log('2. Bắt đầu khởi tạo 3 tài khoản Demo cùng giao dịch mẫu...');
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  for (const demo of DEMO_ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: demo.email },
      update: {
        name: demo.name,
      },
      create: {
        name: demo.name,
        email: demo.email,
        passwordHash,
      },
    });

    // Map danh mục khả dụng cho user này (gồm mặc định + cá nhân nếu có)
    const userCategoryMap = new Map<string, string>(defaultCategoryMap);

    if (demo.customCategory) {
      const existingCustomCat = await prisma.category.findFirst({
        where: {
          userId: user.id,
          type: demo.customCategory.type,
          name: demo.customCategory.name,
        },
      });

      if (existingCustomCat) {
        userCategoryMap.set(demo.customCategory.name, existingCustomCat.id);
      } else {
        const createdCustomCat = await prisma.category.create({
          data: {
            name: demo.customCategory.name,
            type: demo.customCategory.type,
            icon: demo.customCategory.icon,
            color: demo.customCategory.color,
            description: demo.customCategory.description,
            isDefault: false,
            userId: user.id,
          },
        });
        userCategoryMap.set(demo.customCategory.name, createdCustomCat.id);
      }
    }

    // Chỉ tạo giao dịch mẫu nếu tài khoản Demo này chưa có giao dịch nào (tránh nhân bản khi restart)
    const existingTxCount = await prisma.transaction.count({
      where: { userId: user.id },
    });

    if (existingTxCount === 0) {
      for (const tx of demo.sampleTransactions) {
        const categoryId = userCategoryMap.get(tx.categoryName);
        if (!categoryId) continue;

        const txDate = new Date();
        txDate.setDate(txDate.getDate() - tx.daysAgo);

        await prisma.transaction.create({
          data: {
            amount: tx.amount,
            type: tx.type,
            categoryId,
            userId: user.id,
            date: txDate,
            note: tx.note,
          },
        });
      }
      console.log(
        `   -> Đã khởi tạo tài khoản ${demo.email} kèm ${demo.sampleTransactions.length} giao dịch mẫu.`
      );
    } else {
      console.log(
        `   -> Tài khoản ${demo.email} đã tồn tại (${existingTxCount} giao dịch). Giữ nguyên dữ liệu.`
      );
    }
  }

  console.log('Hoàn tất toàn bộ quá trình Seed dữ liệu!');
}

main()
  .catch((error) => {
    console.error('Lỗi trong quá trình seed dữ liệu:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
