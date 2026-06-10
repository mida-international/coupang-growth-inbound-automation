import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return NextResponse.json(
        { ok: false, auth: "error", message: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      ok: true,
      auth: "connected",
      hasSession: data.session !== null,
    });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, auth: "error", message },
      { status: 500 }
    );
  }
}
