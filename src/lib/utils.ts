import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Hàm gộp class TailwindCSS an toàn (chuẩn Shadcn/ui)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Định dạng số tiền sang chuẩn tiền tệ Việt Nam Đồng (VND - ₫)
 * Ví dụ: 1500000 -> "1.500.000 ₫"
 */
export function formatCurrencyVND(amount: number | string): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return '0 ₫';
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(numericAmount);
}

/**
 * Định dạng ngày tháng sang chuẩn Việt Nam (dd/MM/yyyy)
 */
export function formatDateVN(dateInput: Date | string): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return '';
  }
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
