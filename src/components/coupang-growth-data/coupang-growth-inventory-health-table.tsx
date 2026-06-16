import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InventoryHealthRowView } from "@/services/coupang-growth-data/types";

function formatCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "-";
  }

  return value;
}

export function CoupangGrowthInventoryHealthTable({
  rows,
}: {
  rows: InventoryHealthRowView[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-md border border-border bg-background">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="hover:bg-transparent">
              <TableHead>판매자 계정</TableHead>
              <TableHead>등록상품명</TableHead>
              <TableHead>옵션명</TableHead>
              <TableHead>옵션 ID</TableHead>
              <TableHead>바코드</TableHead>
              <TableHead>샵플링 자사상품코드</TableHead>
              <TableHead className="text-right">주문가능재고</TableHead>
              <TableHead className="text-right">입고예정</TableHead>
              <TableHead className="text-right">7일 판매수량</TableHead>
              <TableHead className="text-right">30일 판매수량</TableHead>
              <TableHead className="text-right">추천입고수량</TableHead>
              <TableHead>Offer condition</TableHead>
              <TableHead>Days of cover</TableHead>
              <TableHead>재고 스냅샷일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={`${row.sellerDisplayName}|${row.optionId ?? ""}|${row.productBarcode ?? ""}|${row.healthSnapshotDate}`}
              >
                <TableCell>{row.sellerDisplayName}</TableCell>
                <TableCell>{formatCell(row.registeredProductName)}</TableCell>
                <TableCell>{formatCell(row.optionName)}</TableCell>
                <TableCell>{formatCell(row.optionId)}</TableCell>
                <TableCell>{formatCell(row.productBarcode)}</TableCell>
                <TableCell>{formatCell(row.ptnGoodsCd)}</TableCell>
                <TableCell className="text-right">
                  {row.orderableQuantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {row.pendingInbounds.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {row.recentSalesQty7days.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {row.recentSalesQty30days.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {row.recommendedInboundQty.toLocaleString()}
                </TableCell>
                <TableCell>{formatCell(row.offerCondition)}</TableCell>
                <TableCell>{formatCell(row.daysOfCover)}</TableCell>
                <TableCell>{row.healthSnapshotDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
