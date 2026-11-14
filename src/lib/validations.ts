import { z } from 'zod';

// ============================================================================
// ZOD VALIDATION SCHEMAS - KIỂM TRA DỮ LIỆU ĐẦU VÀO
// ============================================================================

/**
 * Danh sách biểu tượng (icon) hợp lệ được hỗ trợ bởi hệ thống
 */
export const AVAILABLE_ICONS = [
  'Utensils',
  'Car',
  'ShoppingBag',
  'Receipt',
  'Home',
  'Gamepad2',
  'HeartPulse',
  'GraduationCap',
  'Wallet',
  'Gift',
  'TrendingUp',
  'Briefcase',
  'Coins',
  'Coffee',
  'Plane',
  'BookOpen',
  'Smartphone',
  'Baby',
  'Film',
  'Dumbbell',
  'Music',
  'Shirt',
  'PiggyBank',
  'Sparkles',
  'Tag',
] as const;

/**
 * Schema kiểm tra dữ liệu Đăng ký tài khoản
 */
export const registerSchema = z.object({
  name: z
    .string({ required_error: 'Vui lòng nhập họ và tên' })
    .trim()
    .min(2, 'Họ và tên phải có ít nhất 2 ký tự')
    .max(50, 'Họ và tên không được vượt quá 50 ký tự'),
  email: z
    .string({ required_error: 'Vui lòng nhập địa chỉ email' })
    .trim()
    .toLowerCase()
    .email('Địa chỉ email không hợp lệ'),
  password: z
    .string({ required_error: 'Vui lòng nhập mật khẩu' })
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .max(100, 'Mật khẩu không được vượt quá 100 ký tự'),
});

/**
 * Schema kiểm tra dữ liệu Đăng nhập
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Vui lòng nhập địa chỉ email' })
    .trim()
    .toLowerCase()
    .email('Địa chỉ email không hợp lệ'),
  password: z
    .string({ required_error: 'Vui lòng nhập mật khẩu' })
    .min(1, 'Vui lòng nhập mật khẩu'),
});

/**
 * Enum loại danh mục / giao dịch
 */
export const transactionTypeSchema = z.enum(['INCOME', 'EXPENSE'], {
  errorMap: () => ({ message: 'Loại danh mục phải là Khoản Thu (INCOME) hoặc Khoản Chi (EXPENSE)' }),
});

/**
 * Schema kiểm tra dữ liệu Thêm mới / Cập nhật Danh mục Thu Chi
 */
export const categorySchema = z.object({
  name: z
    .string({ required_error: 'Vui lòng nhập tên danh mục' })
    .trim()
    .min(1, 'Tên danh mục không được để trống')
    .max(50, 'Tên danh mục không được vượt quá 50 ký tự'),
  type: transactionTypeSchema,
  icon: z
    .string()
    .trim()
    .min(1, 'Vui lòng chọn biểu tượng (icon)')
    .max(40, 'Tên biểu tượng không hợp lệ')
    .refine(
      (val) => (AVAILABLE_ICONS as readonly string[]).includes(val),
      'Biểu tượng (icon) không nằm trong danh sách hỗ trợ'
    )
    .default('Tag'),
  color: z
    .string()
    .trim()
    .regex(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, 'Mã màu HEX không hợp lệ (ví dụ: #10b981)')
    .default('#6366f1'),
  description: z
    .string()
    .trim()
    .max(200, 'Mô tả không được vượt quá 200 ký tự')
    .optional()
    .nullable(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
