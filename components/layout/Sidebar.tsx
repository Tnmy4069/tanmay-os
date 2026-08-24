"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Brain, 
  CalendarDays, 
  CheckSquare, 
  Briefcase, 
  Code2, 
  Calculator, 
  GraduationCap, 
  TrendingUp,
  Box,
  ShieldAlert,
  Dumbbell,
  Heart,
  BarChart3,
  Settings,
  LayoutDashboard,
  CalendarCheck2,
  CalendarRange
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Today", href: "/today", icon: CalendarDays },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  
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
  { name: "Routine Checklist", href: "/personal/checklist", icon: CalendarCheck2 },
  
  { name: "System", divider: true },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Routine Editor", href: "/settings/routine", icon: CalendarRange },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col bg-card border-r">
      <div className="flex h-14 items-center border-b px-4">
        <Brain className="mr-2 h-6 w-6 text-primary" />
        <span className="font-semibold tracking-tight text-lg">Tanmay OS</span>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item, index) => {
            if (item.divider) {
              return (
                <div key={`div-${index}`} className="pt-4 pb-1">
                  <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {item.name}
                  </p>
                </div>
              );
            }

            const isActive = pathname === item.href;
            const Icon = item.icon!;

            return (
              <Link
                key={item.name}
                href={item.href!}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon
                  className={cn(
                    "mr-3 h-4 w-4 flex-shrink-0",
                    isActive ? "text-primary" : "text-muted-foreground group-hover:text-accent-foreground"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
