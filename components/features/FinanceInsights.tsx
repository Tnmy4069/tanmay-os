import { TrendingUp, TrendingDown, AlertTriangle, Target, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpendingInsight } from "@/lib/finance-constants";

const INSIGHT_CONFIG = {
  good: {
    icon: TrendingUp,
    bg: "bg-[color:var(--success)]/12",
    text: "text-[color:var(--success)]",
    iconBg: "bg-[color:var(--success)] text-[color:var(--success-foreground)]",
  },
  warn: {
    icon: AlertTriangle,
    bg: "bg-[color:var(--warning)]/15",
    text: "text-[color:var(--warning-foreground)] dark:text-[color:var(--warning)]",
    iconBg: "bg-[color:var(--warning)] text-[color:var(--warning-foreground)]",
  },
  bad: {
    icon: TrendingDown,
    bg: "bg-destructive/10",
    text: "text-destructive",
    iconBg: "bg-destructive text-destructive-foreground",
  },
  neutral: {
    icon: Target,
    bg: "bg-[color:var(--info)]/10",
    text: "text-[color:var(--info)]",
    iconBg: "bg-[color:var(--info)] text-[color:var(--info-foreground)]",
  },
};

export function FinanceInsights({ insights }: { insights: SpendingInsight[] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="space-y-2">
      {insights.map((insight, i) => {
        const config = INSIGHT_CONFIG[insight.severity];
        const Icon = config.icon;
        return (
          <div
            key={i}
            className={cn("flex items-start gap-3 rounded-2xl p-3.5", config.bg)}
          >
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-xl",
                config.iconBg
              )}
            >
              <Icon className="h-4 w-4" strokeWidth={2.5} />
            </span>
            <p className={cn("text-sm font-semibold leading-snug pt-0.5", config.text)}>
              {insight.message}
            </p>
          </div>
        );
      })}
    </div>
  );
}
