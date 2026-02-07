import { NextResponse } from "next/server";
import { getArtifact } from "@/app/lib/redis-store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let artifact;
  try {
    artifact = await getArtifact(id);
  } catch {
    return NextResponse.json({ error: "Artifact corrupted" }, { status: 500 });
  }
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
