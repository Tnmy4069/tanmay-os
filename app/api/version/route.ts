import { resolveSwVersion } from "@/lib/offline/sw-source";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Public build id — clients poll this to detect deploys. */
export function GET() {
  return Response.json(
    { v: resolveSwVersion() },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    }
  );
}
