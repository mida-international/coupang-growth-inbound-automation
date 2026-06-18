import { DataListPanel } from "@/components/data-list/data-list-panel";
import { DataListTableScrollArea } from "@/components/data-list/data-list-table-scroll-area";
import { CenterSeparationTable } from "@/components/center-separation/center-separation-table";
import { CenterSeparationToolbar } from "@/components/center-separation/center-separation-toolbar";
import type { ListCenterSeparationResult } from "@/services/center-separation/types";

type CenterSeparationPanelProps = {
  data: ListCenterSeparationResult;
  search: string;
  page: number;
  pageSize: number;
};

export function CenterSeparationPanel({
  data,
  search,
  page,
  pageSize,
}: CenterSeparationPanelProps) {
  const isSearchEmpty = search.trim().length === 0;
  const hasAnyRows = data.totalCount > 0;
  const dbIsEmpty = !hasAnyRows && isSearchEmpty;

  if (dbIsEmpty) {
    return (
      <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          등록된 센터분리 데이터가 없습니다.
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          상단에서 바코드를 입력하거나 엑셀로 등록해 주세요.
        </p>
      </div>
    );
  }

  return (
    <DataListPanel>
      <CenterSeparationToolbar
        search={search}
        page={page}
        pageSize={pageSize}
        totalCount={data.totalCount}
      />

      {data.totalCount === 0 && !isSearchEmpty ? (
        <div className="rounded-md border border-dashed border-border bg-muted/30 px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">검색 결과가 없습니다.</p>
        </div>
      ) : (
        <DataListTableScrollArea>
          <CenterSeparationTable rows={data.rows} />
        </DataListTableScrollArea>
      )}
    </DataListPanel>
  );
}
