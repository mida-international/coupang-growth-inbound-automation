import { NextResponse } from "next/server";

import { requireApiProfile } from "@/lib/api/auth";
import { resolveActiveSellerAccount } from "@/lib/api/download-helpers";
import { logRouteError } from "@/lib/api/log-route-error";
import { jsonError, jsonSuccess } from "@/lib/api/response";
import {
  computeSourceFingerprint,
  parseClientSourceFiles,
  type CoupangInboundSourceFile,
} from "@/lib/deliverables/coupang-inbound-source";
import { getLatestInboundTemplateFile } from "@/services/coupang-growth-sync/get-latest-inbound-template-file";
import { findDuplicateCoupangInboundDeliverables } from "@/services/deliverables/find-duplicate-coupang-inbound-deliverables";
import { listCoupangInboundDeliverables } from "@/services/deliverables/list-coupang-inbound-deliverables";
import { recordCoupangInbound } from "@/services/deliverables/record-coupang-inbound";
import {
  isTrendsAutoPushAccount,
  syncCoupangTrendsColumn,
  toKstIsoDate,
} from "@/services/inbound-trends/sync-coupang-trends-column";

export const runtime = "nodejs";
// 기록 후 추세 시트 반영(Google Sheets API 여러 번 호출)까지 기다린다.
export const maxDuration = 60;

/**
 * 폼의 sourceFiles(JSON): 브라우저가 계산한 원본 파일(엑셀/이미지) 해시 목록.
 * 원본 자체는 기록 후 /[id]/sources 로 한 장씩 따로 올린다 (요청 크기 제한 회피).
 */
function parseSourceFilesField(
  value: FormDataEntryValue | null,
): CoupangInboundSourceFile[] {
  if (typeof value !== "string" || value.trim().length === 0) {
    return [];
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(value);
  } catch {
    return [];
  }

  return parseClientSourceFiles(parsed);
}

export async function GET(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const pageSize = Number(url.searchParams.get("pageSize")) || undefined;

    const result = await listCoupangInboundDeliverables({ page, pageSize });

    return jsonSuccess(result);
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-inbound-deliverables",
      method: "GET",
    });

    return jsonError("쿠팡그로스 입고리스트 기록 목록 조회에 실패했습니다.", 500);
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireApiProfile();

    if ("response" in auth) {
      return auth.response;
    }

    const formData = await request.formData();
    const sellerId = formData.get("seller");
    const boxListFile = formData.get("boxListFile");

    if (typeof sellerId !== "string" || sellerId.trim().length === 0) {
      return jsonError("판매자 계정을 선택해 주세요.", 400);
    }

    if (!(boxListFile instanceof File)) {
      return jsonError("박스 입고 리스트 엑셀 파일을 선택해 주세요.", 400);
    }

    const seller = await resolveActiveSellerAccount(sellerId.trim());

    if (!seller) {
      return jsonError("유효한 판매자 계정이 아닙니다.", 400);
    }

    const templateFile = await getLatestInboundTemplateFile(sellerId.trim());

    if (!templateFile) {
      return jsonError(
        "저장된 WING 입고 템플릿이 없습니다. 데이터 동기화 > 쿠팡 Growth에서 입고 템플릿을 먼저 업로드해주세요.",
        400,
      );
    }

    const sourceFiles = parseSourceFilesField(formData.get("sourceFiles"));
    const sourceFingerprint = computeSourceFingerprint(
      sourceFiles.map((file) => file.sha256),
    );
    const force = formData.get("force") === "true";

    // 오늘 같은 계정에 같은 원본으로 기록했으면, 사용자가 확인(force)하기 전에는 기록하지 않는다.
    if (sourceFingerprint && !force) {
      const duplicates = await findDuplicateCoupangInboundDeliverables(
        seller.id,
        sourceFingerprint,
      );

      if (duplicates.length > 0) {
        return NextResponse.json(
          {
            ok: false,
            error:
              "오늘 같은 원본 파일로 이미 기록했습니다. 기존 기록을 확인해 주세요.",
            duplicates,
          },
          { status: 409 },
        );
      }
    }

    const boxListBuffer = Buffer.from(await boxListFile.arrayBuffer());

    const result = await recordCoupangInbound({
      coupangSellerAccountId: seller.id,
      recordedById: auth.profile.id,
      templateBuffer: templateFile.buffer,
      boxListInput: {
        source: "excel",
        boxListBuffer,
      },
      sourceFileName:
        sourceFiles.length > 1
          ? `${sourceFiles[0].name} 외 ${sourceFiles.length - 1}개`
          : (sourceFiles[0]?.name ?? boxListFile.name),
      sourceFingerprint,
      sourceFiles,
    });

    // mizucos 계정은 기록 직후 추세 시트의 '오늘(완)' 열을 그날 합계로 다시 반영한다.
    const sheet = isTrendsAutoPushAccount(seller.displayName)
      ? await syncCoupangTrendsColumn({
          coupangSellerAccountId: seller.id,
          isoDate: toKstIsoDate(new Date()),
          insertIfMissing: true,
        })
      : null;

    return jsonSuccess({ ...result, sheet });
  } catch (error) {
    logRouteError(error, {
      route: "/api/coupang-inbound-deliverables",
      method: "POST",
    });

    const message =
      error instanceof Error ? error.message : "입고 기록에 실패했습니다.";

    return jsonError(message, message.includes("판매자") ? 400 : 500);
  }
}
