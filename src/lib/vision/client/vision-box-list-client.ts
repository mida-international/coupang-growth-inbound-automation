import * as XLSX from "xlsx";

import { convertVisionDataToBoxItems } from "@/lib/vision/convert-vision-to-box-items";
import type { VisionExtractedData } from "@/lib/vision/types";

export function buildBoxListExcelFile(
  visionData: VisionExtractedData,
  filename = "box-list-from-image.xlsx",
): File {
  const { items } = convertVisionDataToBoxItems(visionData);

  const rows = items.map((item) => ({
    바코드: item.barcode,
    수량: item.quantity,
    ...(item.productName ? { 등록상품명: item.productName } : {}),
    ...(item.optionName ? { 옵션: item.optionName } : {}),
    ...(item.location ? { location: item.location } : {}),
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Sheet1");
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });

  return new File([buffer], filename, {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}

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
