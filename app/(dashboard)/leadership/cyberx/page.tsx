import { PageHeader } from "@/components/layout/PageHeader";
import { ShieldAlert } from "lucide-react";
import { LeadershipHub } from "@/components/features/LeadershipHub";
import { getLeadershipData } from "@/app/actions/leadership.actions";

export default async function CyberXPage() {
  const data = await getLeadershipData("CyberX");

  return (
    <div className="app-page max-w-7xl">
      <PageHeader
        title="CyberX"
        description="Security club ops plus a CTF challenge log."
        icon={ShieldAlert}
      />
      <LeadershipHub
        club="CyberX"
        showCtf
        initialEvents={data.events}
        initialTasks={data.tasks}
        initialMembers={data.members}
        initialCtfs={data.ctfs}
      />
    </div>
  );
}
