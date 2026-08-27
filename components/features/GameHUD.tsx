import { Flame, Sparkles, Trophy, Zap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

export function GameHUD({ stats, className }: { stats: GameStats; className?: string }) {
  const goalPct = stats.dailyGoal > 0 ? Math.round((stats.dailyDone / stats.dailyGoal) * 100) : 0;
  const goalComplete = stats.dailyDone >= stats.dailyGoal && stats.dailyGoal > 0;

  return (
    <Card className={cn("overflow-hidden border-primary/30 bg-[color:var(--primary-soft)]/40 dark:bg-primary/5", className)}>
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="streak" className="gap-1">
            <Flame className="h-3.5 w-3.5" />
            {stats.streakDays} day streak
          </Badge>
          <Badge variant="xp" className="gap-1">
            <Zap className="h-3.5 w-3.5" />
            {stats.xp} XP
          </Badge>
          <Badge variant="success" className="gap-1">
            <Trophy className="h-3.5 w-3.5" />
            Level {stats.level}
          </Badge>
          {goalComplete && (
            <Badge variant="warning" className="gap-1">
              <Sparkles className="h-3.5 w-3.5" />
              Daily goal done!
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

        <div className="flex flex-wrap gap-2">
          {stats.badges.map((b) => (
            <span
              key={b.id}
              className={cn(
                "inline-flex items-center rounded-full border-2 px-2.5 py-1 text-[11px] font-extrabold",
                b.earned
                  ? "border-primary/40 bg-primary/15 text-[color:var(--primary-deep)] dark:text-primary"
                  : "border-dashed border-border bg-card/50 text-muted-foreground opacity-60"
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
      </CardContent>
    </Card>
  );
}
