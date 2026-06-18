"use client";

import { LIST_TABLE_HEADER_CLASS } from "@/components/data-list/list-table-header";
import { Checkbox } from "@/components/ui/checkbox";
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

type CenterSeparationTableProps = {
  rows: CenterSeparationRowView[];
  selectedIds: Set<string>;
  onSelectedIdsChange: (next: Set<string>) => void;
};

export function CenterSeparationTable({
  rows,
  selectedIds,
  onSelectedIdsChange,
}: CenterSeparationTableProps) {
  if (rows.length === 0) {
    return null;
  }

  const pageIds = rows.map((row) => row.id);
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));

  function toggleRow(id: string, checked: boolean) {
    const next = new Set(selectedIds);

    if (checked) {
      next.add(id);
    } else {
      next.delete(id);
    }

    onSelectedIdsChange(next);
  }

  function toggleAllOnPage(checked: boolean) {
    const next = new Set(selectedIds);

    for (const id of pageIds) {
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
    }

    onSelectedIdsChange(next);
  }

  return (
    <Table containerClassName="overflow-visible">
      <TableHeader className={LIST_TABLE_HEADER_CLASS}>
        <TableRow>
          <TableHead className="w-10">
            <Checkbox
              checked={allPageSelected}
              onCheckedChange={(nextChecked) =>
                toggleAllOnPage(nextChecked === true)
              }
              aria-label="현재 페이지 전체 선택"
            />
          </TableHead>
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
            <TableCell>
              <Checkbox
                checked={selectedIds.has(row.id)}
                onCheckedChange={(nextChecked) =>
                  toggleRow(row.id, nextChecked === true)
                }
                aria-label={`${row.barcode} 선택`}
              />
            </TableCell>
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
