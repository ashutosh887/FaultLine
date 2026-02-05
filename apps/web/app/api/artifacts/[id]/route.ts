import { NextResponse } from "next/server";
import { getArtifact } from "@/app/lib/redis-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const artifact = await getArtifact(id);
  if (!artifact) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(artifact.data), {
    headers: {
      "Content-Type": artifact.content_type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
