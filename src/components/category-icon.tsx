import React from 'react';
import {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Wallet,
  Gift,
  TrendingUp,
  Briefcase,
  Coins,
  Coffee,
  Plane,
  BookOpen,
  Smartphone,
  Baby,
  Film,
  Dumbbell,
  Music,
  Shirt,
  Tag,
  PiggyBank,
  Sparkles,
  LucideIcon,
} from 'lucide-react';

export const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  ShoppingBag,
  Receipt,
  Home,
  Gamepad2,
  HeartPulse,
  GraduationCap,
  Wallet,
  Gift,
  TrendingUp,
  Briefcase,
  Coins,
  Coffee,
  Plane,
  BookOpen,
  Smartphone,
  Baby,
  Film,
  Dumbbell,
  Music,
  Shirt,
  PiggyBank,
  Sparkles,
  Tag,
};

export const AVAILABLE_ICONS = Object.keys(ICON_MAP);

export const AVAILABLE_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#64748b', // Slate
];

interface CategoryIconProps {
  name: string;
  className?: string;
  size?: number;
}

export function CategoryIcon({ name, className = 'w-5 h-5', size }: CategoryIconProps) {
  const IconComponent = ICON_MAP[name] || Tag;
  return <IconComponent className={className} size={size} />;
}
