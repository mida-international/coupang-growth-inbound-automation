import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { InboundWorkbenchRowView } from "@/services/inbound-workbench/types";

function formatCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "-";
  }

  return value;
}

export function InboundWorkbenchTable({
  rows,
}: {
  rows: InboundWorkbenchRowView[];
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
              <TableHead>상품명</TableHead>
              <TableHead>옵션명</TableHead>
              <TableHead>바코드</TableHead>
              <TableHead className="text-right">샵플링재고</TableHead>
              <TableHead>자사상품코드</TableHead>
              <TableHead className="text-right">쿠팡윙재고</TableHead>
              <TableHead className="text-right">60일판매</TableHead>
              <TableHead className="text-right">7일판매</TableHead>
              <TableHead className="text-right">30일판매</TableHead>
              <TableHead className="text-right">쿠팡자체추천</TableHead>
              <TableHead className="text-right">쿠팡입고예정</TableHead>
              <TableHead>등급</TableHead>
              <TableHead>소진예상일</TableHead>
              <TableHead>위치</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={`${row.templateId}|${row.shoplingRowKey}`}
              >
                <TableCell className="min-w-[160px]">
                  {formatCell(row.registeredProductName)}
                </TableCell>
                <TableCell className="min-w-[120px]">
                  {formatCell(row.optionName)}
                </TableCell>
                <TableCell>{formatCell(row.productBarcode)}</TableCell>
                <TableCell className="text-right">
                  {row.shoplingAvailableStock.toLocaleString()}
                </TableCell>
                <TableCell>{formatCell(row.ptnGoodsCd)}</TableCell>
                <TableCell className="text-right">
                  {row.orderableQuantity.toLocaleString()}
                </TableCell>
                <TableCell className="text-right">
                  {row.salesQty60days.toLocaleString()}
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
                <TableCell className="text-right">
                  {row.pendingInbounds.toLocaleString()}
                </TableCell>
                <TableCell>{formatCell(row.offerCondition)}</TableCell>
                <TableCell>{formatCell(row.daysOfCover)}</TableCell>
                <TableCell>{formatCell(row.location)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
