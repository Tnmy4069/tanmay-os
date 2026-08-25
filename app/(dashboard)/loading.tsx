import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="app-page max-w-7xl animate-pulse">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="space-y-2">
          <div className="h-4 w-32 rounded bg-secondary" />
          <div className="h-8 w-48 rounded bg-secondary" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-32 rounded-xl border border-border bg-secondary/50 flex items-center justify-center">
             <Loader2 className="h-8 w-8 text-primary/40 animate-spin" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
           {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 rounded-xl border border-border bg-secondary/50" />
           ))}
        </div>
        <div className="h-64 rounded-xl border border-border bg-secondary/50" />
      </div>
    </div>
  );
}

