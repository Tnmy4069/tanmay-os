import { Heart, Smile } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatRow } from "@/components/layout/StatRow";
import { EmptyState } from "@/components/layout/EmptyState";

export default function PersonalLifePage() {
  return (
    <div className="app-page max-w-7xl">
      <PageHeader
        title="Personal Life"
        description="Track personal goals, habits, relationships, and meaningful moments."
        icon={Heart}
      />
      <StatRow
        items={[
          { label: "Habit streak", value: "0 days" },
          { label: "Goals active", value: 0 },
          { label: "Journal", value: 0 },
        ]}
      />
      <Card>
        <CardHeader>
          <CardTitle>Personal journal</CardTitle>
          <CardDescription>Coming soon — Phase 4 implementation.</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyState icon={Smile} title="Your personal space" hint="Log habits, personal goals, and life events here." />
        </CardContent>
      </Card>
    </div>
  );
}
