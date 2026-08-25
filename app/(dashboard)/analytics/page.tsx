import { PageHeader } from "@/components/layout/PageHeader";
import { BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Analytics" description="Weekly execution, focus hours, and trends." icon={BarChart3} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {["Task Completion", "Focus Hours", "Career Progress", "Education"].map((m) => (
          <Card key={m} className="bg-secondary/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">{m}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold text-muted-foreground">—</div><p className="text-xs text-muted-foreground mt-1">Not tracked yet</p></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Weekly Execution Report</CardTitle>
          <CardDescription>Coming soon — Phase 5 implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl text-muted-foreground gap-3">
            <TrendingUp className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium">Not enough data yet</p>
            <p className="text-sm opacity-70">Start using Tanmay OS and analytics will populate automatically.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
