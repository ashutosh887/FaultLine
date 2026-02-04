import { NextResponse } from "next/server";
import { getReport } from "@/app/lib/report";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ trace_id: string }> },
) {
  const { trace_id } = await params;
  const data = await getReport(trace_id);
  return NextResponse.json(data);
}
