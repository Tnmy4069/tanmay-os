import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden lg:flex-row">
      <Sidebar />
      <main className="min-h-0 flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
