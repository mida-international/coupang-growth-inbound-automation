import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import { deleteTelegramBoxListUpload } from "@/services/telegram-box-list/delete-telegram-box-list-upload";
import { getTelegramBoxListUploadVisionData } from "@/services/telegram-box-list/get-telegram-box-list-upload-vision-data";

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
    const result = await getTelegramBoxListUploadVisionData(id);

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/telegram/box-list-uploads/[id]",
      method: "GET",
    });

    return jsonError("인식 데이터 조회에 실패했습니다.", 500);
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const { id } = await context.params;
    const result = await deleteTelegramBoxListUpload(id);

    return fromServiceResult(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/telegram/box-list-uploads/[id]",
      method: "DELETE",
    });

    return jsonError("텔레그램 업로드 삭제에 실패했습니다.", 500);
  }
}
