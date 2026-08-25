import { PageHeader } from "@/components/layout/PageHeader";
import { Settings, User, Bell, Database, Layers, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { SpaceSettings } from "@/components/features/SpaceSettings";
import { getSpaceNav } from "@/app/actions/space.actions";
import { auth } from "@/lib/auth";
import { LogoutButton } from "@/components/features/LogoutButton";

export default async function SettingsPage() {
  const [cores, session] = await Promise.all([getSpaceNav(), auth()]);

  return (
    <div className="app-page max-w-3xl">
      <PageHeader title="Settings" description="Categories, account, and seed data." icon={Settings} />

      <div>
        <div className="mb-3">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Layers className="w-5 h-5" /> Categories
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Rename Career, Education, Leadership, and Personal. Add subcategories or a new core group.
          </p>
        </div>
        <SpaceSettings initialCores={cores} />
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" /> Account</CardTitle>
            <CardDescription>Manage your session and account.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {session?.user && (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-secondary/40 px-4 py-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/12 text-primary font-semibold text-sm">
                    {(session.user.name ?? session.user.email ?? "U")[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    {session.user.name && (
                      <p className="text-sm font-medium truncate">{session.user.name}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3">
                <div>
                  <p className="text-sm font-medium flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-destructive" />
                    Sign out
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    You will be redirected to the login page.
                  </p>
                </div>
                <LogoutButton />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" /> Notifications</CardTitle>
            <CardDescription>Configure reminders and alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground gap-2 border border-dashed rounded-xl">
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
                className="inline-flex h-11 items-center justify-center rounded-xl border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
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