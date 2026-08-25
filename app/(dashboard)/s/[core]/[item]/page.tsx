import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCustomSpace } from "@/app/actions/space.actions";
import { spaceIcon } from "@/lib/space-icons";
import { CustomSpaceNotes } from "@/components/features/CustomSpaceNotes";

export default async function CustomSpacePage({
  params,
}: {
  params: Promise<{ core: string; item: string }>;
}) {
  const { core, item } = await params;
  const space = await getCustomSpace(core, item);
  if (!space) notFound();

  const Icon = spaceIcon(space.icon);

  return (
    <div className="app-page max-w-3xl">
      <PageHeader
        title={space.itemName}
        description={`${space.coreName} · custom space`}
        icon={Icon}
      />
      <CustomSpaceNotes coreSlug={core} itemSlug={item} initialNotes={space.notes} />
    </div>
  );
}