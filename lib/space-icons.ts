import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Box,
  Briefcase,
  Calculator,
  CalendarCheck2,
  Code2,
  Dumbbell,
  Folder,
  Globe,
  GraduationCap,
  Heart,
  PenLine,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export const SPACE_ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Box,
  Briefcase,
  Calculator,
  CalendarCheck2,
  Code2,
  Dumbbell,
  Folder,
  Globe,
  GraduationCap,
  Heart,
  PenLine,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Wallet,
};

export function spaceIcon(name?: string): LucideIcon {
  return SPACE_ICON_MAP[name || ""] || Folder;
}