import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { HealthResponse } from "@/types/api";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    const latency = Date.now() - start;
    const res: HealthResponse = { status: "ok", latency, db: "connected" };
    return NextResponse.json(res, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err) {
    const res: HealthResponse = {
      status: "error",
      latency: Date.now() - start,
      db: err instanceof Error ? err.message : "disconnected",
    };
    return NextResponse.json(res, {
      status: 503,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
