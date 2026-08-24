import { User, Smile } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function PersonalLifePage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-primary" />
          Personal Life
        </h1>
        <p className="text-muted-foreground">Track personal goals, habits, relationships, and meaningful moments.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-purple-500/5 border-purple-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-purple-500 uppercase">Habit Streak</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">0 days</div></CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Goals Active</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">0</div></CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Journal Entries</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">0</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Personal Journal</CardTitle>
          <CardDescription>Coming soon — Phase 4 implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl text-muted-foreground gap-3">
            <Smile className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium">Your personal space</p>
            <p className="text-sm opacity-70">Log habits, personal goals, and life events here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
