import { Briefcase, Clock, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function JobHuntPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-primary" />
          Job Hunt CRM
        </h1>
        <p className="text-muted-foreground">Track your job applications, OAs, interviews, and offers.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-500 uppercase">Applied</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">0</div></CardContent>
        </Card>
        <Card className="bg-yellow-500/5 border-yellow-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-yellow-500 uppercase">In Progress</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">0</div><p className="text-xs text-muted-foreground mt-1">OA / Interview</p></CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-green-500 uppercase">Offers</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">0</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Applications Pipeline</CardTitle>
          <CardDescription>Coming soon — Phase 2 implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl text-muted-foreground gap-3">
            <Building2 className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium">No applications yet</p>
            <p className="text-sm opacity-70">Add your first job application to get started.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
