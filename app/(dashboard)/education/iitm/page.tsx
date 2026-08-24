import { GraduationCap, BookMarked } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function IITMPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <GraduationCap className="w-8 h-8 text-primary" />
          IIT Madras — BS Degree
        </h1>
        <p className="text-muted-foreground">Track your IITM Online BS courses, assignments, exams, and term progress.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Current Term</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">—</div></CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Courses Active</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div></CardContent>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-500 uppercase">Due This Week</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div></CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-green-500 uppercase">Credits Done</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Course Tracker</CardTitle>
          <CardDescription>Coming soon — Phase 2 implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl text-muted-foreground gap-3">
            <BookMarked className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium">No courses tracked yet</p>
            <p className="text-sm opacity-70">Add your current term courses to get started.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
