import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { encodeContentDispositionFilename } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError } from "@/lib/api/response";
import { getShoplingInboundDeliverableFile } from "@/services/deliverables/get-shopling-inbound-deliverable-file";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const { id } = await context.params;
    const result = await getShoplingInboundDeliverableFile(id);

    if (!result.ok) {
      return jsonError(result.error, 404);
    }

    return new Response(new Uint8Array(result.data.buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": encodeContentDispositionFilename(
          result.data.outputFileName,
        ),
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    logRouteError(error, {
      route: "/api/shopling-inbound-deliverables/[id]/download",
      method: "GET",
    });
    return jsonError("엑셀 다운로드에 실패했습니다.", 500);
  }
}
