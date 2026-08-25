import { PageHeader } from "@/components/layout/PageHeader";
import { TrendingUp } from "lucide-react";
import { UpskillTracker } from "@/components/features/UpskillTracker";
import { getSkillCourses, getSkillHoursThisMonth } from "@/app/actions/education.actions";

export default async function UpskillingPage() {
  const [courses, hoursThisMonth] = await Promise.all([getSkillCourses(), getSkillHoursThisMonth()]);

  return (
    <div className="app-page max-w-7xl">
      <PageHeader
        title="Upskilling"
        description="Courses and certs outside IITM. Log study time so monthly hours stay real."
        icon={TrendingUp}
      />
      <UpskillTracker initialCourses={courses} hoursThisMonth={hoursThisMonth} />
    </div>
  );
}
