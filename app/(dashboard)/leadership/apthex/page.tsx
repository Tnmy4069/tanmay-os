import { PageHeader } from "@/components/layout/PageHeader";
import { Box } from "lucide-react";
import { LeadershipHub } from "@/components/features/LeadershipHub";
import { getLeadershipData } from "@/app/actions/leadership.actions";

export default async function ApthexPage() {
  const data = await getLeadershipData("Apthex");

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Apthex"
        description="Club tasks, events, and core team — keep the next workshop from slipping."
        icon={Box}
      />
      <LeadershipHub
        club="Apthex"
        initialEvents={data.events}
        initialTasks={data.tasks}
        initialMembers={data.members}
      />
    </div>
  );
}
