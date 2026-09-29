import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { encodeContentDispositionFilename } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import { getCoupangInboundSourceFile } from "@/services/deliverables/coupang-inbound-source-files";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string; index: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const { id, index } = await context.params;
    const result = await getCoupangInboundSourceFile(id, Number(index));

    if (!result.ok) {
      return jsonError(result.error, 404);
    }

    return new Response(new Uint8Array(result.data.buffer), {
      status: 200,
      headers: {
        "Content-Type": result.data.contentType,
        "Content-Disposition": encodeContentDispositionFilename(
          result.data.name,
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-inbound-deliverables/[id]/sources/[index]",
      method: "GET",
    });
    return jsonError("원본 파일 다운로드에 실패했습니다.", 500);
  }
}
