import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get("file");
  const trace_id = formData.get("trace_id") as string | null;

  if (!file || typeof file === "string") {
    return NextResponse.json(
      { error: "Missing or invalid file" },
      { status: 400 },
    );
  }

  return NextResponse.json({
    artifact_id: `art_${Date.now()}`,
    url: `s3://faultline-artifacts/${trace_id ?? "unknown"}/${(file as File).name}`,
  });
}
