import { SettingsShell } from "@/components/features/SettingsShell";
import { SpaceSettings } from "@/components/features/SpaceSettings";
import { NotificationSettings } from "@/components/features/NotificationSettings";
import { getSpaceNav } from "@/app/actions/space.actions";
import { auth } from "@/lib/auth";

export default async function SettingsPage() {
  const [cores, session] = await Promise.all([getSpaceNav(), auth()]);

  return (
    <div className="app-page max-w-xl">
      <SettingsShell
        user={session?.user ? { name: session.user.name, email: session.user.email } : null}
        reminders={<NotificationSettings />}
        categories={<SpaceSettings initialCores={cores} />}
      />
    </div>
  );
}
