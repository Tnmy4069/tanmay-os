import { BarChart3, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AnalyticsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary" />
          Analytics
        </h1>
        <p className="text-muted-foreground">Weekly execution scores, productivity trends, and cross-domain analytics.</p>
      </div>
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
