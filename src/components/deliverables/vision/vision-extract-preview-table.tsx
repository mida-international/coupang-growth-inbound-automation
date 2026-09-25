import { isValidBarcodeChecksum } from "@/lib/vision/validate-barcode";
import type { VisionExtractedData } from "@/lib/vision/types";

const LOW_CONFIDENCE = 0.7;

function resolveQty(row: Record<string, string>): string {
  return row["가용"]?.trim() || row["수량"]?.trim() || "-";
}

function resolveConfidence(row: Record<string, string>): number | null {
  const raw = row.confidence ?? row["confidence"];
  const value = Number(raw);

  return Number.isNaN(value) ? null : value;
}

type VisionExtractPreviewTableProps = {
  visionData: VisionExtractedData;
};

export function VisionExtractPreviewTable({
  visionData,
}: VisionExtractPreviewTableProps) {
  if (visionData.rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">인식된 행이 없습니다.</p>
    );
  }

  const invalidBarcodeCount = visionData.rows.filter((row) => {
    const barcode = row["바코드"]?.trim();
    return barcode ? !isValidBarcodeChecksum(barcode) : false;
  }).length;
  const lowConfidenceCount = visionData.rows.filter((row) => {
    const confidence = resolveConfidence(row);
    return confidence !== null && confidence < LOW_CONFIDENCE;
  }).length;

  return (
    <div className="space-y-2">
      {invalidBarcodeCount > 0 ? (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-xs font-medium text-red-600 dark:text-red-400">
          ⚠ 바코드 {invalidBarcodeCount}건이 잘못 읽힌 것으로 보입니다(체크섬 불일치이며
          자동 교정도 되지 않음). 아래 빨간 행을 원본과 대조해 확인해 주세요.
        </p>
      ) : null}
      {lowConfidenceCount > 0 ? (
        <p className="rounded-md bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:text-amber-400">
          ⚠ 신뢰도 낮은 행 {lowConfidenceCount}건 — AI가 확실히 읽지 못한 항목입니다(노란 행).
          바코드·수량을 원본과 대조해 확인해 주세요.
        </p>
      ) : null}
      <div className="max-h-64 overflow-auto rounded-md border border-border">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="sticky top-0 bg-muted/80">
            <tr>
              <th className="px-2 py-1.5 font-medium">바코드</th>
              <th className="px-2 py-1.5 font-medium">등록상품명</th>
              <th className="px-2 py-1.5 font-medium">옵션</th>
              <th className="px-2 py-1.5 font-medium">수량</th>
              <th className="px-2 py-1.5 font-medium">신뢰도</th>
            </tr>
          </thead>
          <tbody>
            {visionData.rows.map((row, index) => {
              const confidence = resolveConfidence(row);
              const isLow = confidence !== null && confidence < LOW_CONFIDENCE;
              const barcode = row["바코드"]?.trim() ?? "";
              const isBadBarcode = barcode
                ? !isValidBarcodeChecksum(barcode)
                : false;

              return (
                <tr
                  key={`${row["바코드"] ?? index}-${index}`}
                  className={
                    isBadBarcode
                      ? "bg-red-500/15"
                      : isLow
                        ? "bg-amber-500/10"
                        : undefined
                  }
                >
                  <td className="px-2 py-1.5 font-mono">
                    {row["바코드"] ?? "-"}
                    {isBadBarcode ? (
                      <span className="ml-1 font-sans text-red-600 dark:text-red-400">
                        ⚠ 오인식
                      </span>
                    ) : null}
                  </td>
                  <td className="px-2 py-1.5">{row["등록상품명"] ?? "-"}</td>
                  <td className="px-2 py-1.5">{row["옵션"] ?? "-"}</td>
                  <td className="px-2 py-1.5">{resolveQty(row)}</td>
                  <td className="px-2 py-1.5">
                    {confidence !== null ? confidence.toFixed(2) : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
