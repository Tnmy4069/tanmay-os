import { Heart, Smile } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";

export default function PersonalLifePage() {
  return (
    <div className="app-page max-w-7xl">
      <PageHeader
        title="Personal Life"
        description="Track personal goals, habits, relationships, and meaningful moments."
        icon={Heart}
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
