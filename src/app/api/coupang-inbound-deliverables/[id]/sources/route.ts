import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { saveCoupangInboundSourceFile } from "@/services/deliverables/coupang-inbound-source-files";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{ id: string }>;
};

/** 기록하기 후 원본 파일(엑셀/이미지)을 한 장씩 저장한다. */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const { id } = await context.params;
    const formData = await request.formData();
    const file = formData.get("file");
    const index = Number(formData.get("index"));

    if (!(file instanceof File)) {
      return jsonError("원본 파일이 없습니다.", 400);
    }

    if (!Number.isInteger(index) || index < 0) {
      return jsonError("원본 파일 순번이 올바르지 않습니다.", 400);
    }

    const result = await saveCoupangInboundSourceFile({
      deliverableId: id,
      index,
      buffer: Buffer.from(await file.arrayBuffer()),
    });

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-inbound-deliverables/[id]/sources",
      method: "POST",
    });
    return jsonError("원본 파일 저장에 실패했습니다.", 500);
  }
}
