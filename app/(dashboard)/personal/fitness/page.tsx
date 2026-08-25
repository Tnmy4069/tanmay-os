import { Dumbbell, Heart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

export default function FitnessPage() {
  return (
    <div className="app-page max-w-7xl">
      <PageHeader
        title="Fitness"
        description="Log workouts, track sleep, and monitor your physical wellbeing."
        icon={Dumbbell}
      />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-green-500 uppercase">Workouts This Week</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">0</div></CardContent>
        </Card>
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-500 uppercase">Avg Sleep</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">—</div><p className="text-xs text-muted-foreground mt-1">Hours/night</p></CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Streak</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">0 days</div></CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">This Month</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">0 sessions</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Workout Log</CardTitle>
          <CardDescription>Coming soon — Phase 4 implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl text-muted-foreground gap-3">
            <Heart className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium">No workouts logged yet</p>
            <p className="text-sm opacity-70">Log your workouts and sleep data here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
