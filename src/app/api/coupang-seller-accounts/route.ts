import type { NextRequest } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { logRouteError } from "@/lib/api/log-route-error";
import { fromServiceResult, jsonError, jsonSuccess } from "@/lib/api/response";
import { createSellerAccount } from "@/services/coupang-seller-accounts/create-seller-account";
import { listSellerAccounts } from "@/services/coupang-seller-accounts/list-seller-accounts";
import type { CreateSellerAccountBody } from "@/services/coupang-seller-accounts/types";

export async function GET() {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const accounts = await listSellerAccounts();

    return jsonSuccess(accounts);
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-seller-accounts",
      method: "GET",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    let body: CreateSellerAccountBody;

    try {
      body = (await request.json()) as CreateSellerAccountBody;
    } catch {
      return jsonError("요청 본문이 올바르지 않습니다.", 400);
    }

    const result = await createSellerAccount({
      ...body,
      createdById: auth.profile.id,
    });

    return fromServiceResult(result, { successStatus: 201 });
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-seller-accounts",
      method: "POST",
    });
    return jsonError("요청 처리에 실패했습니다.", 500);
  }
}
