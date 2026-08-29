import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Box,
  Briefcase,
  Calculator,
  CalendarCheck2,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  Code2,
  Dumbbell,
  GraduationCap,
  Heart,
  LayoutDashboard,
  Settings,
  ShieldAlert,
  TrendingUp,
  Wallet,
} from "lucide-react";

export type NavLink = {
  name: string;
  href: string;
  icon: LucideIcon;
};

export type NavEntry = NavLink | { name: string; divider: true };

export const systemNavTop: NavLink[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Today", href: "/today", icon: CalendarDays },
  { name: "Finance", href: "/finance", icon: Wallet },
];

export const systemNavBottom: NavLink[] = [
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Routine", href: "/settings/routine", icon: CalendarRange },
  { name: "Settings", href: "/settings", icon: Settings },
];

export const navigation: NavEntry[] = [
  ...systemNavTop,
  { name: "Career", divider: true },
  { name: "Job Hunt", href: "/career/jobs", icon: Briefcase },
  { name: "DSA", href: "/career/dsa", icon: Code2 },
  { name: "Aptitude", href: "/career/aptitude", icon: Calculator },
  { name: "Education", divider: true },
  { name: "IIT Madras", href: "/education/iitm", icon: GraduationCap },
  { name: "Upskilling", href: "/education/upskilling", icon: TrendingUp },
  { name: "Leadership", divider: true },
  { name: "Apthex", href: "/leadership/apthex", icon: Box },
  { name: "CyberX", href: "/leadership/cyberx", icon: ShieldAlert },
  { name: "Personal", divider: true },
  { name: "Fitness", href: "/personal/fitness", icon: Dumbbell },
  { name: "Personal Life", href: "/personal/life", icon: Heart },
  { name: "Checklist", href: "/personal/checklist", icon: CalendarCheck2 },
  { name: "System", divider: true },
  ...systemNavBottom,
];

export const mobileTabs: NavLink[] = [
  { name: "Home", href: "/dashboard", icon: LayoutDashboard },
  { name: "Today", href: "/today", icon: CalendarDays },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Finance", href: "/finance", icon: Wallet },
];

export function isNavLink(item: NavEntry): item is NavLink {
  return "href" in item;
}
