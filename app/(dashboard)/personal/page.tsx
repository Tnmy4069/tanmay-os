import { getSpaceNav } from "@/app/actions/space.actions";
import { CoreOverviewPage } from "@/components/features/CoreOverviewPage";
import { spaceIcon } from "@/lib/space-icons";
import { defaultCores } from "@/lib/spaces";

export default async function PersonalPage() {
  let cores = defaultCores();
  try { cores = await getSpaceNav(); } catch {}
  const core = cores.find((c) => c.slug === "personal") ?? defaultCores().find((c) => c.slug === "personal")!;
  return <CoreOverviewPage core={core} coreIcon={spaceIcon(core.icon)} />;
}
