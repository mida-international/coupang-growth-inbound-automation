import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ShoplingInventoryRowView } from "@/services/shopling-data/types";

function formatCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "-";
  }

  return value;
}

function formatOptStatus(code: string | null): string {
  if (!code) {
    return "-";
  }

  switch (code.toUpperCase()) {
    case "B":
      return "판매";
    case "C":
      return "품절";
    case "X":
      return "미사용";
    default:
      return code;
  }
}

export function ShoplingInventoryTable({
  rows,
}: {
  rows: ShoplingInventoryRowView[];
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
              <TableHead>샵플링코드</TableHead>
              <TableHead>자사상품코드</TableHead>
              <TableHead>판매상태</TableHead>
              <TableHead>상품 구분</TableHead>
              <TableHead>바코드</TableHead>
              <TableHead>옵션명</TableHead>
              <TableHead>옵션값</TableHead>
              <TableHead className="text-right">현재고</TableHead>
              <TableHead>옵션 판매상태</TableHead>
              <TableHead>창고</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow
                key={`${row.goodsKey}|${row.barcode}|${row.optionTitle ?? ""}|${row.optionValue ?? ""}`}
              >
                <TableCell>{row.goodsKey}</TableCell>
                <TableCell>{formatCell(row.ptnGoodsCd)}</TableCell>
                <TableCell>{formatCell(row.saleStatus)}</TableCell>
                <TableCell>{formatCell(row.goodsTp)}</TableCell>
                <TableCell>{formatCell(row.barcode)}</TableCell>
                <TableCell>{formatCell(row.optionTitle)}</TableCell>
                <TableCell>{formatCell(row.optionValue)}</TableCell>
                <TableCell className="text-right">
                  {row.availableStock.toLocaleString()}
                </TableCell>
                <TableCell>{formatOptStatus(row.optStatus)}</TableCell>
                <TableCell>{formatCell(row.location)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
