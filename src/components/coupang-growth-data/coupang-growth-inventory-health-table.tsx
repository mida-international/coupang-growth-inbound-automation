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
    <Table containerClassName="overflow-visible">
      <TableHeader className="sticky top-0 z-20 bg-muted/40">
        <TableRow className="hover:bg-transparent">
          <TableHead className="bg-muted/40">판매자 계정</TableHead>
          <TableHead className="bg-muted/40">등록상품명</TableHead>
          <TableHead className="bg-muted/40">옵션명</TableHead>
          <TableHead className="bg-muted/40">옵션 ID</TableHead>
          <TableHead className="bg-muted/40">바코드</TableHead>
          <TableHead className="bg-muted/40">샵플링 자사상품코드</TableHead>
          <TableHead className="bg-muted/40 text-right">주문가능재고</TableHead>
          <TableHead className="bg-muted/40 text-right">입고예정</TableHead>
          <TableHead className="bg-muted/40 text-right">7일 판매수량</TableHead>
          <TableHead className="bg-muted/40 text-right">30일 판매수량</TableHead>
          <TableHead className="bg-muted/40 text-right">추천입고수량</TableHead>
          <TableHead className="bg-muted/40">Offer condition</TableHead>
          <TableHead className="bg-muted/40">Days of cover</TableHead>
          <TableHead className="bg-muted/40">재고 스냅샷일</TableHead>
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
  );
}
