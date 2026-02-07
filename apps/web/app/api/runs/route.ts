import { NextRequest, NextResponse } from "next/server";
import { getRuns } from "@/app/lib/runs";

export async function GET(request: NextRequest) {
  const project_id =
    request.nextUrl.searchParams.get("project_id") ?? undefined;
  const runs = await getRuns(project_id);
  return NextResponse.json({ runs });
}
