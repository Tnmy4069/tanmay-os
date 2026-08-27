import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatRow } from "@/components/layout/StatRow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import { getAnalyticsSnapshot } from "@/lib/analytics";
import { AnalyticsCharts } from "@/components/features/AnalyticsCharts";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getAnalyticsSnapshot(session.user.id);
  const { summary, career, education } = data;

  return (
    <div className="app-page max-w-7xl">
      <PageHeader
        title="Analytics"
        description="Execution, focus, career, and education at a glance."
        icon={BarChart3}
      />

      <StatRow
        items={[
          {
            label: "Completion",
            value: `${summary.completionRate}%`,
            hint: `${summary.doneTasks} done · ${summary.openTasks} open`,
            tone: "primary",
            href: "/tasks",
          },
          {
            label: "Done this week",
            value: summary.doneThisWeek,
            hint: "Last 7 days",
          },
          {
            label: "Focus plan",
            value: `${summary.focusHoursWeek}h`,
            hint: "Work + Focus this week",
          },
          {
            label: "Overdue",
            value: summary.overdue,
            hint: "Past end date",
            tone: summary.overdue ? "danger" : "default",
            href: "/today",
          },
        ]}
      />

      <AnalyticsCharts data={data} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Check-ins</CardTitle>
            <CardDescription>Logging consistency</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-extrabold">{summary.checkinsThisWeek}</p>
            <p className="text-xs font-bold text-muted-foreground">Days with check-in · last 7</p>
            <p className="text-sm font-semibold text-muted-foreground">{summary.loggedSlots} slot notes logged (30d)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Career</CardTitle>
            <CardDescription>Jobs + DSA</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-extrabold">{career.totalJobs}</p>
            <p className="text-xs font-bold text-muted-foreground">Applications tracked</p>
            <p className="text-sm font-semibold text-muted-foreground">
              DSA solved {career.dsaSolved}/{career.dsaTotal}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Education</CardTitle>
            <CardDescription>IITM + upskilling</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-extrabold">{education.iitmActive + education.skillsActive}</p>
            <p className="text-xs font-bold text-muted-foreground">Active courses</p>
            <p className="text-sm font-semibold text-muted-foreground">
              IITM {education.iitmActive}/{education.iitmTotal} · Skills {education.skillsActive}/
              {education.skillsTotal}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
