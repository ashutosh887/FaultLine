import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { storeArtifact } from "@/app/lib/redis-store";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "Missing or invalid file" },
      { status: 400 },
    );
  }

  const f = file as File;
  const buffer = Buffer.from(await f.arrayBuffer());
  const artifact_id = `art_${Date.now()}_${randomBytes(4).toString("hex")}`;
  const content_type = f.type || "application/octet-stream";

  try {
    await storeArtifact(artifact_id, content_type, buffer);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Storage failed" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    artifact_id,
    url: `/api/artifacts/${artifact_id}`,
  });
}
