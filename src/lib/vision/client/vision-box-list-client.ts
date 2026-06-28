import {
  BOX_LIST_EXCEL_CONTENT_TYPE,
  buildBoxListExcelBytes,
  buildBoxListExcelFilename,
} from "@/lib/vision/build-box-list-excel-buffer";
import type { VisionExtractedData } from "@/lib/vision/types";

export function buildBoxListExcelFile(
  visionData: VisionExtractedData,
  filename = "box-list-from-image.xlsx",
): File {
  const bytes = buildBoxListExcelBytes(visionData);

  // bytes는 Uint8Array — Uint8Array.from(ArrayBuffer)는 빈 배열이 되므로 직접 전달한다.
  return new File([bytes as BlobPart], filename, {
    type: BOX_LIST_EXCEL_CONTENT_TYPE,
  });
}

export { buildBoxListExcelFilename };

export async function extractVisionDataFromImages(
  imageFiles: File[],
): Promise<{
  visionData: VisionExtractedData;
  stats: import("@/lib/vision/types").VisionExtractStats;
}> {
  const formData = new FormData();

  for (const file of imageFiles) {
    formData.append("images", file);
  }

  const response = await fetch("/api/vision/extract-box-list", {
    method: "POST",
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ok: true;
        data: {
          visionData: VisionExtractedData;
          stats: import("@/lib/vision/types").VisionExtractStats;
        };
      }
    | { ok: false; error?: string }
    | null;

  if (!response.ok || !payload || !("ok" in payload) || !payload.ok) {
    throw new Error(
      payload && "error" in payload && payload.error
        ? payload.error
        : "이미지 분석에 실패했습니다.",
    );
  }

  return payload.data;
}
