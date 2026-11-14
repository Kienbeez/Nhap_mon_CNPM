import React from 'react';
import { Wallet } from 'lucide-react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-slate-50 via-emerald-50/30 to-slate-100 p-4 sm:p-6 lg:p-8">
      {/* Brand Header */}
      <div className="mb-8 text-center flex flex-col items-center">
        <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20 mb-3">
          <Wallet className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Personal Finance Tracker
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Hệ thống Quản lý Thu Chi & Ngân sách Cá nhân
        </p>
      </div>

      {/* Main Form Container */}
      <div className="w-full max-w-md">{children}</div>

      {/* Footer */}
      <div className="mt-8 text-center text-xs text-slate-400">
        © 2026 Personal Finance Tracker. Nền tảng an toàn & bảo mật.
      </div>
    </div>
  );
}
