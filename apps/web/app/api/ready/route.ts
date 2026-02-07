import { NextResponse } from "next/server";
import { checkRedis } from "@/app/lib/redis-store";

export async function GET() {
  const ok = await checkRedis();
  if (!ok) {
    return NextResponse.json({ ready: false }, { status: 503 });
  }
  return NextResponse.json({ ready: true });
}
