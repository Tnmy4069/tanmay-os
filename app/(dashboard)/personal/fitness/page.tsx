import { Dumbbell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatRow } from "@/components/layout/StatRow";
import { EmptyState } from "@/components/layout/EmptyState";

export default function FitnessPage() {
  return (
    <div className="app-page max-w-7xl">
      <PageHeader
        title="Fitness"
        description="Log workouts, track sleep, and monitor your physical wellbeing."
        icon={Dumbbell}
      />
      <StatRow
        items={[
          { label: "Workouts", value: 0, hint: "This week" },
          { label: "Avg sleep", value: "—", hint: "Hours/night" },
          { label: "Streak", value: "0 days" },
          { label: "This month", value: "0 sessions" },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Workout log</CardTitle>
          <CardDescription>Coming soon — Phase 4 implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Dumbbell} title="No workouts logged yet" hint="Log your workouts and sleep data here." />
        </CardContent>
      </Card>
    </div>
  );
}
