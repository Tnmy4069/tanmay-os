import { Lightbulb, PlayCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function UpskillingPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Lightbulb className="w-8 h-8 text-primary" />
          Upskilling
        </h1>
        <p className="text-muted-foreground">Track certifications, courses, and skill development outside IITM.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Active Courses</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div></CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Certifications</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div></CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Hours This Month</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">0h</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Learning Log</CardTitle>
          <CardDescription>Coming soon — Phase 2 implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl text-muted-foreground gap-3">
            <PlayCircle className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium">No courses added yet</p>
            <p className="text-sm opacity-70">Track certifications, tutorials, and skill courses here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
