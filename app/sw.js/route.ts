import { buildServiceWorkerScript, resolveSwVersion } from "@/lib/offline/sw-source";

export const runtime = "nodejs";
/** Bake commit SHA into the worker at build/deploy time. */
export const dynamic = "force-static";

export function GET() {
  const version = resolveSwVersion();
  const body = buildServiceWorkerScript(version);
  return new Response(body, {
    headers: {
      "Content-Type": "application/javascript; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "Service-Worker-Allowed": "/",
    },
  });
}
