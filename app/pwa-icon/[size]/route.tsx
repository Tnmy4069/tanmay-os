import fs from "fs";
import path from "path";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const raw = Number((await params).size);
  const size = raw === 512 ? 512 : 192;
  const filePath = path.join(process.cwd(), "public", `pwa-icon-${size}.png`);
  
  if (fs.existsSync(filePath)) {
    const fileBuffer = fs.readFileSync(filePath);
    return new Response(fileBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  }

  return new Response("Not found", { status: 404 });
}