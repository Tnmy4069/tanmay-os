import { PageHeader } from "@/components/layout/PageHeader";
import { GraduationCap } from "lucide-react";
import { IitmTracker } from "@/components/features/IitmTracker";
import { getIitmData } from "@/app/actions/education.actions";

export default async function IITMPage() {
  const { courses, deadlines } = await getIitmData();

  return (
    <div className="app-page max-w-7xl">
      <PageHeader
        title="IIT Madras"
        description="BS courses, credits, and assignment / quiz / exam deadlines."
        icon={GraduationCap}
      />
      <IitmTracker initialCourses={courses} initialDeadlines={deadlines} />
    </div>
  );
}
