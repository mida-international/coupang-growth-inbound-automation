import { LIST_TABLE_HEADER_CLASS } from "@/components/data-list/list-table-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ShoplingNewOptionProductRowView } from "@/services/shopling-data/types";

function formatCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "-";
  }

  return value;
}

export function ShoplingNewOptionProductsTable({
  rows,
}: {
  rows: ShoplingNewOptionProductRowView[];
}) {
  if (rows.length === 0) {
    return null;
  }

  return (
    <Table containerClassName="overflow-visible">
      <TableHeader className={LIST_TABLE_HEADER_CLASS}>
        <TableRow className="hover:bg-transparent">
          <TableHead>샵플링코드</TableHead>
              <TableHead>옵션코드</TableHead>
              <TableHead>자사상품코드</TableHead>
              <TableHead>옵션</TableHead>
              <TableHead>바코드</TableHead>
              <TableHead>추가일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.optId}>
                <TableCell>{row.goodsKey}</TableCell>
                <TableCell>{row.optId}</TableCell>
                <TableCell>{formatCell(row.ptnGoodsCd)}</TableCell>
                <TableCell>{formatCell(row.optionValue)}</TableCell>
                <TableCell>{formatCell(row.barcode)}</TableCell>
                <TableCell>{row.firstAddedDate}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
  );
}
