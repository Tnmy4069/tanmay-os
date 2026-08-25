import { PageHeader } from "@/components/layout/PageHeader";
import { Code2 } from "lucide-react";
import { DsaTracker } from "@/components/features/DsaTracker";
import { getDsaProblems } from "@/app/actions/career.actions";

export default async function DSAPage() {
  const items = await getDsaProblems();

  return (
    <div className="app-page max-w-7xl">
      <PageHeader
        title="DSA tracker"
        description="Log problems, topics, and difficulty. Streak counts consecutive solve days."
        icon={Code2}
      />
      <DsaTracker initialItems={items} />
    </div>
  );
}
