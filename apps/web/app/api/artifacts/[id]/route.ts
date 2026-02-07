import { NextRequest, NextResponse } from "next/server";
import { getArtifact, isArtifactInTrace } from "@/app/lib/redis-store";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const trace_id = request.nextUrl.searchParams.get("trace_id");
  if (trace_id) {
    const allowed = await isArtifactInTrace(trace_id, id);
    if (!allowed) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }
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
