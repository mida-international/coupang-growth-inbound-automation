"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LIST_TABLE_HEADER_CLASS } from "@/components/data-list/list-table-header";
import { ShoplingPackageMappingFormDialog } from "@/components/shopling-data/shopling-package-mapping-form-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiDelete } from "@/lib/api-client";
import type { ShoplingPackageMappingRowView } from "@/services/shopling-package-mapping/types";

function formatCell(value: string | null | undefined): string {
  if (value === null || value === undefined || value.trim() === "") {
    return "-";
  }

  return value;
}

export function ShoplingPackageMappingTable({
  rows,
}: {
  rows: ShoplingPackageMappingRowView[];
}) {
  const router = useRouter();
  const [editingRow, setEditingRow] = useState<ShoplingPackageMappingRowView | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (rows.length === 0) {
    return null;
  }

  async function handleDelete(row: ShoplingPackageMappingRowView) {
    const confirmed = window.confirm(
      `패키지 옵션ID ${row.packageOptId} / 단품 옵션ID ${row.singleOptId} 매핑을 삭제할까요?`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setDeletingId(row.id);

    const result = await apiDelete<void>(
      `/api/shopling/package-mapping/${row.id}`,
    );

    setDeletingId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  return (
    <>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Table containerClassName="overflow-visible">
        <TableHeader className={LIST_TABLE_HEADER_CLASS}>
          <TableRow className="hover:bg-transparent">
            <TableHead>패키지 바코드</TableHead>
                <TableHead>패키지 샵플링코드</TableHead>
                <TableHead>패키지 자사코드</TableHead>
                <TableHead>패키지 옵션ID</TableHead>
                <TableHead>패키지 옵션값</TableHead>
                <TableHead>단품 바코드</TableHead>
                <TableHead>단품 샵플링코드</TableHead>
                <TableHead>단품 자사코드</TableHead>
                <TableHead>단품 옵션ID</TableHead>
                <TableHead>단품 옵션값</TableHead>
                <TableHead className="text-right">구성수량</TableHead>
                <TableHead>수동편집</TableHead>
                <TableHead className="text-right">작업</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{formatCell(row.packageBarcode)}</TableCell>
                  <TableCell>{row.packageGoodsKey}</TableCell>
                  <TableCell>{formatCell(row.packagePtnGoodsCd)}</TableCell>
                  <TableCell>{row.packageOptId}</TableCell>
                  <TableCell>{formatCell(row.packageOptValue)}</TableCell>
                  <TableCell>{formatCell(row.singleBarcode)}</TableCell>
                  <TableCell>{formatCell(row.singleGoodsKey)}</TableCell>
                  <TableCell>{formatCell(row.singlePtnGoodsCd)}</TableCell>
                  <TableCell>{row.singleOptId}</TableCell>
                  <TableCell>{formatCell(row.singleOptValue)}</TableCell>
                  <TableCell className="text-right">
                    {row.mapCnt.toLocaleString()}
                  </TableCell>
                  <TableCell>
                    {row.manuallyEdited ? (
                      <Badge variant="secondary">수동</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRow(row)}
                      >
                        수정
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row)}
                      >
                        {deletingId === row.id ? "삭제 중..." : "삭제"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

      <ShoplingPackageMappingFormDialog
        open={editingRow !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditingRow(null);
          }
        }}
        row={editingRow}
      />
    </>
  );
}
