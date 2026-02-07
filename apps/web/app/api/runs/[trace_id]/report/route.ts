import { NextResponse } from "next/server";
import { logWithTrace } from "@faultline/shared";
import { getReport } from "@/app/lib/report";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trace_id: string }> },
) {
  const { trace_id } = await params;
  const data = await getReport(trace_id);
  logWithTrace(trace_id, "report_viewed", { source: "api" });
  return NextResponse.json(data);
}
