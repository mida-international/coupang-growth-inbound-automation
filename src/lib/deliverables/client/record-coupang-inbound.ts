import type { DuplicateCoupangInboundDeliverable } from "@/services/deliverables/find-duplicate-coupang-inbound-deliverables";

/** 기록하기에 사용한 원본 파일(엑셀/이미지)의 해시 정보 */
export type ClientSourceFile = {
  name: string;
  sha256: string;
  contentType: string | null;
  size: number;
};

export type CoupangInboundDuplicateCheck = {
  duplicates: DuplicateCoupangInboundDeliverable[];
  /** 기록 시 추세 시트 '(완)' 열에도 반영되는 계정인지 */
  sheetSync: boolean;
};

type SheetSyncResult = {
  status: "success" | "error";
  message: string;
  sheetUrl: string | null;
};

type ApiPayload<T> = { ok: true; data: T } | { ok: false; error?: string };

async function readPayload<T>(
  response: Response,
  fallbackError: string,
): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiPayload<T> | null;

  if (!response.ok || !payload || !payload.ok) {
    throw new Error(
      payload && !payload.ok && payload.error ? payload.error : fallbackError,
    );
  }

  return payload.data;
}

async function sha256Hex(file: File): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/** 원본 파일마다 SHA-256을 계산한다 (같은 파일/이미지 재기록 감지용). */
export async function hashSourceFiles(files: File[]): Promise<ClientSourceFile[]> {
  return Promise.all(
    files.map(async (file) => ({
      name: file.name,
      sha256: await sha256Hex(file),
      contentType: file.type || null,
      size: file.size,
    })),
  );
}

export async function checkCoupangInboundDuplicates(
  sellerId: string,
  sourceFiles: ClientSourceFile[],
): Promise<CoupangInboundDuplicateCheck> {
  const response = await fetch("/api/coupang-inbound-deliverables/check-duplicates", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seller: sellerId, sourceFiles }),
  });

  return readPayload(response, "중복 기록 확인에 실패했습니다.");
}

/** Vercel 함수 요청 본문 한도(4.5MB)보다 조금 작게 — 넘는 원본은 저장하지 않는다. */
const MAX_SOURCE_UPLOAD_BYTES = 4 * 1024 * 1024;

/** 기록 후 원본 파일을 한 장씩 저장한다 (요청 크기 제한 회피). */
async function uploadSourceFiles(
  deliverableId: string,
  files: File[],
): Promise<{ savedCount: number; tooLargeCount: number }> {
  let savedCount = 0;
  let tooLargeCount = 0;

  for (const [index, file] of files.entries()) {
    if (file.size > MAX_SOURCE_UPLOAD_BYTES) {
      tooLargeCount += 1;
      continue;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("index", String(index));

    try {
      const response = await fetch(
        `/api/coupang-inbound-deliverables/${encodeURIComponent(deliverableId)}/sources`,
        { method: "POST", body: formData },
      );

      if (response.ok) {
        savedCount += 1;
      }
    } catch {
      // 원본 저장은 best-effort — 기록은 이미 끝났다.
    }
  }

  return { savedCount, tooLargeCount };
}

/**
 * 쿠팡 입고를 기록하고(mizucos 계정은 추세 시트 '(완)' 열도 갱신), 원본 파일을 저장한다.
 * 결과를 사용자에게 보여줄 문장으로 돌려준다.
 */
export async function recordCoupangInbound(input: {
  sellerId: string;
  boxListFile: File;
  /** 사용자가 업로드한 원본 (엑셀 1개 또는 이미지 여러 장) */
  files: File[];
  sourceFiles: ClientSourceFile[];
  /** 오늘 같은 원본으로 기록된 게 있어도 기록 (팝업에서 확인함) */
  force: boolean;
}): Promise<string> {
  const formData = new FormData();
  formData.append("seller", input.sellerId);
  formData.append("boxListFile", input.boxListFile);
  formData.append("sourceFiles", JSON.stringify(input.sourceFiles));
  formData.append("force", input.force ? "true" : "false");

  const response = await fetch("/api/coupang-inbound-deliverables", {
    method: "POST",
    body: formData,
  });

  const data = await readPayload<{
    deliverableId: string;
    recordedCount: number;
    sheet: SheetSyncResult | null;
  }>(response, "입고 기록에 실패했습니다.");

  const messages = [`${data.recordedCount}개 바코드 입고를 기록했습니다.`];

  if (data.sheet) {
    messages.push(data.sheet.message);
  }

  const { savedCount, tooLargeCount } = await uploadSourceFiles(
    data.deliverableId,
    input.files,
  );

  if (savedCount < input.files.length) {
    messages.push(
      `원본 파일 ${input.files.length}개 중 ${savedCount}개만 저장했습니다${
        tooLargeCount > 0 ? ` (4MB 초과 ${tooLargeCount}개 제외)` : ""
      }. 기록과 같은 파일 감지는 정상입니다.`,
    );
  }

  return messages.join("\n");
}
