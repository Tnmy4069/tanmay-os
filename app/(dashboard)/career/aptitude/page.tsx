import { Brain, BookOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AptitudePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          Aptitude Tracker
        </h1>
        <p className="text-muted-foreground">Track Quant, Logical Reasoning, and Verbal practice sessions.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["Quantitative", "Logical Reasoning", "Verbal"].map((topic) => (
          <Card key={topic} className="bg-secondary/30">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">{topic}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">0 sessions</div><p className="text-xs text-muted-foreground mt-1">This week</p></CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Practice Log</CardTitle>
          <CardDescription>Coming soon — Phase 2 implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl text-muted-foreground gap-3">
            <BookOpen className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium">No sessions logged yet</p>
            <p className="text-sm opacity-70">Log your aptitude prep sessions here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
