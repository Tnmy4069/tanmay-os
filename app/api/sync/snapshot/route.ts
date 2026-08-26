import { NextResponse } from "next/server";
import { buildSyncSnapshot, requireSyncUser } from "@/lib/sync/snapshot";

export async function GET() {
  const userId = await requireSyncUser();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const snapshot = await buildSyncSnapshot(userId);
  return NextResponse.json(snapshot);
}
