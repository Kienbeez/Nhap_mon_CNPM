import { describe, it, expect, afterEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  signJwtToken,
  verifyJwtToken,
  getJwtSecretKey,
} from '../auth';
import { registerSchema, loginSchema, categorySchema } from '../validations';
import { formatCurrencyVND } from '../utils';

describe('Unit Tests: Hệ thống Xác thực & Mã hóa (auth.ts / jwt.ts)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalJwtSecret = process.env.JWT_SECRET;

  afterEach(() => {
    (process.env as Record<string, string | undefined>).NODE_ENV = originalNodeEnv;
    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }
  });

  it('Mã hóa mật khẩu và kiểm tra mật khẩu chính xác (bcrypt)', async () => {
    const rawPassword = 'MatKhauAnToan123!';
    const hashed = await hashPassword(rawPassword);

    expect(hashed).not.toBe(rawPassword);
    expect(await verifyPassword(rawPassword, hashed)).toBe(true);
    expect(await verifyPassword('SaiMatKhau', hashed)).toBe(false);
  });

  it('Ký và giải mã JWT Token hợp lệ (jose)', async () => {
    const payload = {
      userId: 'user_123',
      email: 'kienbe@example.com',
      name: 'Kiên Bế',
    };

    const token = await signJwtToken(payload);
    expect(typeof token).toBe('string');

    const decoded = await verifyJwtToken(token);
    expect(decoded).toEqual(payload);
  });

  it('Trả về null khi JWT Token bị giả mạo hoặc không hợp lệ', async () => {
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
    const result = await verifyJwtToken(invalidToken);
    expect(result).toBeNull();
  });

  it('Bắt buộc phải có JWT_SECRET đủ 32 ký tự trên môi trường production', () => {
    (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
    delete process.env.JWT_SECRET;

    expect(() => getJwtSecretKey()).toThrow(/JWT_SECRET/);

    process.env.JWT_SECRET = 'short-secret';
    expect(() => getJwtSecretKey()).toThrow(/32 ký tự/);

    process.env.JWT_SECRET = 'valid-production-secret-key-with-at-least-32-chars';
    expect(getJwtSecretKey()).toBeInstanceOf(Uint8Array);
  });
});

describe('Unit Tests: Kiểm tra dữ liệu đầu vào (validations.ts)', () => {
  it('Chấp nhận dữ liệu Đăng ký hợp lệ và tự động chuẩn hóa email', () => {
    const result = registerSchema.safeParse({
      name: '  Nguyễn Bảo  ',
      email: '  NGUYENBAO@Example.com ',
      password: 'password123',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Nguyễn Bảo');
      expect(result.data.email).toBe('nguyenbao@example.com');
    }
  });

  it('Từ chối Đăng ký nếu mật khẩu ngắn hơn 6 ký tự', () => {
    const result = registerSchema.safeParse({
      name: 'Kiên Bế',
      email: 'kien@example.com',
      password: '123',
    });
    expect(result.success).toBe(false);
  });

  it('Kiểm tra hợp lệ cho Schema Danh mục Thu/Chi (bao gồm whitelist icon và mã màu HEX)', () => {
    const validCategory = categorySchema.safeParse({
      name: 'Tiền thưởng dự án',
      type: 'INCOME',
      icon: 'Gift',
      color: '#10b981',
      description: 'Thưởng quý 4',
    });
    expect(validCategory.success).toBe(true);

    const invalidColorCategory = categorySchema.safeParse({
      name: 'Ăn vặt',
      type: 'EXPENSE',
      icon: 'Utensils',
      color: 'red-color-invalid',
    });
    expect(invalidColorCategory.success).toBe(false);

    const invalidIconCategory = categorySchema.safeParse({
      name: 'Ăn vặt',
      type: 'EXPENSE',
      icon: 'UnknownIconName',
      color: '#ef4444',
    });
    expect(invalidIconCategory.success).toBe(false);
  });

  it('Kiểm tra Schema Đăng nhập', () => {
    expect(
      loginSchema.safeParse({ email: 'user@test.com', password: '123' }).success
    ).toBe(true);
    expect(
      loginSchema.safeParse({ email: 'not-an-email', password: '123' }).success
    ).toBe(false);
  });
});

describe('Unit Tests: Tiện ích định dạng tiền tệ VND (utils.ts)', () => {
  it('Định dạng số sang tiền tệ VND chuẩn xác', () => {
    const formatted = formatCurrencyVND(1500000);
    // Kiểm tra chuỗi có chứa 1.500.000 và ký hiệu ₫
    expect(formatted).toContain('1.500.000');
    expect(formatted).toContain('₫');
  });

  it('Xử lý an toàn khi giá trị đầu vào không phải là số hợp lệ', () => {
    expect(formatCurrencyVND('invalid')).toContain('0');
  });
});
