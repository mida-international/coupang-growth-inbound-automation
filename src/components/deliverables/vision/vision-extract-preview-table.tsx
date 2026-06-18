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

  return (
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
            const isLow =
              confidence !== null && confidence < LOW_CONFIDENCE;

            return (
              <tr
                key={`${row["바코드"] ?? index}-${index}`}
                className={isLow ? "bg-amber-500/10" : undefined}
              >
                <td className="px-2 py-1.5 font-mono">{row["바코드"] ?? "-"}</td>
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
  );
}
