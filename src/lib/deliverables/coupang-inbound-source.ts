import { createHash } from "node:crypto";

/** 쿠팡 입고 기록하기에 사용한 원본 파일(엑셀 또는 이미지) 1개 */
export type CoupangInboundSourceFile = {
  name: string;
  sha256: string;
  contentType: string | null;
  size: number | null;
  /** 원본을 Storage에 저장했으면 경로, 저장 전·실패면 null */
  storagePath: string | null;
};

const SHA256_HEX = /^[0-9a-f]{64}$/;

export function isSha256Hex(value: string): boolean {
  return SHA256_HEX.test(value);
}

/**
 * 원본 파일 해시 목록으로 기록 지문을 만든다.
 * 파일 순서가 달라도 같은 원본 묶음이면 같은 지문이 나온다.
 */
export function computeSourceFingerprint(sha256List: string[]): string | null {
  const hashes = sha256List.filter(isSha256Hex);

  if (hashes.length === 0) {
    return null;
  }

  return createHash("sha256")
    .update([...hashes].sort().join("\n"))
    .digest("hex");
}

/** DB(JSONB)에 저장된 원본 파일 목록을 읽는다. 형식이 맞지 않는 항목은 건너뛴다. */
export function parseCoupangInboundSourceFiles(
  value: unknown,
): CoupangInboundSourceFile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;

    if (typeof record.name !== "string" || typeof record.sha256 !== "string") {
      return [];
    }

    return [
      {
        name: record.name,
        sha256: record.sha256,
        contentType:
          typeof record.contentType === "string" ? record.contentType : null,
        size: typeof record.size === "number" ? record.size : null,
        storagePath:
          typeof record.storagePath === "string" ? record.storagePath : null,
      },
    ];
  });
}

/** 브라우저가 보낸 원본 파일 해시 목록을 검증해 읽는다 (Storage 경로는 아직 없음). */
export function parseClientSourceFiles(value: unknown): CoupangInboundSourceFile[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }

    const record = item as Record<string, unknown>;
    const sha256 = typeof record.sha256 === "string" ? record.sha256 : "";

    if (typeof record.name !== "string" || !isSha256Hex(sha256)) {
      return [];
    }

    return [
      {
        name: record.name.slice(0, 255),
        sha256,
        contentType:
          typeof record.contentType === "string" ? record.contentType : null,
        size: typeof record.size === "number" ? record.size : null,
        storagePath: null,
      },
    ];
  });
}
