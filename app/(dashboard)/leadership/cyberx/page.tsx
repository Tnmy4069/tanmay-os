import { Shield, Zap } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function CyberXPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col gap-2 border-b pb-6">
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Shield className="w-8 h-8 text-primary" />
          CyberX — Leadership
        </h1>
        <p className="text-muted-foreground">Manage your CyberX club responsibilities, cybersecurity events, and team coordination.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Open Tasks</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div></CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">Upcoming Events</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">0</div></CardContent>
        </Card>
        <Card className="bg-secondary/30">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground uppercase">CTF Challenges</CardTitle></CardHeader>
          <CardContent><div className="text-2xl font-bold">—</div></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Activity Feed</CardTitle>
          <CardDescription>Coming soon — Phase 3 implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed rounded-xl text-muted-foreground gap-3">
            <Zap className="w-12 h-12 opacity-30" />
            <p className="text-lg font-medium">No activities logged yet</p>
            <p className="text-sm opacity-70">Track CyberX events, workshops, and CTF sessions here.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
