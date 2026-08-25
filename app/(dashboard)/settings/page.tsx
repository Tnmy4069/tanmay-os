import { PageHeader } from "@/components/layout/PageHeader";
import { Settings, User, Bell, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="app-page max-w-7xl">
      <PageHeader title="Settings" description="Account, alerts, and seed data." icon={Settings} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Profile</CardTitle>
            <CardDescription>Manage your account information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2 border border-dashed rounded-xl">
              <p className="text-sm">Profile settings coming soon.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
            <CardDescription>Configure reminders and alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground gap-2 border border-dashed rounded-xl">
              <p className="text-sm">Notification settings coming soon.</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Database className="w-5 h-5" /> Data & Seed</CardTitle>
            <CardDescription>Manage your schedule defaults.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Use the authenticated seed route to load your default weekly routine into the database.</p>
              <a
                href="/api/seed"
                className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Load Default Routine
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
