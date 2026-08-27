import { Flame, Sparkles, Trophy, Zap } from "lucide-react";
import { ProgressBar } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export type GameStats = {
  streakDays: number;
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  dailyGoal: number;
  dailyDone: number;
  badges: { id: string; label: string; earned: boolean }[];
};

function StatPill({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  tone: "streak" | "xp" | "level" | "goal";
}) {
  const styles = {
    streak: {
      wrap: "bg-[color:var(--streak)]/15",
      icon: "bg-[color:var(--streak)] text-white",
      value: "text-[color:var(--streak)]",
    },
    xp: {
      wrap: "bg-[color:var(--xp)]/15",
      icon: "bg-[color:var(--xp)] text-white",
      value: "text-[color:var(--xp)]",
    },
    level: {
      wrap: "bg-primary/15",
      icon: "bg-primary text-primary-foreground",
      value: "text-[color:var(--primary-deep)] dark:text-primary",
    },
    goal: {
      wrap: "bg-[color:var(--warning)]/20",
      icon: "bg-[color:var(--warning)] text-[color:var(--warning-foreground)]",
      value: "text-[color:var(--warning-foreground)] dark:text-[color:var(--warning)]",
    },
  }[tone];

  return (
    <div className={cn("flex min-w-[6.5rem] flex-1 items-center gap-2.5 rounded-2xl px-2.5 py-2 sm:min-w-0 sm:px-3 sm:py-2.5", styles.wrap)}>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", styles.icon)}>
        <Icon className="h-4 w-4" strokeWidth={2.5} />
      </span>
      <div className="min-w-0">
        <p className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={cn("truncate text-sm font-black leading-tight sm:text-base", styles.value)}>{value}</p>
      </div>
    </div>
  );
}

export function GameHUD({ stats, className }: { stats: GameStats; className?: string }) {
  const goalPct = stats.dailyGoal > 0 ? Math.round((stats.dailyDone / stats.dailyGoal) * 100) : 0;
  const goalComplete = stats.dailyDone >= stats.dailyGoal && stats.dailyGoal > 0;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl bg-card p-3.5 sm:p-5",
        "shadow-[inset_0_0_0_1px_color-mix(in_oklab,var(--border)_70%,transparent)]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background: `
            radial-gradient(520px 220px at 0% 0%, color-mix(in oklab, var(--streak) 18%, transparent), transparent 60%),
            radial-gradient(420px 200px at 100% 0%, color-mix(in oklab, var(--xp) 16%, transparent), transparent 55%),
            radial-gradient(480px 240px at 80% 100%, color-mix(in oklab, var(--primary) 14%, transparent), transparent 60%)
          `,
        }}
      />

      <div className="relative space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Quest board</p>
            <p className="text-sm font-extrabold text-foreground sm:text-base">
              {goalComplete ? "Daily goal crushed" : "Keep the streak going"}
            </p>
          </div>
          {goalComplete && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--warning)]/25 px-2.5 py-1 text-[11px] font-extrabold text-[color:var(--warning-foreground)] dark:text-[color:var(--warning)]">
              <Sparkles className="h-3.5 w-3.5" />
              Goal done
            </span>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] sm:grid sm:grid-cols-3 sm:overflow-visible">
          <StatPill icon={Flame} label="Streak" value={`${stats.streakDays}d`} tone="streak" />
          <StatPill icon={Zap} label="XP" value={`${stats.xp}`} tone="xp" />
          <StatPill icon={Trophy} label="Level" value={`Lv ${stats.level}`} tone="level" />
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-2xl bg-background/70 p-3 backdrop-blur-[2px] sm:grid-cols-2 sm:p-3.5">
          <ProgressBar
            label="Level progress"
            value={stats.xpIntoLevel}
            max={stats.xpForNextLevel}
            tone="xp"
          />
          <ProgressBar
            label={`Daily goal · ${stats.dailyDone}/${stats.dailyGoal}`}
            value={stats.dailyDone}
            max={Math.max(stats.dailyGoal, 1)}
            tone={goalComplete ? "streak" : "primary"}
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {stats.badges.map((b) => (
            <span
              key={b.id}
              className={cn(
                "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-extrabold",
                b.earned
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground"
              )}
            >
              {b.earned ? "★" : "○"} {b.label}
            </span>
          ))}
        </div>

        {goalPct >= 100 && (
          <p className="text-sm font-extrabold text-[color:var(--primary-deep)] dark:text-primary">
            Nice work — today&apos;s quest is complete. Keep the streak alive!
          </p>
        )}
      </div>
    </section>
  );
}
