import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError } from "@/lib/api/response";
import type { InboundWorkbenchColumnLayout } from "@/services/inbound-workbench/inbound-workbench-column-layout";
import {
  getInboundWorkbenchColumnLayout,
  upsertInboundWorkbenchColumnLayout,
} from "@/services/inbound-workbench/persist-inbound-workbench-column-layout";

export async function GET() {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const layout = await getInboundWorkbenchColumnLayout(auth.profile.id);
    return fromServiceResult({ ok: true, data: layout });
  } catch (error) {
    logRouteError(error, {
      route: "/api/inbound-workbench/column-layout",
      method: "GET",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    let body: InboundWorkbenchColumnLayout;

    try {
      body = (await request.json()) as InboundWorkbenchColumnLayout;
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

    if (!body || typeof body !== "object") {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

    const layout = await upsertInboundWorkbenchColumnLayout(
      auth.profile.id,
      body,
    );

    return fromServiceResult({ ok: true, data: layout });
  } catch (error) {
    logRouteError(error, {
      route: "/api/inbound-workbench/column-layout",
      method: "PATCH",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}
