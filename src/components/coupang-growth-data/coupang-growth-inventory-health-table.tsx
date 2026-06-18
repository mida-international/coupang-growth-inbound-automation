import {
  LIST_TABLE_HEADER_CLASS,
  LIST_TABLE_STICKY_HEAD_CLASS,
} from "@/components/data-list/list-table-header";
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
      <TableHeader className={LIST_TABLE_HEADER_CLASS}>
        <TableRow className="hover:bg-transparent">
          <TableHead className={LIST_TABLE_STICKY_HEAD_CLASS}>판매자 계정</TableHead>
          <TableHead className={LIST_TABLE_STICKY_HEAD_CLASS}>등록상품명</TableHead>
          <TableHead className={LIST_TABLE_STICKY_HEAD_CLASS}>옵션명</TableHead>
          <TableHead className={LIST_TABLE_STICKY_HEAD_CLASS}>옵션 ID</TableHead>
          <TableHead className={LIST_TABLE_STICKY_HEAD_CLASS}>바코드</TableHead>
          <TableHead className={LIST_TABLE_STICKY_HEAD_CLASS}>샵플링 자사상품코드</TableHead>
          <TableHead className={`${LIST_TABLE_STICKY_HEAD_CLASS} text-right`}>
            주문가능재고
          </TableHead>
          <TableHead className={`${LIST_TABLE_STICKY_HEAD_CLASS} text-right`}>
            입고예정
          </TableHead>
          <TableHead className={`${LIST_TABLE_STICKY_HEAD_CLASS} text-right`}>
            7일 판매수량
          </TableHead>
          <TableHead className={`${LIST_TABLE_STICKY_HEAD_CLASS} text-right`}>
            30일 판매수량
          </TableHead>
          <TableHead className={`${LIST_TABLE_STICKY_HEAD_CLASS} text-right`}>
            추천입고수량
          </TableHead>
          <TableHead className={LIST_TABLE_STICKY_HEAD_CLASS}>Offer condition</TableHead>
          <TableHead className={LIST_TABLE_STICKY_HEAD_CLASS}>Days of cover</TableHead>
          <TableHead className={LIST_TABLE_STICKY_HEAD_CLASS}>재고 스냅샷일</TableHead>
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
