import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";
import { getSpaceNav } from "@/app/actions/space.actions";
import { defaultCores } from "@/lib/spaces";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  let cores = defaultCores();
  try {
    cores = await getSpaceNav();
  } catch {
    cores = defaultCores();
  }

  return (
    <div className="flex h-dvh flex-col overflow-hidden lg:flex-row">
      <Sidebar cores={cores} />
      <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-[calc(4.25rem+env(safe-area-inset-bottom))] lg:pb-0">
        {children}
      </main>
    </div>
  );
}
