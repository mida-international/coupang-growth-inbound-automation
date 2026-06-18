import { LIST_TABLE_HEADER_CLASS } from "@/components/data-list/list-table-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { CenterSeparationRowView } from "@/services/center-separation/types";

function formatCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "-";
  }

  return value;
}

export function CenterSeparationTable({
  rows,
}: {
  rows: CenterSeparationRowView[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <Table containerClassName="overflow-visible">
      <TableHeader className={LIST_TABLE_HEADER_CLASS}>
        <TableRow>
          <TableHead>쿠팡그로스 상품이름</TableHead>
          <TableHead>옵션명</TableHead>
          <TableHead>자사상품코드</TableHead>
          <TableHead>샵플링 옵션 벨류</TableHead>
          <TableHead>바코드</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.id}>
            <TableCell className="max-w-[240px] whitespace-normal">
              {formatCell(row.registeredProductName)}
            </TableCell>
            <TableCell className="max-w-[200px] whitespace-normal">
              {formatCell(row.optionName)}
            </TableCell>
            <TableCell>{formatCell(row.ptnGoodsCd)}</TableCell>
            <TableCell className="max-w-[200px] whitespace-normal">
              {formatCell(row.shoplingOptionValue)}
            </TableCell>
            <TableCell className="font-mono text-sm">
              {formatCell(row.barcode)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
