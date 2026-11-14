import { PrismaClient } from '@prisma/client';

/**
 * Khởi tạo PrismaClient theo mẫu Singleton.
 * Trong môi trường Development, Next.js thực hiện Hot-Reload liên tục,
 * lưu instance vào biến global giúp tránh lỗi tạo quá nhiều kết nối (connection pool exhaustion) tới PostgreSQL.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
