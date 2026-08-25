import { PageHeader } from "@/components/layout/PageHeader";
import { GraduationCap } from "lucide-react";
import { IitmTracker } from "@/components/features/IitmTracker";
import { getIitmData } from "@/app/actions/education.actions";

export default async function IITMPage() {
  const { courses, deadlines } = await getIitmData();

  return (
    <div className="p-5 sm:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader
        title="IIT Madras"
        description="BS courses, credits, and assignment / quiz / exam deadlines."
        icon={GraduationCap}
      />
      <IitmTracker initialCourses={courses} initialDeadlines={deadlines} />
    </div>
  );
}
