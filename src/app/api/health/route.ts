import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const count = await prisma.healthCheck.count();

    return NextResponse.json({
      ok: true,
      db: "connected",
      healthCheckCount: count,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ ok: false, db: "error" }, { status: 500 });
  }
}
