import { PageHeader } from "@/components/layout/PageHeader";
import { Briefcase } from "lucide-react";
import { JobHuntBoard } from "@/components/features/JobHuntBoard";
import { getCareerJobs } from "@/app/actions/career.actions";

export default async function JobHuntPage() {
  const jobs = await getCareerJobs();

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="Job hunt"
        description="Track every application from wishlist to offer. Update status as rounds happen."
        icon={Briefcase}
      />
      <JobHuntBoard initialJobs={jobs} />
    </div>
  );
}
