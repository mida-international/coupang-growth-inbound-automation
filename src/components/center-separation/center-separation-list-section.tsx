"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { CenterSeparationTable } from "@/components/center-separation/center-separation-table";
import { CenterSeparationToolbar } from "@/components/center-separation/center-separation-toolbar";
import { DataListPanel } from "@/components/data-list/data-list-panel";
import { DataListTableScrollArea } from "@/components/data-list/data-list-table-scroll-area";
import { apiPost } from "@/lib/api-client";
import type {
  DeleteCenterSeparationResult,
  ListCenterSeparationResult,
} from "@/services/center-separation/types";

type CenterSeparationListSectionProps = {
  data: ListCenterSeparationResult;
  search: string;
  page: number;
  pageSize: number;
};

export function CenterSeparationListSection({
  data,
  search,
  page,
  pageSize,
}: CenterSeparationListSectionProps) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rowIdsKey = data.rows.map((row) => row.id).join(",");

  useEffect(() => {
    setSelectedIds(new Set());
    setError(null);
  }, [rowIdsKey, page, search]);

  async function handleBulkDelete() {
    const count = selectedIds.size;

    if (count === 0) {
      return;
    }

    const confirmed = window.confirm(
      `선택한 ${count.toLocaleString()}건의 센터분리 바코드를 삭제할까요?`,
    );

    if (!confirmed) {
      return;
    }

    setError(null);
    setIsDeleting(true);

    const result = await apiPost<DeleteCenterSeparationResult>(
      "/api/coupang-growth/center-separation/bulk-delete",
      { ids: [...selectedIds] },
    );

    setIsDeleting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSelectedIds(new Set());
    router.refresh();
  }

  const isSearchEmpty = search.trim().length === 0;

  return (
    <DataListPanel>
      <CenterSeparationToolbar
        search={search}
        page={page}
        pageSize={pageSize}
        totalCount={data.totalCount}
        selectedCount={selectedIds.size}
        onBulkDelete={handleBulkDelete}
        isDeleting={isDeleting}
      />

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {data.totalCount === 0 && !isSearchEmpty ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <DataListTableScrollArea>
          <CenterSeparationTable
            rows={data.rows}
            selectedIds={selectedIds}
            onSelectedIdsChange={setSelectedIds}
          />
        </DataListTableScrollArea>
      )}
    </DataListPanel>
  );
}
