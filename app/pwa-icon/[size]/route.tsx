import { pwaIcon } from "@/lib/pwa-icon";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const raw = Number((await params).size);
  const size = raw === 512 ? 512 : 192;
  return pwaIcon(size);
}