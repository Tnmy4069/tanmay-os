import { PageHeader } from "@/components/layout/PageHeader";
import { Calculator } from "lucide-react";
import { AptitudeTracker } from "@/components/features/AptitudeTracker";
import { getAptitudeSessions } from "@/app/actions/career.actions";

export default async function AptitudePage() {
  const items = await getAptitudeSessions();

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Aptitude"
        description="Quant, logical, and verbal practice with accuracy over time."
        icon={Calculator}
      />
      <AptitudeTracker initialItems={items} />
    </div>
  );
}
