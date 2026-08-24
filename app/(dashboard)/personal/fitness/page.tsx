import { Dumbbell, Heart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function FitnessPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Dumbbell className="w-8 h-8 text-primary" />
          Fitness Tracker
        </h1>
        <p className="text-muted-foreground">Log workouts, track sleep, and monitor your physical wellbeing.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
